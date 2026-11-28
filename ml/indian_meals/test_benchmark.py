"""Deterministic contract tests, using synthetic labels/bytes, not model evidence."""
import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from benchmark import POLICY, digest, evaluate, read_json, validate_manifest


def fixture():
    policy = read_json(POLICY)
    rows = []
    for label in policy["classes"]:
        for split, count in (("train", 1), ("validation", 10), ("test", 30)):
            for i in range(count):
                sid = f"{split}-{label}-{i}"
                rows.append({"id": sid, "label": label, "split": split, "group_id": sid,
                             "region": "synthetic-region", "source_id": "owned", "image": f"{sid}.jpg"})
    for kind in policy["unknown_kinds"]:
        for split, count in (("validation", 20), ("test", 50)):
            for i in range(count):
                sid = f"{split}-{kind}-{i}"
                rows.append({"id": sid, "label": "unknown", "unknown_kind": kind, "split": split,
                             "group_id": sid, "region": "synthetic-region", "source_id": "owned", "image": f"{sid}.jpg"})
    data = {"dataset_id": "synthetic-contract-only", "version": "1", "classes": policy["classes"],
            "sources": [{"id": "owned", "url": "internal://synthetic", "approved": True,
                         "approved_scope": "production", "permission_reference": "Synthetic test fixtures only"}], "samples": rows}
    calibration = {"selection_split": "validation", "validation_ids_sha256": digest(sorted(r["id"] for r in rows if r["split"] == "validation")),
                   "temperature": 1.0, "threshold": .8, "validation_operating_point_passed": True,
                   "manifest_sha256": digest(data), "model_sha256": "a"*64}
    predictions = {"manifest_sha256": digest(data), "model_sha256": "a"*64, "calibration_sha256": digest(calibration),
                   "predictions": [{"id": r["id"], "label": r["label"], "confidence": .99} for r in rows if r["split"] == "test"]}
    return data, calibration, predictions, policy


def rebind(data, calibration, predictions):
    calibration["manifest_sha256"] = predictions["manifest_sha256"] = digest(data)
    calibration["validation_ids_sha256"] = digest(sorted(r["id"] for r in data["samples"] if r["split"] == "validation"))
    predictions["calibration_sha256"] = digest(calibration)


class AcceptanceTests(unittest.TestCase):
    def setUp(self):
        self.data, self.cal, self.pred, self.policy = fixture()

    def run_gate(self):
        return evaluate(self.data, self.pred, self.cal, self.policy)

    def test_complete_synthetic_classifier_never_qualifies_production(self):
        report = self.run_gate()
        self.assertEqual(report["status"], "classifier_candidate_passed")
        self.assertFalse(report["production_qualified"])
        self.assertEqual(report["metrics"]["known_count"], 900)
        self.assertEqual(report["metrics"]["unknown_count"], 200)
        self.assertGreater(report["metrics"]["accepted_precision_wilson95_lower"], .95)

    def test_wrong_confident_predictions_fail(self):
        for row in self.pred["predictions"]:
            row["label"] = "plain_roti" if row["label"] != "plain_roti" else "steamed_rice"
        self.assertIn("accepted_precision", self.run_gate()["failures"])
        self.assertIn("macro_f1", self.run_gate()["failures"])

    def test_abstaining_on_everything_cannot_pass(self):
        for row in self.pred["predictions"]:
            row["confidence"] = .01
        report = self.run_gate()
        self.assertIn("known_coverage", report["failures"])
        self.assertEqual(report["metrics"]["accepted_precision"], 0)

    def test_unknown_acceptance_is_measured_per_group(self):
        ids = {r["id"] for r in self.data["samples"] if r.get("unknown_kind") == "international"}
        for row in self.pred["predictions"]:
            if row["id"] in ids:
                row["label"] = "steamed_rice"
        self.assertIn("unknown_acceptance:international", self.run_gate()["failures"])

    def test_missing_duplicate_and_extra_predictions_are_invalid(self):
        original = copy.deepcopy(self.pred["predictions"])
        for rows in (original[:-1], original + [original[0]], original + [{"id": "extra", "label": "unknown", "confidence": 0}]):
            self.pred["predictions"] = rows
            with self.assertRaises(ValueError):
                self.run_gate()

    def test_nonfinite_out_of_range_and_boolean_confidence_rejected(self):
        for value in (float("nan"), float("inf"), -.1, 1.1, True):
            self.pred["predictions"][0]["confidence"] = value
            with self.assertRaises(ValueError):
                self.run_gate()

    def test_changed_manifest_model_and_calibration_rejected(self):
        for key in ("manifest_sha256", "model_sha256", "calibration_sha256"):
            original = self.pred[key]
            self.pred[key] = "b"*64
            with self.assertRaises(ValueError):
                self.run_gate()
            self.pred[key] = original

    def test_test_selected_calibration_rejected(self):
        self.cal["selection_split"] = "test"
        self.pred["calibration_sha256"] = digest(self.cal)
        with self.assertRaises(ValueError):
            self.run_gate()

    def test_failed_validation_operating_point_cannot_qualify(self):
        self.cal["validation_operating_point_passed"] = False
        self.pred["calibration_sha256"] = digest(self.cal)
        self.assertIn("validation_operating_point", self.run_gate()["failures"])

    def test_insufficient_test_class_and_unknown_counts_fail(self):
        removed = {"test-steamed_rice-0", "test-ambiguous-0"}
        self.data["samples"] = [r for r in self.data["samples"] if r["id"] not in removed]
        self.pred["predictions"] = [r for r in self.pred["predictions"] if r["id"] not in removed]
        rebind(self.data, self.cal, self.pred)
        result = self.run_gate()
        self.assertIn("test_count:steamed_rice", result["failures"])
        self.assertIn("unknown_test_count:ambiguous", result["failures"])

    def test_missing_validation_examples_fail(self):
        self.data["samples"] = [r for r in self.data["samples"] if r["id"] != "validation-steamed_rice-0"]
        rebind(self.data, self.cal, self.pred)
        self.assertIn("validation_count:steamed_rice", self.run_gate()["failures"])

    def test_majority_class_collapse_does_not_hide_rare_class_failure(self):
        for row in self.pred["predictions"]:
            if row["label"] != "unknown":
                row["label"] = "steamed_rice"
        self.assertIn("class_recall:paneer_bhurji", self.run_gate()["failures"])

    def test_empty_test_set_invalid(self):
        self.data["samples"] = [r for r in self.data["samples"] if r["split"] != "test"]
        self.pred["predictions"] = []
        rebind(self.data, self.cal, self.pred)
        with self.assertRaises(ValueError):
            self.run_gate()


class DataTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.addCleanup(self.temp.cleanup)
        self.data, _, _, _ = fixture()
        self.data["classes"] = ["steamed_rice", "plain_roti"]
        self.data["samples"] = [r for r in self.data["samples"] if r["label"] in self.data["classes"] and r["id"].endswith("-0")]
        for row in self.data["samples"]:
            raw = row["id"].encode()
            (self.root / row["image"]).write_bytes(raw)
            row["sha256"] = hashlib.sha256(raw).hexdigest()

    def validate(self, scope="production"):
        return validate_manifest(self.data, self.root, scope)

    def test_complete_manifest_validated(self):
        self.assertEqual(self.validate()["samples"], 6)

    def test_missing_or_changed_image_invalid(self):
        path = self.root / self.data["samples"][0]["image"]
        path.write_bytes(b"changed")
        with self.assertRaises(ValueError):
            self.validate()
        path.unlink()
        with self.assertRaises(ValueError):
            self.validate()

    def test_path_traversal_rejected(self):
        self.data["samples"][0]["image"] = "../outside.jpg"
        with self.assertRaises(ValueError):
            self.validate()

    def test_duplicate_ids_and_image_hashes_rejected(self):
        first = self.data["samples"][0]
        self.data["samples"].append(copy.deepcopy(first))
        with self.assertRaises(ValueError):
            self.validate()
        self.data["samples"][-1]["id"] = "new-id-same-image"
        with self.assertRaises(ValueError):
            self.validate()

    def test_capture_family_leak_rejected(self):
        self.data["samples"][1]["group_id"] = self.data["samples"][0]["group_id"]
        with self.assertRaises(ValueError):
            self.validate()

    def test_unapproved_and_research_only_sources_rejected(self):
        self.data["sources"][0]["approved"] = False
        with self.assertRaises(ValueError):
            self.validate()
        self.data["sources"][0]["approved"] = True
        self.data["sources"][0]["approved_scope"] = "research"
        with self.assertRaises(ValueError):
            self.validate()
        self.assertEqual(self.validate("research")["scope"], "research")

    def test_research_derivation_flag_blocks_production_even_if_source_metadata_changes(self):
        self.data["research_only"] = True
        with self.assertRaises(ValueError):
            self.validate("production")
        self.assertEqual(self.validate("research")["scope"], "research")

    def test_empty_dataset_and_missing_class_rejected(self):
        self.data["samples"] = []
        with self.assertRaises(ValueError):
            self.validate()

    def test_missing_required_text_fields_are_validation_errors(self):
        for key in ("id", "group_id", "region", "image"):
            original = self.data["samples"][0].pop(key)
            with self.assertRaises(ValueError):
                self.validate()
            self.data["samples"][0][key] = original

    def test_cross_platform_absolute_and_parent_paths_rejected(self):
        for value in ("C:/private/photo.jpg", "C:\\private\\photo.jpg", "/etc/photo.jpg", "a/../../photo.jpg"):
            self.data["samples"][0]["image"] = value
            with self.assertRaises(ValueError):
                self.validate()

    def test_nonfinite_json_rejected(self):
        path = self.root / "invalid.json"
        path.write_text('{"confidence": NaN}', encoding="utf-8")
        with self.assertRaises(ValueError):
            read_json(path)

    def test_invalid_manifest_shape_rejected(self):
        with self.assertRaises(ValueError):
            validate_manifest([], self.root)
        self.data["sources"] = "not a list"
        with self.assertRaises(ValueError):
            self.validate()

    def test_cli_returns_nonzero_for_failed_or_missing_evidence(self):
        _, calibration, predictions, _ = fixture()
        rebind(self.data, calibration, predictions)
        predictions["predictions"] = [{"id": r["id"], "label": r["label"], "confidence": .99} for r in self.data["samples"] if r["split"] == "test"]
        for name, value in (("manifest", self.data), ("calibration", calibration), ("predictions", predictions)):
            (self.root / f"{name}.json").write_text(json.dumps(value), encoding="utf-8")
        command = [sys.executable, str(Path(__file__).with_name("benchmark.py")), "evaluate",
                   "--manifest", str(self.root / "manifest.json"), "--data-root", str(self.root),
                   "--calibration", str(self.root / "calibration.json"), "--predictions", str(self.root / "predictions.json")]
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout)["status"], "failed")
        (self.root / "predictions.json").unlink()
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(json.loads(result.stdout)["status"], "invalid")


if __name__ == "__main__":
    unittest.main()
