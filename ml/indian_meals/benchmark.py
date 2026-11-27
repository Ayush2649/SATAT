"""Offline classifier data/acceptance checks. No credentials, network or ML imports.

Passing this protocol qualifies only a crop-classifier candidate. It never
qualifies the thali/portion/nutrition pipeline or verifies permission attestations.
"""
import argparse
import hashlib
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

POLICY = Path(__file__).with_name("acceptance.v1.json")
UNKNOWN_KINDS = {"unsupported_indian", "international", "non_food", "ambiguous"}


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"),
                                     allow_nan=False).encode()).hexdigest()


def file_digest(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def read_json(path):
    def reject_constant(value):
        raise ValueError(f"Non-finite JSON number: {value}")
    return json.loads(Path(path).read_text(encoding="utf-8-sig"), parse_constant=reject_constant)


def number(value, name, low=0, high=1):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
        raise ValueError(f"Invalid {name}")
    return float(value)


def text(value, name):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Missing {name}")
    return value


def image_path(root, relative):
    relative = text(relative, "image")
    candidate = Path(relative)
    # Require portable POSIX relative paths, including when validation runs on Linux.
    if candidate.is_absolute() or "\\" in relative or ":" in relative or ".." in candidate.parts:
        raise ValueError("Image must be a safe relative path")
    target = (Path(root).resolve() / candidate).resolve()
    if not target.is_relative_to(Path(root).resolve()) or not target.is_file():
        raise ValueError(f"Missing/unsafe image: {relative}")
    return target


def validate_manifest(data, root, scope="production"):
    if not isinstance(data, dict):
        raise ValueError("Manifest must be an object")
    if scope not in {"research", "production"}:
        raise ValueError("Scope must be research or production")
    if scope == "production" and data.get("research_only") is True:
        raise ValueError("Research-only derived dataset cannot be used in production scope")
    text(data.get("dataset_id"), "dataset_id")
    text(data.get("version"), "version")
    classes = data.get("classes", [])
    if not isinstance(classes, list) or len(classes) < 2 or any(not isinstance(c, str) or not c.strip() or c == "unknown" for c in classes):
        raise ValueError("Provide at least two named classes; unknown is not a training class")
    if len(set(classes)) != len(classes):
        raise ValueError("Duplicate classes")
    sources = {}
    source_rows = data.get("sources", [])
    if not isinstance(source_rows, list) or any(not isinstance(s, dict) for s in source_rows):
        raise ValueError("Sources must be objects in a list")
    for source in source_rows:
        sid = text(source.get("id"), "source id")
        if sid in sources:
            raise ValueError("Duplicate source id")
        text(source.get("url"), "source url")
        evidence = text(source.get("permission_reference"), "permission_reference")
        if "REPLACE" in evidence or source.get("approved") is not True or source.get("approved_scope") not in {"production", "research"}:
            raise ValueError(f"Unapproved source: {sid}")
        if scope == "production" and source["approved_scope"] != "production":
            raise ValueError(f"Research-only source in production dataset: {sid}")
        sources[sid] = source
    rows = data.get("samples", [])
    if not isinstance(rows, list) or not rows:
        raise ValueError("Empty dataset")
    ids, hashes, groups = set(), set(), {}
    counts = Counter()
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Samples must be objects")
        sid = text(row.get("id"), "sample id")
        if sid in ids:
            raise ValueError(f"Duplicate sample id: {sid}")
        ids.add(sid)
        split = row.get("split")
        if split not in {"train", "validation", "test"} or row.get("label") not in classes + ["unknown"]:
            raise ValueError(f"Invalid split/label: {sid}")
        if row.get("source_id") not in sources:
            raise ValueError(f"Unregistered source: {sid}")
        text(row.get("region"), "region")
        group = text(row.get("group_id"), "capture family")
        if group in groups and groups[group] != split:
            raise ValueError(f"Capture family leaks across splits: {group}")
        groups[group] = split
        if row["label"] == "unknown":
            if split == "train" or row.get("unknown_kind") not in UNKNOWN_KINDS:
                raise ValueError(f"Invalid unknown sample: {sid}")
        target = image_path(root, row.get("image"))
        sha = row.get("sha256")
        if not isinstance(sha, str) or len(sha) != 64 or any(c not in "0123456789abcdef" for c in sha) or file_digest(target) != sha:
            raise ValueError(f"Image checksum mismatch: {sid}")
        if sha in hashes:
            raise ValueError(f"Duplicate image: {sid}")
        hashes.add(sha)
        counts[(split, row["label"])] += 1
    for split in ("train", "validation", "test"):
        if any(not counts[(split, label)] for label in classes):
            raise ValueError(f"Each class needs examples in {split}")
    return {"manifest_sha256": digest(data), "samples": len(rows), "scope": scope}


def wilson_lower(successes, total):
    if not total:
        return None
    z = 1.959963984540054
    p = successes / total
    return (p + z*z/(2*total) - z*math.sqrt(p*(1-p)/total + z*z/(4*total*total))) / (1 + z*z/total)


def wilson_interval(successes, total):
    if not total:
        return None
    return [max(0., wilson_lower(successes, total)), min(1., 1 - wilson_lower(total - successes, total))]


def metrics(rows, predictions, threshold, classes):
    correct = Counter()
    predicted = Counter()
    actual = Counter()
    accepted = accepted_correct = accepted_known = unknown = accepted_unknown = 0
    unknown_groups = defaultdict(lambda: [0, 0])
    regions = defaultdict(lambda: [0, 0])
    for row in rows:
        pred = predictions[row["id"]]
        is_known = row["label"] in classes
        is_correct = is_known and pred["label"] == row["label"]
        take = pred["label"] in classes and pred["confidence"] >= threshold
        accepted += take
        accepted_correct += take and is_correct
        accepted_known += take and is_known
        if is_known:
            actual[row["label"]] += 1
            predicted[pred["label"]] += 1
            correct[row["label"]] += is_correct
            regions[row["region"]][0] += is_correct
            regions[row["region"]][1] += 1
        else:
            unknown += 1
            accepted_unknown += take
            unknown_groups[row["unknown_kind"]][0] += take
            unknown_groups[row["unknown_kind"]][1] += 1
    known = sum(actual.values())
    f1 = {c: 2*correct[c]/(actual[c]+predicted[c]) if actual[c]+predicted[c] else 0 for c in classes}
    return {
        "known_count": known, "unknown_count": unknown, "accepted_count": accepted,
        "top1_accuracy": sum(correct.values())/known if known else 0,
        "macro_f1": sum(f1.values())/len(classes),
        "class_recall": {c: correct[c]/actual[c] if actual[c] else 0 for c in classes},
        "class_counts": dict(actual),
        "accepted_precision": accepted_correct/accepted if accepted else 0,
        "accepted_precision_wilson95_lower": wilson_lower(accepted_correct, accepted),
        "accepted_precision_wilson95": wilson_interval(accepted_correct, accepted),
        "known_coverage": accepted_known/known if known else 0,
        "known_coverage_wilson95": wilson_interval(accepted_known, known),
        "unknown_acceptance": accepted_unknown/unknown if unknown else 1,
        "unknown_acceptance_wilson95": wilson_interval(accepted_unknown, unknown),
        "unknown_groups": {k: {"count": v[1], "acceptance": v[0]/v[1], "wilson95": wilson_interval(v[0], v[1])} for k, v in unknown_groups.items()},
        "region_top1": {k: {"count": v[1], "accuracy": v[0]/v[1]} for k, v in regions.items()},
    }


def validate_predictions(rows, predictions, classes):
    by_id = {}
    for pred in predictions:
        sid = text(pred.get("id"), "prediction id")
        if sid in by_id or pred.get("label") not in classes + ["unknown"]:
            raise ValueError("Duplicate prediction or invalid predicted label")
        number(pred.get("confidence"), "confidence")
        by_id[sid] = pred
    if set(by_id) != {row["id"] for row in rows}:
        raise ValueError("Predictions must cover every requested sample exactly once")
    return by_id


def evaluate(data, prediction_file, calibration, policy):
    manifest_sha = digest(data)
    val_ids = sorted(row["id"] for row in data["samples"] if row["split"] == "validation")
    model_sha = prediction_file.get("model_sha256", "")
    if not isinstance(model_sha, str) or len(model_sha) != 64 or any(c not in "0123456789abcdef" for c in model_sha):
        raise ValueError("Invalid model checksum")
    if (prediction_file.get("manifest_sha256") != manifest_sha
            or calibration.get("manifest_sha256") != manifest_sha
            or calibration.get("model_sha256") != model_sha
            or prediction_file.get("calibration_sha256") != digest(calibration)):
        raise ValueError("Model/calibration artifact mismatch")
    if calibration.get("selection_split") != "validation" or calibration.get("validation_ids_sha256") != digest(val_ids):
        raise ValueError("Calibration must identify the validation set")
    number(calibration.get("temperature"), "temperature", 0.01, 100)
    threshold = number(calibration.get("threshold"), "threshold")
    rows = [r for r in data["samples"] if r["split"] == "test"]
    if not rows:
        raise ValueError("Empty test benchmark")
    predictions = validate_predictions(rows, prediction_file.get("predictions", []), data["classes"])
    result = metrics(rows, predictions, threshold, data["classes"])
    failures = []
    def require(condition, message):
        if not condition:
            failures.append(message)
    require(calibration.get("validation_operating_point_passed") is True, "validation_operating_point")
    require(sorted(data["classes"]) == sorted(policy["classes"]), "supported_taxonomy")
    for c in policy["classes"]:
        require(result["class_counts"].get(c, 0) >= policy["min_test_per_class"], f"test_count:{c}")
        require(result["class_recall"].get(c, 0) >= policy["min_class_recall"], f"class_recall:{c}")
        require(sum(r["split"] == "validation" and r["label"] == c for r in data["samples"]) >= policy["min_validation_per_class"], f"validation_count:{c}")
    for kind in policy["unknown_kinds"]:
        group = result["unknown_groups"].get(kind, {"count": 0, "acceptance": 1})
        require(group["count"] >= policy["min_test_per_unknown_kind"], f"unknown_test_count:{kind}")
        require(group["acceptance"] <= policy["max_unknown_acceptance"], f"unknown_acceptance:{kind}")
        require(sum(r["split"] == "validation" and r["label"] == "unknown" and r["unknown_kind"] == kind for r in data["samples"]) >= policy["min_validation_per_unknown_kind"], f"unknown_validation_count:{kind}")
    for key in ("macro_f1", "accepted_precision", "known_coverage"):
        require(result[key] >= policy[f"min_{key}"], key)
    return {"protocol": policy["protocol"], "manifest_sha256": manifest_sha,
            "model_sha256": model_sha, "calibration_sha256": digest(calibration),
            "policy_sha256": digest(policy), "threshold": threshold, "metrics": result,
            "status": "classifier_candidate_passed" if not failures else "failed",
            "failures": failures, "production_qualified": False,
            "remaining_gates": ["independent_data_review", "paired_api_baseline", "thali_detection", "weighed_portions", "recipe_nutrition", "application_integration", "operations"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["validate", "evaluate"])
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--data-root", required=True)
    parser.add_argument("--scope", choices=["production", "research"], default="production")
    parser.add_argument("--predictions")
    parser.add_argument("--calibration")
    parser.add_argument("--output")
    args = parser.parse_args()
    try:
        data = read_json(args.manifest)
        result = validate_manifest(data, args.data_root, args.scope)
        if args.command == "evaluate":
            if not args.predictions or not args.calibration:
                raise ValueError("Evaluation requires predictions and calibration")
            result = evaluate(data, read_json(args.predictions), read_json(args.calibration), read_json(POLICY))
            result["scope"] = args.scope
        encoded = json.dumps(result, indent=2, allow_nan=False)
        if args.output:
            Path(args.output).write_text(encoded + "\n", encoding="utf-8")
        print(encoded)
        return 1 if result.get("status") == "failed" else 0
    except (ValueError, KeyError, TypeError, OSError) as exc:
        print(json.dumps({"status": "invalid", "production_qualified": False, "error": str(exc)}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
