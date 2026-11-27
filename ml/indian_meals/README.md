# Indian meal classifier starter

Read [the feature PRD](../../PRD.md) first. This is an offline **single-food crop classifier baseline**, not a replacement scanner. No real dataset, trained weights, detector, portion model or production integration is included.

## Files

- `acceptance.v1.json`: frozen initial taxonomy, sample minima and C1 targets.
- `benchmark.py`: standard-library manifest validator and C1 evaluator. Exit 0 = valid data / classifier candidate passed, 1 = failed acceptance targets, 2 = invalid evidence. `production_qualified` remains false.
- `train.py`: frozen DINOv2 ViT-S/14 + linear-head training, resumable checkpoints, validation-only calibration and separate test inference. Official source is pinned to a specific commit; weights are hashed per run.
- `test_benchmark.py`: synthetic contract tests, requiring only Python 3.11+.
- `test_training.py`: tiny CPU mechanics checks; requires PyTorch, Pillow and NumPy; no network or pretrained download. A skip is not evidence that training mechanics passed.
- `train_colab.ipynb`: upload-and-run handoff. Dataset and Google GPU assignment are separate prerequisites.

## Local checks (no dataset or credentials)

```powershell
python -m unittest discover -s ml/indian_meals -p 'test_*.py' -v
python ml/indian_meals/benchmark.py --help
```

The test suite uses fabricated labels/features and temporary byte files. Its results only test evaluator/training mechanics; they do not measure a real model's food recognition. Training-image decoding is verified separately by the training preflight.

## Dataset layout

Keep large/private files outside Git, for example `ml/indian_meals/data/` (ignored) or an external data folder:

```text
meal-data/
  manifest.json
  crops/
    meal-0001-rice.jpg
    ...
```

Follow PRD section 7 for the manifest. Populate SHA-256 from the actual image bytes; use reviewed source permissions and stable capture-family groups. The illustrated manifest in the PRD deliberately fails validation until replaced. There is no synthetic or public photo package masquerading as a weighed reference set.

```powershell
python ml/indian_meals/benchmark.py validate --manifest ml/indian_meals/data/manifest.json --data-root ml/indian_meals/data --scope production
```

Production mode rejects sources marked research-only. Research mode permits approved research sources, but does not grant permission or qualify weights for a product. The metadata needs an independent rights audit; typing `approved: true` is not proof of rights.

## GPU run

### Exact Colab sequence

1. Open [Colab](https://colab.research.google.com/) with the intended Google account. Check **Settings → Subscription** for that account's plan and compute balance before buying anything. Eligible paid Google AI Pro plans currently include Colab compute; storage-only plans and trials do not. Google lists additional eligibility requirements, including 18+, for the bundled benefit. See [Google's benefit details](https://support.google.com/googleone/answer/14534406?hl=en) and [Colab FAQ](https://research.google.com/colaboratory/intl/en-GB/faq.html). A specific GPU is not guaranteed.
2. Download `ml/indian_meals/train_colab.ipynb` from the `feat/indian-meal-specialist` branch, or use the local file. In Colab choose **File → Upload notebook** and select it. Save your own copy in Drive.
3. Prepare the actual authorised image dataset and `manifest.json` using PRD section 7. This is still a prerequisite, not a bundled asset. Review train/validation/test capture families and source permissions before using GPU time.
4. Choose **Runtime → Change runtime type → Python 3 → GPU**, then connect. Start with a T4 if offered for this small baseline; a larger GPU is optional. Run the first code cell to check the assigned GPU/VRAM. Its no-CUDA error means training must not start yet.
5. In Colab's left **Files** panel, upload `artifacts/indian-meal-starter.zip` from the local project. The uploaded runtime path must be `/content/indian-meal-starter.zip`. Run the extraction/tests cell; it checks the offline tools without downloading pretrained weights.
6. Put the authorised dataset at `/content/meal-data/manifest.json` and `/content/meal-data/crops/...`, matching manifest-relative paths. For many images, copy an authorised dataset archive into the runtime and unpack it after inspecting its paths. Do not upload `.env` or service credentials. Runtime-local data must be restored after a restart.
7. Run the **Durable checkpoints** cell and complete the Google Drive connection yourself after reviewing the notebook. Keep `OUTPUT` under `/content/drive/MyDrive/SATAT/meal-runs/pilot-001`; this persists checkpoints. Merely creating a folder called `drive` without mounting Drive is not durable storage.
8. Run the configuration/validation cell with `EPOCHS=30`, `BATCH_SIZE=32`, `SEED=42`, `RESUME=False`. Keep `SCOPE='production'` only for production-approved data; use `research` for a research-only experiment. A failed validation must be fixed before training. Use a new output folder for a changed configuration; after a genuine interruption use the unchanged configuration with `RESUME=True`.
9. Run the **Train using train/validation only** cell. It downloads the pinned official DINOv2 backbone and trains the small head. If GPU memory is insufficient, start a new run with a smaller batch size; do not resume a mismatched configuration.
10. Freeze the candidate and its validation-selected calibration. Set `RUN_FINAL_TEST=True` in the **Sealed test evaluation** cell, then run it. An acceptance failure is a real failure, not a reason to delete difficult test images or lower protocol counts. Pilot datasets below release sample minima can train but cannot qualify.
11. Run the export cell and retain `satat-meal-review.zip` with metadata, calibration, predictions and the classifier report. Keep the large checkpoint files in Drive. Disconnect the runtime when finished so it does not consume compute unnecessarily. Return the report for review; classifier success alone does not qualify thali detection or portions.

Use Python 3.11+ with a compatible preinstalled CUDA PyTorch build, NumPy and Pillow. Colab normally supplies these; the notebook records exact versions. If unavailable, install from the official package registry in that separate training environment, never add Python/ML dependencies to the Next.js app.

The following commands are real, but **require approved data and a GPU**:

```bash
python ml/indian_meals/train.py train --manifest /content/meal-data/manifest.json --data-root /content/meal-data --output /content/drive/MyDrive/SATAT/meal-runs/pilot-001 --scope production
```

Resume an interrupted run with exactly the same arguments plus `--resume`. Save to durable storage. Data, backbone weights, preprocessing, epochs, seed, batch size, learning rate and scope must match the checkpoint. A new configuration needs a new run directory. `--allow-cpu-smoke` is only for deliberately small development checks; it is not a substitute for an assigned GPU.

Training only encodes train/validation examples. Test-file hashes/decode validity are checked in preflight, but their contents are not encoded or used for fitting/checkpoint/calibration selection. Do not inspect test predictions to tune hyperparameters.

After freezing the candidate and validation-selected operating point:

```bash
python ml/indian_meals/train.py predict --manifest /content/meal-data/manifest.json --data-root /content/meal-data --output /content/drive/MyDrive/SATAT/meal-runs/pilot-001 --scope production
```

This exports test predictions and runs C1 automatically. A pilot below the required scope/counts should fail acceptance; do not lower release counts to make it green. If validation cannot meet the precision/coverage/unknown targets, that failure is preserved in calibration and C1 cannot pass.

You can re-run the evaluator without a GPU:

```bash
python ml/indian_meals/benchmark.py evaluate --manifest /content/meal-data/manifest.json --data-root /content/meal-data --predictions /content/drive/MyDrive/SATAT/meal-runs/pilot-001/predictions.json --calibration /content/drive/MyDrive/SATAT/meal-runs/pilot-001/calibration.json --scope production --output /content/drive/MyDrive/SATAT/meal-runs/pilot-001/classifier-report.json
```

## Results to return

Return `metadata.json`, `calibration.json`, `predictions.json` and `classifier-report.json` for review. Save `head.pt`, `last.pt` and `features.pt` outside Git and record their checksums/artifact location. Do not share contributor images or Drive contents without authorisation. Reproducibility is a recorded run and checkpoint, not a guarantee of identical floating-point results across different GPU/software stacks.

C1 success is only a classifier milestone. The paired DeepSeek comparison, independent provenance review, detection, weighed-portion/nutrition gates, app integration and operational checks remain mandatory before marking the feature done or pushing a completed trained-feature release. See the PRD completion ledger.
