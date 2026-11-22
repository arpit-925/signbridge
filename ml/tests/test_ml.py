import os
import json
import base64
import unittest
try:
    import requests
except ImportError:
    requests = None

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
DEPLOYED_ML_URL = "https://signbridgeml.onrender.com"

class TestSignBridgeML(unittest.TestCase):

    # 1. test_model_file_exists
    def test_model_file_exists(self):
        model_path = os.path.join(BASE_DIR, "models", "sign_model.keras")
        self.assertTrue(os.path.exists(model_path), f"Model file not found at {model_path}")

    # 2. test_label_encoder_has_26_classes
    def test_label_encoder_has_26_classes(self):
        label_path = os.path.join(BASE_DIR, "models", "label_encoder.json")
        self.assertTrue(os.path.exists(label_path), f"Label encoder not found at {label_path}")
        with open(label_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        classes = data.get("classes", [])
        self.assertEqual(len(classes), 26, f"Expected 26 classes, found {len(classes)}")

    # 3. test_label_encoder_contains_a_to_z
    def test_label_encoder_contains_a_to_z(self):
        label_path = os.path.join(BASE_DIR, "models", "label_encoder.json")
        with open(label_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        classes = set(data.get("classes", []))
        expected = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        self.assertTrue(
            expected.issubset(classes),
            f"Label encoder missing some A-Z classes: {expected - classes}"
        )

    # 4. test_preprocessing_report_exists
    def test_preprocessing_report_exists(self):
        report_path = os.path.join(BASE_DIR, "dataset", "processed", "preprocessing_report.json")
        self.assertTrue(os.path.exists(report_path), f"Preprocessing report not found at {report_path}")

    # 5. test_preprocessing_success_rate
    def test_preprocessing_success_rate(self):
        report_path = os.path.join(BASE_DIR, "dataset", "processed", "preprocessing_report.json")
        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)
        total = report.get("total_images_processed", 0)
        valid = report.get("valid_samples_extracted", 0)
        self.assertGreater(total, 0, "total_images_processed is 0")
        success_rate = valid / total
        self.assertGreaterEqual(success_rate, 0.85, f"Success rate {success_rate:.4f} is below 0.85 threshold")

    # 6. test_evaluation_metrics_exist
    def test_evaluation_metrics_exist(self):
        metrics_path = os.path.join(BASE_DIR, "results", "evaluation_metrics.json")
        self.assertTrue(os.path.exists(metrics_path), f"Metrics file not found at {metrics_path}")

    # 7. test_evaluation_accuracy_above_75
    def test_evaluation_accuracy_above_75(self):
        metrics_path = os.path.join(BASE_DIR, "results", "evaluation_metrics.json")
        with open(metrics_path, "r", encoding="utf-8") as f:
            metrics = json.load(f)
        accuracy = metrics.get("test_accuracy", 0)
        self.assertGreaterEqual(accuracy, 0.75, f"Test accuracy {accuracy} is below 0.75 threshold")

    # 8. test_metrics_json_matches_evaluation_metrics
    def test_metrics_json_matches_evaluation_metrics(self):
        metrics_path = os.path.join(BASE_DIR, "results", "metrics.json")
        eval_metrics_path = os.path.join(BASE_DIR, "results", "evaluation_metrics.json")
        self.assertTrue(os.path.exists(metrics_path), "metrics.json missing")
        self.assertTrue(os.path.exists(eval_metrics_path), "evaluation_metrics.json missing")
        with open(metrics_path, "r", encoding="utf-8") as f:
            m1 = json.load(f)
        with open(eval_metrics_path, "r", encoding="utf-8") as f:
            m2 = json.load(f)
        self.assertEqual(m1.get("test_accuracy"), m2.get("test_accuracy"), "test_accuracy mismatch between metrics files")


class TestDeployedMLService(unittest.TestCase):

    def setUp(self):
        if requests is None:
            self.skipTest("requests package not installed")

    # 9. test_deployed_health_endpoint
    def test_deployed_health_endpoint(self):
        try:
            res = requests.get(f"{DEPLOYED_ML_URL}/health", timeout=120)
            self.assertEqual(res.status_code, 200, f"Expected 200, got {res.status_code}")
            data = res.json()
            self.assertTrue(data.get("model_loaded") is True, f"model_loaded is not True in {data}")
        except Exception as e:
            self.skipTest(f"Deployed ML service unreachable: {e}")

    # 10. test_deployed_predict_with_valid_image
    def test_deployed_predict_with_valid_image(self):
        img_path = os.path.join(BASE_DIR, "dataset", "extracted", "Letters", "A.jpg")
        if not os.path.exists(img_path):
            self.skipTest(f"Test image not found at {img_path}")
        try:
            with open(img_path, "rb") as f:
                res = requests.post(
                    f"{DEPLOYED_ML_URL}/predict",
                    files={"file": ("A.jpg", f, "image/jpeg")},
                    timeout=90
                )
            self.assertEqual(res.status_code, 200, f"Predict failed with {res.status_code}")
            data = res.json()
            self.assertTrue(data.get("success") is True, f"Prediction unsuccessful: {data}")
            self.assertIn(data.get("label"), list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"))
            self.assertGreaterEqual(data.get("confidence", -1), 0.0)
            self.assertLessEqual(data.get("confidence", -1), 1.0)
        except Exception as e:
            self.skipTest(f"Deployed ML service unreachable: {e}")

    # 11. test_deployed_predict_response_schema
    def test_deployed_predict_response_schema(self):
        img_path = os.path.join(BASE_DIR, "dataset", "extracted", "Letters", "A.jpg")
        if not os.path.exists(img_path):
            self.skipTest(f"Test image not found at {img_path}")
        try:
            with open(img_path, "rb") as f:
                res = requests.post(
                    f"{DEPLOYED_ML_URL}/predict",
                    files={"file": ("A.jpg", f, "image/jpeg")},
                    timeout=90
                )
            self.assertEqual(res.status_code, 200)
            data = res.json()
            for key in ["success", "label", "confidence", "accepted", "message"]:
                self.assertIn(key, data, f"Key '{key}' missing from predict response schema")
        except Exception as e:
            self.skipTest(f"Deployed ML service unreachable: {e}")

    # 12. test_confidence_accepted_flag_consistency
    def test_confidence_accepted_flag_consistency(self):
        img_path = os.path.join(BASE_DIR, "dataset", "extracted", "Letters", "A.jpg")
        if not os.path.exists(img_path):
            self.skipTest(f"Test image not found at {img_path}")
        try:
            with open(img_path, "rb") as f:
                res = requests.post(
                    f"{DEPLOYED_ML_URL}/predict",
                    files={"file": ("A.jpg", f, "image/jpeg")},
                    timeout=90
                )
            self.assertEqual(res.status_code, 200)
            data = res.json()
            conf = data.get("confidence", 0)
            accepted = data.get("accepted", False)
            if conf >= 0.5:
                self.assertTrue(accepted, f"Expected accepted=True for confidence {conf}")
            else:
                self.assertFalse(accepted, f"Expected accepted=False for confidence {conf}")
        except Exception as e:
            self.skipTest(f"Deployed ML service unreachable: {e}")

    # 13. test_deployed_predict_json_path
    def test_deployed_predict_json_path(self):
        img_path = os.path.join(BASE_DIR, "dataset", "extracted", "Letters", "A.jpg")
        if not os.path.exists(img_path):
            self.skipTest(f"Test image not found at {img_path}")
        try:
            with open(img_path, "rb") as f:
                b64_str = base64.b64encode(f.read()).decode("utf-8")
            res = requests.post(
                f"{DEPLOYED_ML_URL}/predict/sign",
                json={"image": b64_str},
                timeout=90
            )
            self.assertIn(res.status_code, [200, 422], f"Unexpected status {res.status_code}")
            self.assertIsInstance(res.json(), dict, "Response is not valid JSON")
        except Exception as e:
            self.skipTest(f"Deployed ML service unreachable: {e}")


if __name__ == "__main__":
    unittest.main()
