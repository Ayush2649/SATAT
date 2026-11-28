"""Prepare a bounded Khana RESEARCH-ONLY pilot; never a production benchmark.

Downloads only with --download. The source archive contains food images, not
executable code. Selected images are decoded/re-encoded without EXIF, exact
duplicates are removed, and perceptually similar images stay in one split.
Household identity is unavailable: these splits are provisional research data.
"""
import argparse
import hashlib
import io
import json
import random
import re
import tarfile
import tempfile
from collections import Counter, defaultdict
from pathlib import Path, PurePosixPath

from benchmark import file_digest, read_json, validate_manifest

SOURCE_PAGE = "https://khana.omkarprabhu.in/"
SOURCE_FOLDER = "https://drive.google.com/drive/folders/1PWyJdkizw5ABBd8BIAnr_FZq91YZ2Uo0"
ARCHIVE_ID = "1fmGRWGqyvdCHjXq81noSAD9Lwnqb1HNZ"
ARCHIVE_BYTES = 6904199066  # Public publisher-folder metadata checked 27 November 2026.
LABELS = {
    "aloo paratha": "aloo_paratha", "bhindi masala": "bhindi_sabzi",
    "chana masala": "chole", "chapati": "plain_roti", "fish curry": "fish_curry",
    "idli": "idli", "masala dosa": "masala_dosa", "pav bhaji": "pav_bhaji",
    "poha": "poha", "samosa": "samosa",
}


def normalized(value):
    return re.sub(r"[_\s-]+", " ", value.strip().lower())


def classify_path(name):
    path = PurePosixPath(name)
    if path.is_absolute() or ".." in path.parts or "\\" in name or ":" in name:
        raise ValueError("Unsafe archive member path")
    matches = {LABELS[normalized(part)] for part in path.parts[:-1] if normalized(part) in LABELS}
    if len(matches) > 1:
        raise ValueError("Multiple class directories in one image path")
    splits = {"train": "train", "training": "train", "val": "validation", "valid": "validation", "validation": "validation", "test": "test", "testing": "test"}
    found = {splits[part.lower()] for part in path.parts[:-1] if part.lower() in splits}
    if len(found) > 1:
        raise ValueError("Multiple source splits in one image path")
    return next(iter(matches), None), next(iter(found), None)


def image_bytes_and_hash(raw):
    from PIL import Image, ImageOps, ImageStat
    with Image.open(io.BytesIO(raw)) as original:
        if original.width * original.height > 16_000_000:
            raise ValueError("Image exceeds pilot pixel limit")
        image = ImageOps.exif_transpose(original).convert("RGB")
        image.thumbnail((600, 600), Image.Resampling.LANCZOS)
        small = image.convert("L").resize((9, 8), Image.Resampling.BILINEAR)
        pixels = list(small.tobytes())
        dhash = sum((pixels[y*9+x] > pixels[y*9+x+1]) << (y*8+x) for y in range(8) for x in range(8))
        colour = tuple(int(x) for x in ImageStat.Stat(image.resize((1, 1))).mean)
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=92)
    return output.getvalue(), dhash, colour


def group_similar(rows):
    """Conservative dHash/colour proxy; does not establish household independence."""
    parent = list(range(len(rows)))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    bands = defaultdict(list)
    for i, row in enumerate(rows):
        candidates = set()
        # Five disjoint bands ensure <=4 changed bits shares at least one band.
        for band in range(5):
            candidates.update(bands[(band, (row["dhash"] >> (band*13)) & 8191)])
        for j in candidates:
            other = rows[j]
            if ((row["dhash"] ^ other["dhash"]).bit_count() <= 4
                    and max(abs(a-b) for a, b in zip(row["colour"], other["colour"])) <= 24):
                parent[find(i)] = find(j)
        for band in range(5):
            bands[(band, (row["dhash"] >> (band*13)) & 8191)].append(i)
    members = defaultdict(list)
    for i, row in enumerate(rows):
        members[find(i)].append(row)
    return list(members.values())


def assign_splits(rows, seed):
    clusters = group_similar(rows)
    output, rejected = [], Counter()
    has_source_splits = any(row["source_split"] for row in rows)
    if has_source_splits and any(not row["source_split"] for row in rows):
        raise ValueError("Mixed source-split layout: review archive before importing")
    by_label = defaultdict(list)
    for cluster in clusters:
        if len({r["label"] for r in cluster}) != 1:
            rejected["cross_label_similar_images"] += len(cluster)
            continue
        if has_source_splits and len({r["source_split"] for r in cluster}) != 1:
            rejected["cross_split_similar_images"] += len(cluster)
            continue
        group = "khana-proxy-" + min(r["sha256"] for r in cluster)
        for row in cluster:
            row["group_id"] = group
        by_label[cluster[0]["label"]].append(cluster)
    for label in sorted(by_label):
        groups = sorted(by_label[label], key=lambda g: g[0]["group_id"])
        if not has_source_splits:
            if len(groups) < 3:
                raise ValueError(f"Too few distinct image groups for {label}; increase the pilot limit or review images")
            random.Random(f"{seed}:{label}").shuffle(groups)
            ntrain = max(1, min(len(groups)-2, int(len(groups)*.7)))
            nval = max(1, min(len(groups)-ntrain-1, int(len(groups)*.15)))
        for i, group in enumerate(groups):
            split = group[0]["source_split"] if has_source_splits else "train" if i < ntrain else "validation" if i < ntrain+nval else "test"
            for row in group:
                row["split"] = split
                output.append(row)
    return output, dict(rejected), "publisher_splits_preserved" if has_source_splits else "provisional_grouped_70_15_15"


def prepare(archive, output, research_only=False, acknowledge_terms=False, max_per_class=300, seed=42):
    if not research_only or not acknowledge_terms:
        raise ValueError("Khana requires an explicit research-only/source-terms acknowledgement; no production mode exists")
    if not 6 <= max_per_class <= 1000:
        raise ValueError("Pilot limit must be between 6 and 1000 per class")
    archive, output = Path(archive).resolve(), Path(output).resolve()
    if not archive.is_file():
        raise FileNotFoundError("Download the publisher's dataset.tar.gz first")
    if output.exists() and any(output.iterdir()):
        raise ValueError("Output directory is not empty; use a new pilot directory (no existing work is overwritten)")
    output.parent.mkdir(parents=True, exist_ok=True)
    counts, skipped, rows, seen = Counter(), Counter(), [], {}
    with tempfile.TemporaryDirectory(prefix="khana-pilot-", dir=output.parent) as temp:
        stage = Path(temp).resolve()
        if not stage.is_relative_to(output.parent):
            raise ValueError("Unsafe staging location")
        (stage / "crops").mkdir()
        with tarfile.open(archive, "r|gz") as source:
            for visited, member in enumerate(source):
                if visited and visited % 5000 == 0:
                    print(f"Inspected {visited} archive entries; retained {len(rows)} candidate images", flush=True)
                # Never extract tar paths, links, scripts, device nodes or other payloads.
                label, source_split = classify_path(member.name)
                image_name = PurePosixPath(member.name)
                # Khana stores many real images as extensionless hashes. AppleDouble
                # metadata uses the same names with a hidden ._ prefix; never decode it.
                if (not member.isfile() or image_name.name.startswith(".")
                        or image_name.suffix.lower() not in {"", ".jpg", ".jpeg", ".png", ".webp"} or not label):
                    continue
                bucket = (label, source_split)
                if counts[bucket] >= max_per_class:
                    continue
                if not 0 < member.size <= 12*1024*1024:
                    skipped["image_byte_limit"] += 1
                    continue
                try:
                    stream = source.extractfile(member)
                    if stream is None:
                        raise ValueError("Unreadable image member")
                    with stream:
                        raw = stream.read(12*1024*1024+1)
                    encoded, dhash, colour = image_bytes_and_hash(raw)
                except (OSError, ValueError):
                    skipped["unreadable_image"] += 1
                    continue
                sha = hashlib.sha256(encoded).hexdigest()
                if sha in seen:
                    if seen[sha]["label"] != label:
                        seen[sha]["conflicting_label"] = True
                    skipped["exact_duplicate"] += 1
                    continue
                relative = f"crops/{sha}.jpg"
                (stage / relative).write_bytes(encoded)
                row = {"id": "khana-"+sha, "label": label, "image": relative, "sha256": sha,
                       "source_split": source_split, "source_member": member.name,
                       "source_id": "khana", "region": "not_recorded_by_source", "dhash": dhash, "colour": colour}
                seen[sha] = row
                rows.append(row)
                counts[bucket] += 1
        conflicts = [row for row in rows if row.get("conflicting_label")]
        skipped["cross_label_exact_images"] = len(conflicts)
        clean, rejected, split_method = assign_splits([r for r in rows if not r.get("conflicting_label")], seed)
        classes = sorted(set(LABELS.values()))
        if {r["label"] for r in clean} != set(classes):
            raise ValueError("Archive does not provide every pilot class after filtering; inspect layout or increase the limit")
        for row in clean:
            for key in ("dhash", "colour", "source_split"):
                row.pop(key)
        manifest = {"dataset_id": "khana-research-pilot", "version": "1", "classes": classes,
                    "research_only": True, "independent_release_benchmark": False,
                    "sources": [{"id": "khana", "url": SOURCE_PAGE, "approved": True, "approved_scope": "research",
                                 "permission_reference": f"User acknowledged publisher's non-commercial research/education terms: {SOURCE_PAGE}"}],
                    "samples": sorted(clean, key=lambda row: row["id"])}
        validation = validate_manifest(manifest, stage, "research")
        report = {"status": "research_pilot_prepared", "research_only": True, "production_qualified": False,
                  "independent_release_benchmark": False, "source": SOURCE_PAGE, "download_folder": SOURCE_FOLDER,
                  "archive_sha256": file_digest(archive), "source_labels": LABELS, "seed": seed, "max_per_class_per_source_split": max_per_class,
                  "split_method": split_method, "household_provenance": "unavailable; perceptual groups are only proxies",
                  "counts": {split: dict(Counter(r["label"] for r in clean if r["split"] == split)) for split in ("train", "validation", "test")},
                  "skipped": dict(skipped), "quarantined": rejected, **validation}
        (stage / "manifest.json").write_text(json.dumps(manifest, indent=2)+"\n", encoding="utf-8")
        (stage / "preparation-report.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf-8")
        # Rename generated files only; never delete/replace an existing dataset.
        if output.exists():
            for path in stage.iterdir():
                path.rename(output / path.name)
        else:
            stage.rename(output)
        return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--research-only", action="store_true", required=True)
    parser.add_argument("--acknowledge-source-terms", action="store_true", required=True)
    parser.add_argument("--max-per-class", type=int, default=300)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--download", action="store_true")
    parser.add_argument("--reuse-prepared", action="store_true")
    args = parser.parse_args()
    existing = Path(args.output) / "manifest.json"
    if args.reuse_prepared and existing.is_file():
        data = read_json(existing)
        report = read_json(Path(args.output) / "preparation-report.json")
        if (data.get("dataset_id") != "khana-research-pilot" or data.get("research_only") is not True
                or report.get("seed") != args.seed or report.get("max_per_class_per_source_split") != args.max_per_class):
            raise ValueError("Existing data/configuration does not match this Khana pilot; choose a new output path")
        validate_manifest(data, args.output, "research")
        print(json.dumps({"status": "research_pilot_reused", "production_qualified": False, "manifest": str(existing)}))
        return 0
    archive = Path(args.archive)
    if args.download:
        if archive.exists() and archive.stat().st_size == ARCHIVE_BYTES:
            print("Reusing publisher archive with expected size; content hash will be recorded during preparation", flush=True)
        else:
            import gdown
            archive.parent.mkdir(parents=True, exist_ok=True)
            temporary = archive.with_name(archive.name + ".part")
            result = gdown.download(id=ARCHIVE_ID, output=str(temporary), quiet=False, resume=True)
            if result is None or not temporary.is_file() or temporary.stat().st_size != ARCHIVE_BYTES:
                raise ValueError("Incomplete/unexpected publisher archive; check the official link or quota, do not train")
            if archive.exists():
                raise ValueError("An unexpected existing archive will not be overwritten; review it or choose a new path")
            temporary.rename(archive)
    report = prepare(archive, args.output, args.research_only, args.acknowledge_source_terms, args.max_per_class, args.seed)
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
