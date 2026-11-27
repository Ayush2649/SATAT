"""Small generated image archives test import mechanics, not food recognition."""
import copy
import hashlib
import io
import json
import random
import tarfile
import tempfile
import unittest
from pathlib import Path

from PIL import Image
from benchmark import read_json, validate_manifest
from prepare_khana import LABELS, assign_splits, classify_path, group_similar, prepare


class KhanaPreparationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def archive(self, bad_member=None, corrupt=False, duplicate=False, extensionless=False):
        path = self.root / "dataset.tar.gz"
        with tarfile.open(path, "w:gz") as bundle:
            for li, label in enumerate(LABELS):
                for i in range(6):
                    rng = random.Random(li*100+i)
                    image = Image.frombytes("RGB", (32, 32), bytes(rng.randrange(256) for _ in range(32*32*3)))
                    encoded = io.BytesIO()
                    image.save(encoded, format="PNG")
                    content = encoded.getvalue()
                    name = f"khana/{label}/{hashlib.md5(str(i).encode()).hexdigest()}" if extensionless else f"khana/{label}/{i}.png"
                    item = tarfile.TarInfo(name)
                    item.size = len(content)
                    bundle.addfile(item, io.BytesIO(content))
                    if duplicate and li == 0 and i == 0:
                        item = tarfile.TarInfo(f"khana/{label}/duplicate.png")
                        item.size = len(content)
                        bundle.addfile(item, io.BytesIO(content))
            if bad_member:
                item = tarfile.TarInfo(bad_member)
                item.size = 1
                bundle.addfile(item, io.BytesIO(b"x"))
            if corrupt:
                item = tarfile.TarInfo("khana/idli/broken.jpg")
                item.size = 7
                bundle.addfile(item, io.BytesIO(b"invalid"))
        return path

    def test_research_archive_creates_valid_grouped_manifest(self):
        output = self.root / "prepared"
        report = prepare(self.archive(), output, True, True, 6)
        manifest = read_json(output / "manifest.json")
        self.assertEqual(len(manifest["classes"]), 10)
        self.assertEqual(report["scope"], "research")
        self.assertFalse(report["production_qualified"])
        self.assertFalse(report["independent_release_benchmark"])
        validate_manifest(manifest, output, "research")
        with self.assertRaises(ValueError):
            validate_manifest(manifest, output, "production")

    def test_research_acknowledgements_required(self):
        source = self.archive()
        for research, terms in ((False, True), (True, False), (False, False)):
            with self.assertRaises(ValueError):
                prepare(source, self.root / "out", research, terms, 6)

    def test_protects_existing_output(self):
        output = self.root / "keep"
        output.mkdir()
        (output / "user.txt").write_text("keep")
        with self.assertRaises(ValueError):
            prepare(self.archive(), output, True, True, 6)
        self.assertEqual((output / "user.txt").read_text(), "keep")

    def test_unsafe_tar_paths_fail_without_partial_dataset(self):
        output = self.root / "out"
        with self.assertRaises(ValueError):
            prepare(self.archive("../outside.jpg"), output, True, True, 6)
        self.assertFalse(output.exists())
        self.assertFalse((self.root / "outside.jpg").exists())

    def test_unknown_layout_does_not_generate_fake_manifest(self):
        path = self.root / "unknown.tar.gz"
        with tarfile.open(path, "w:gz") as bundle:
            item = tarfile.TarInfo("unmapped/food.jpg")
            item.size = 1
            bundle.addfile(item, io.BytesIO(b"x"))
        with self.assertRaises(ValueError):
            prepare(path, self.root / "out", True, True, 6)

    def test_folder_aliases_and_source_split_are_recognised(self):
        self.assertEqual(classify_path("khana/train/masala_dosa/1.jpg"), ("masala_dosa", "train"))
        self.assertEqual(classify_path("khana/validation/chana masala/1.jpg"), ("chole", "validation"))
        self.assertEqual(classify_path("khana/biryani/1.jpg"), (None, None))

    def test_similar_images_are_grouped_across_labels(self):
        rows = [{"dhash": 123456, "colour": (100, 100, 100)}, {"dhash": 123457, "colour": (101, 100, 100)}]
        self.assertEqual(len(group_similar(rows)), 1)

    def test_cross_split_near_duplicates_quarantined(self):
        rows = [{"label": "idli", "sha256": str(i), "dhash": 5, "colour": (100, 100, 100), "source_split": split} for i, split in enumerate(("train", "test"))]
        clean, rejected, mode = assign_splits(rows, 42)
        self.assertEqual(clean, [])
        self.assertEqual(rejected["cross_split_similar_images"], 2)
        self.assertEqual(mode, "publisher_splits_preserved")

    def test_split_assignment_reproducible(self):
        rows = [{"label": "idli", "sha256": hashlib.sha256(str(i).encode()).hexdigest(), "dhash": int(hashlib.sha256(str(i).encode()).hexdigest()[:16], 16), "colour": (i*20, 0, 0), "source_split": None} for i in range(10)]
        first, _, _ = assign_splits(copy.deepcopy(rows), 42)
        second, _, _ = assign_splits(copy.deepcopy(rows), 42)
        self.assertEqual([(r["sha256"], r["split"]) for r in first], [(r["sha256"], r["split"]) for r in second])
        self.assertEqual({r["split"] for r in first}, {"train", "validation", "test"})

    def test_too_few_groups_fail(self):
        rows = [{"label": "idli", "sha256": "a", "dhash": 1, "colour": (0, 0, 0), "source_split": None}]
        with self.assertRaises(ValueError):
            assign_splits(rows, 42)

    def test_exact_duplicates_and_corrupt_images_are_reported(self):
        report = prepare(self.archive(corrupt=True, duplicate=True), self.root / "out", True, True, 10)
        self.assertEqual(report["skipped"]["exact_duplicate"], 1)
        self.assertEqual(report["skipped"]["unreadable_image"], 1)

    def test_publisher_split_does_not_get_randomly_reassigned(self):
        rows = [{"label": "idli", "sha256": str(i), "dhash": i*123456789, "colour": (i*50, 0, 0), "source_split": split} for i, split in enumerate(("train", "validation", "test"))]
        clean, _, mode = assign_splits(rows, 42)
        self.assertEqual({r["sha256"]: r["split"] for r in clean}, {str(i): split for i, split in enumerate(("train", "validation", "test"))})
        self.assertEqual(mode, "publisher_splits_preserved")

    def test_extensionless_images_and_apple_metadata(self):
        report = prepare(self.archive(bad_member="khana/idli/._metadata", extensionless=True), self.root / "out", True, True, 6)
        self.assertEqual(report["samples"], 60)
        self.assertEqual(report["skipped"].get("unreadable_image", 0), 0)


if __name__ == "__main__":
    unittest.main()
