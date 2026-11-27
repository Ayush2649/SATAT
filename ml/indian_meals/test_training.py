"""Small CPU checks of training mechanics; no pretrained downloads or meal data."""
import copy
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from benchmark import POLICY, read_json
from train import calibrate, fit_head, main, preprocess


@unittest.skipUnless(importlib.util.find_spec("torch"), "PyTorch required for CPU training-mechanics checks")
class TrainingTests(unittest.TestCase):
    def setUp(self):
        import torch
        torch.set_num_threads(1)
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.x = torch.tensor([[1., 0.], [0., 1.]] * 6)
        self.y = torch.tensor([0, 1] * 6)
        self.config = {"seed": 42, "epochs": 3, "batch_size": 4, "learning_rate": .01, "manifest_sha256": "synthetic"}
        self.classes = ["steamed_rice", "plain_roti"]

    def fit(self, resume=False):
        return fit_head(self.x, self.y, self.x, self.y, self.classes, self.config, self.root, resume)

    def test_checkpoint_resume_matches_uninterrupted_training(self):
        import torch
        save = torch.save
        captured = []
        def record(payload, path):
            captured.append(copy.deepcopy(payload))
            return save(payload, path)
        with patch("torch.save", side_effect=record):
            expected = self.fit()
        save(captured[0], self.root / "last.pt")
        actual = self.fit(resume=True)
        for key, value in expected.state_dict().items():
            self.assertTrue(torch.equal(value, actual.state_dict()[key]))

    def test_resume_rejects_configuration_changes(self):
        self.fit()
        self.config["manifest_sha256"] = "changed"
        with self.assertRaises(ValueError):
            self.fit(resume=True)

    def validation(self, confusing=False):
        import torch
        rows = [{"id": f"known-{i}", "label": label, "split": "validation", "region": "synthetic"} for i, label in enumerate(self.classes)]
        logits = [[8., -8.], [-8., 8.]]
        for kind in read_json(POLICY)["unknown_kinds"]:
            rows.append({"id": kind, "label": "unknown", "unknown_kind": kind, "split": "validation", "region": "synthetic"})
            logits.append([8., -8.] if confusing else [0., 0.])
        return torch.tensor(logits), rows

    def test_validation_calibration_selects_useful_operating_point(self):
        logits, rows = self.validation()
        result = calibrate(logits, rows, self.classes, read_json(POLICY))
        self.assertTrue(result["validation_operating_point_passed"])
        self.assertEqual(result["validation_metrics"]["known_coverage"], 1.)
        self.assertEqual(result["validation_metrics"]["unknown_acceptance"], 0.)

    def test_indistinguishable_unknowns_do_not_silently_qualify(self):
        logits, rows = self.validation(confusing=True)
        self.assertFalse(calibrate(logits, rows, self.classes, read_json(POLICY))["validation_operating_point_passed"])

    def test_calibration_refuses_test_rows(self):
        logits, rows = self.validation()
        rows[0]["split"] = "test"
        with self.assertRaises(ValueError):
            calibrate(logits, rows, self.classes, read_json(POLICY))

    def test_training_without_gpu_stops_before_download_or_data_access(self):
        with patch("sys.argv", ["train.py", "train", "--manifest", "missing.json", "--data-root", "missing", "--output", str(self.root)]), patch("torch.cuda.is_available", return_value=False), patch("train.load_backbone") as loader:
            with self.assertRaisesRegex(RuntimeError, "No CUDA GPU"):
                main()
            loader.assert_not_called()

    @unittest.skipUnless(importlib.util.find_spec("PIL") and importlib.util.find_spec("numpy"), "Pillow/numpy required")
    def test_image_preprocessing_and_corrupt_image(self):
        from PIL import Image, UnidentifiedImageError
        image = self.root / "crop.png"
        Image.new("RGB", (300, 200), color=(120, 80, 40)).save(image)
        self.assertEqual(tuple(preprocess(image).shape), (3, 224, 224))
        image.write_bytes(b"not a valid image")
        with self.assertRaises(UnidentifiedImageError):
            preprocess(image)


if __name__ == "__main__":
    unittest.main()
