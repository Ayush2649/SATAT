"""C1 research starter: frozen DINOv2 features + trained linear head.

No images, API keys, detector, portion regressor or app integration are bundled.
The model's final test set is read only by the separate predict command.
"""
import argparse
import copy
import json
import os
import platform
import random
from pathlib import Path

from benchmark import (POLICY, digest, evaluate, file_digest, image_path, metrics,
                       read_json, validate_manifest)

BACKBONE_REF = "facebookresearch/dinov2:7764ea0f912e53c92e82eb78a2a1631e92725fc8"
BACKBONE = "dinov2_vits14"


def preprocess(path):
    import numpy as np
    import torch
    from PIL import Image, ImageOps
    with Image.open(path) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        # Match the ImageNet mean/std used by the pretrained feature backbone.
        image = ImageOps.fit(image, (224, 224), method=Image.Resampling.BICUBIC)
        tensor = torch.from_numpy(np.asarray(image).copy()).permute(2, 0, 1).float() / 255
    return (tensor - tensor.new_tensor([.485, .456, .406])[:, None, None]) / tensor.new_tensor([.229, .224, .225])[:, None, None]


def load_backbone(device):
    import hashlib
    import torch
    model = torch.hub.load(BACKBONE_REF, BACKBONE, pretrained=True, trust_repo=True).eval().to(device)
    model.requires_grad_(False)
    sha = hashlib.sha256()
    for key, value in sorted(model.state_dict().items()):
        sha.update(key.encode())
        sha.update(str(value.dtype).encode())
        sha.update(str(tuple(value.shape)).encode())
        sha.update(value.detach().cpu().contiguous().numpy().tobytes())
    return model, sha.hexdigest()


def extract(rows, root, model, device, batch_size):
    import torch
    features = []
    with torch.inference_mode():
        for start in range(0, len(rows), batch_size):
            batch = torch.stack([preprocess(image_path(root, row["image"])) for row in rows[start:start+batch_size]])
            features.append(model(batch.to(device)).float().cpu())
            print(f"Encoded {min(start + batch_size, len(rows))}/{len(rows)} images", flush=True)
    return torch.cat(features)


def fit_head(train_x, train_y, val_x, val_y, classes, config, output, resume=False):
    import torch
    torch.manual_seed(config["seed"])
    head = torch.nn.Linear(train_x.shape[1], len(classes)).to(train_x.device)
    optimiser = torch.optim.AdamW(head.parameters(), lr=config["learning_rate"], weight_decay=.01)
    start, best_score, best_state = 0, -1.0, None
    checkpoint = output / "last.pt"
    config_sha = digest(config)
    if resume:
        previous = torch.load(checkpoint, map_location=train_x.device, weights_only=True)
        if previous["config_sha256"] != config_sha:
            raise ValueError("Resume configuration or dataset differs from checkpoint")
        head.load_state_dict(previous["head"])
        optimiser.load_state_dict(previous["optimiser"])
        start, best_score, best_state = previous["epoch"], previous["best_score"], previous["best_head"]
    counts = torch.bincount(train_y, minlength=len(classes)).float()
    if (counts == 0).any():
        raise ValueError("Training set omits a class")
    loss_function = torch.nn.CrossEntropyLoss(weight=(1/counts).to(train_x.device))
    for epoch in range(start, config["epochs"]):
        head.train()
        generator = torch.Generator().manual_seed(config["seed"] + epoch)
        order = torch.randperm(len(train_y), generator=generator)
        for offset in range(0, len(order), config["batch_size"]):
            index = order[offset:offset+config["batch_size"]].to(train_x.device)
            optimiser.zero_grad()
            loss = loss_function(head(train_x[index]), train_y[index])
            loss.backward()
            optimiser.step()
        head.eval()
        with torch.no_grad():
            predicted = head(val_x).argmax(1)
            recalls = [(predicted[val_y == i] == i).float().mean().item() for i in range(len(classes))]
            score = sum(recalls)/len(recalls)
        if score > best_score:
            best_score = score
            best_state = copy.deepcopy(head.state_dict())
        payload = {"head": head.state_dict(), "optimiser": optimiser.state_dict(), "epoch": epoch+1,
                   "best_head": best_state, "best_score": best_score, "config_sha256": config_sha}
        temporary = output / "last.tmp"
        torch.save(payload, temporary)
        temporary.replace(checkpoint)
        print(f"Epoch {epoch+1}: validation macro recall {score:.4f}", flush=True)
    if best_state is None:
        raise ValueError("No completed training epoch")
    head.load_state_dict(best_state)
    head.eval()
    return head


def calibrate(logits, rows, classes, policy):
    import torch
    if not rows or any(row["split"] != "validation" for row in rows):
        raise ValueError("Calibration accepts validation rows only")
    known = [i for i, row in enumerate(rows) if row["label"] in classes]
    if not known:
        raise ValueError("Validation requires known classes")
    target = torch.tensor([classes.index(rows[i]["label"]) for i in known], device=logits.device)
    temperatures = [.5, .75, 1., 1.5, 2., 3., 5.]
    temperature = min(temperatures, key=lambda t: torch.nn.functional.cross_entropy(logits[known]/t, target).item())
    probabilities = (logits/temperature).softmax(1)
    confidence, labels = probabilities.max(1)
    predictions = {row["id"]: {"label": classes[int(labels[i])], "confidence": float(confidence[i])} for i, row in enumerate(rows)}
    choices = []
    for threshold in [i/100 for i in range(0, 101)]:
        result = metrics(rows, predictions, threshold, classes)
        groups = result["unknown_groups"]
        if (result["accepted_precision"] >= policy["min_accepted_precision"]
                and result["known_coverage"] >= policy["min_known_coverage"]
                and all(kind in groups and groups[kind]["acceptance"] <= policy["max_unknown_acceptance"] for kind in policy["unknown_kinds"])):
            choices.append((result["known_coverage"], threshold))
    # Retain a failed calibration explicitly, rather than silently qualifying it.
    threshold = max(choices, key=lambda pair: (pair[0], pair[1]))[1] if choices else 1.0
    return {"selection_split": "validation", "validation_ids_sha256": digest(sorted(r["id"] for r in rows)),
            "temperature": temperature, "threshold": threshold, "validation_operating_point_passed": bool(choices),
            "validation_metrics": metrics(rows, predictions, threshold, classes)}


def main():
    os.environ.setdefault("CUBLAS_WORKSPACE_CONFIG", ":4096:8")
    import numpy as np
    import torch
    import PIL
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["train", "predict"])
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--data-root", required=True)
    parser.add_argument("--output", required=True, help="Persistent run directory outside Git")
    parser.add_argument("--scope", choices=["production", "research"], default="production")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--learning-rate", type=float, default=.001)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--allow-cpu-smoke", action="store_true")
    args = parser.parse_args()
    if args.epochs <= 0 or args.batch_size <= 0 or not 0 < args.learning_rate < 1:
        raise ValueError("Invalid training configuration")
    if not torch.cuda.is_available() and not args.allow_cpu_smoke:
        raise RuntimeError("No CUDA GPU available. Assign a Colab GPU, or explicitly use --allow-cpu-smoke for a small development check.")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    if device == "cuda":
        torch.cuda.manual_seed_all(args.seed)
    torch.backends.cudnn.benchmark = False
    torch.use_deterministic_algorithms(True)
    data = read_json(args.manifest)
    validation = validate_manifest(data, args.data_root, args.scope)
    # Decode every image before an expensive run, without exposing test images to the model.
    from PIL import Image
    for row in data["samples"]:
        with Image.open(image_path(args.data_root, row["image"])) as image:
            image.verify()
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    classes = data["classes"]
    policy = read_json(POLICY)
    config = {"manifest_sha256": validation["manifest_sha256"], "scope": args.scope, "backbone": BACKBONE,
              "backbone_ref": BACKBONE_REF, "preprocessing": "fit224_bicubic_imagenet_v1", "seed": args.seed,
              "epochs": args.epochs, "batch_size": args.batch_size, "learning_rate": args.learning_rate}
    model, backbone_sha = load_backbone(device)
    config["backbone_weights_sha256"] = backbone_sha
    if args.command == "train":
        if not args.resume and (output / "last.pt").exists():
            raise ValueError("Run directory already contains a checkpoint; use --resume or a new directory")
        rows = [r for r in data["samples"] if r["split"] != "test"]
        cache_file = output / "features.pt"
        cache_sha = digest({"manifest": validation["manifest_sha256"], "backbone": backbone_sha,
                            "preprocessing": config["preprocessing"], "ids": [r["id"] for r in rows]})
        if args.resume and cache_file.exists():
            cached = torch.load(cache_file, map_location="cpu", weights_only=True)
            if cached["cache_sha256"] != cache_sha:
                raise ValueError("Feature cache differs from run")
            features = cached["features"]
        else:
            features = extract(rows, args.data_root, model, device, args.batch_size)
            torch.save({"cache_sha256": cache_sha, "features": features}, cache_file)
        train_idx = [i for i, r in enumerate(rows) if r["split"] == "train"]
        known_val_idx = [i for i, r in enumerate(rows) if r["split"] == "validation" and r["label"] in classes]
        train_y = torch.tensor([classes.index(rows[i]["label"]) for i in train_idx], device=device)
        val_y = torch.tensor([classes.index(rows[i]["label"]) for i in known_val_idx], device=device)
        head = fit_head(features[train_idx].to(device), train_y, features[known_val_idx].to(device), val_y, classes, config, output, args.resume)
        head_file = output / "head.pt"
        torch.save({"head": head.state_dict(), "classes": classes, "config": config}, head_file)
        val_idx = [i for i, r in enumerate(rows) if r["split"] == "validation"]
        with torch.no_grad():
            calibration = calibrate(head(features[val_idx].to(device)), [rows[i] for i in val_idx], classes, policy)
        calibration.update({"manifest_sha256": validation["manifest_sha256"], "model_sha256": file_digest(head_file), "scope": args.scope})
        (output / "calibration.json").write_text(json.dumps(calibration, indent=2), encoding="utf-8")
        metadata = {"config": config, "python": platform.python_version(), "torch": str(torch.__version__),
                    "numpy": np.__version__, "pillow": PIL.__version__, "device": device,
                    "gpu": torch.cuda.get_device_name() if device == "cuda" else None,
                    "model_sha256": file_digest(head_file), "calibration_sha256": digest(calibration),
                    "production_qualified": False}
        (output / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        print(json.dumps({"status": "head_training_complete", "validation_operating_point_passed": calibration["validation_operating_point_passed"], "production_qualified": False}))
    else:
        head_file = output / "head.pt"
        checkpoint = torch.load(head_file, map_location=device, weights_only=True)
        trained = checkpoint["config"]
        for key in ("manifest_sha256", "backbone", "backbone_ref", "backbone_weights_sha256", "preprocessing", "scope"):
            if trained[key] != config[key]:
                raise ValueError(f"Prediction configuration mismatch: {key}")
        if checkpoint["classes"] != classes:
            raise ValueError("Checkpoint taxonomy mismatch")
        calibration = read_json(output / "calibration.json")
        if calibration["model_sha256"] != file_digest(head_file) or calibration["manifest_sha256"] != validation["manifest_sha256"]:
            raise ValueError("Calibration/checkpoint mismatch")
        rows = [r for r in data["samples"] if r["split"] == "test"]
        features = extract(rows, args.data_root, model, device, args.batch_size)
        head = torch.nn.Linear(features.shape[1], len(classes)).to(device)
        head.load_state_dict(checkpoint["head"])
        head.eval()
        with torch.no_grad():
            confidence, labels = (head(features.to(device))/calibration["temperature"]).softmax(1).max(1)
        predictions = {"manifest_sha256": validation["manifest_sha256"], "model_sha256": file_digest(head_file),
                       "calibration_sha256": digest(calibration), "predictions": [
                           {"id": row["id"], "label": classes[int(labels[i])], "confidence": float(confidence[i])} for i, row in enumerate(rows)]}
        (output / "predictions.json").write_text(json.dumps(predictions, indent=2), encoding="utf-8")
        report = evaluate(data, predictions, calibration, policy)
        report["scope"] = args.scope
        (output / "classifier-report.json").write_text(json.dumps(report, indent=2, allow_nan=False), encoding="utf-8")
        print(json.dumps(report, indent=2, allow_nan=False))
        return 1 if report["status"] == "failed" else 0
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
