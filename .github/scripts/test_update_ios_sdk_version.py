import json
import tempfile
import unittest
from pathlib import Path

from update_ios_sdk_version import update_version


class UpdateIosSdkVersionTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.manifest = Path(temporary.name) / "dependencies.json"
        source = Path(__file__).resolve().parents[2] / "ios" / "dependencies.json"
        self.original = source.read_text()
        self.manifest.write_text(self.original)
        self.dependencies = json.loads(self.original)

    def test_updates_player_version_and_preserves_other_fields(self):
        update_version(self.manifest, "99.0.0")
        expected = self.dependencies
        expected["player"]["version"] = "99.0.0"
        self.assertEqual(json.loads(self.manifest.read_text()), expected)
        self.assertTrue(self.manifest.read_text().endswith("\n"))

    def test_unchanged_version_leaves_file_untouched(self):
        with self.assertRaisesRegex(ValueError, "already at"):
            update_version(self.manifest, self.dependencies["player"]["version"])
        self.assertEqual(self.manifest.read_text(), self.original)

    def test_invalid_versions_leave_file_untouched(self):
        for version in ("", "3.124", "v3.124.0", "3.124.0\n", "invalid"):
            with self.subTest(version=version):
                with self.assertRaisesRegex(ValueError, "Invalid SDK version"):
                    update_version(self.manifest, version)
                self.assertEqual(self.manifest.read_text(), self.original)

    def test_preserves_both_ima_entries(self):
        update_version(self.manifest, "99.0.0-beta.1")
        updated = json.loads(self.manifest.read_text())
        self.assertEqual(updated["ima"], self.dependencies["ima"])
        self.assertEqual(updated["player"]["version"], "99.0.0-beta.1")


if __name__ == "__main__":
    unittest.main()
