import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from finish_release_sync import build_finish_release_sync, write_outputs


class FinishReleaseSyncTests(unittest.TestCase):
    def test_maps_main_release_to_development_sync_branch(self) -> None:
        sync = build_finish_release_sync("1.22.0", "main")

        self.assertEqual("development", sync.target_base)
        self.assertEqual("finish-release/v1.22.0-sync-development", sync.branch_name)
        self.assertEqual("Finish release 1.22.0", sync.pr_title)
        self.assertIn("automation-owned", sync.pr_body)
        self.assertIn(sync.branch_name, sync.pr_body)

    def test_maps_support_v0_release_to_development_v0_sync_branch(self) -> None:
        sync = build_finish_release_sync("0.9.0", "support/v0")

        self.assertEqual("development-v0", sync.target_base)
        self.assertEqual("finish-release/v0.9.0-sync-development-v0", sync.branch_name)

    def test_rejects_unexpected_release_base_ref(self) -> None:
        with self.assertRaises(ValueError):
            build_finish_release_sync("1.22.0", "feature/unexpected")

    def test_writes_github_outputs_and_pr_body_file(self) -> None:
        sync = build_finish_release_sync("1.22.0", "main")

        with tempfile.TemporaryDirectory() as temporary_directory:
            output_path = Path(temporary_directory) / "github_output"
            body_path = Path(temporary_directory) / "pr_body.md"

            write_outputs(sync, output_path, body_path)

            self.assertEqual(
                "target_base=development\n"
                "branch_name=finish-release/v1.22.0-sync-development\n"
                "pr_title=Finish release 1.22.0\n",
                output_path.read_text(encoding="utf-8"),
            )
            self.assertEqual(sync.pr_body, body_path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
