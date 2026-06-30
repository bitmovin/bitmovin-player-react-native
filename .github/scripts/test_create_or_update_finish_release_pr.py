import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parent / "create_or_update_finish_release_pr.sh"


class CreateOrUpdateFinishReleasePrTests(unittest.TestCase):
    def test_creates_pr_when_no_existing_pr_matches(self) -> None:
        calls = self.run_script(existing_pr_number="")

        self.assertEqual(self.expected_list_call(), calls[0])
        self.assertEqual(
            [
                "pr",
                "create",
                "--base",
                "development",
                "--head",
                "finish-release/v1.22.0-sync-development",
                "--title",
                "Finish release 1.22.0",
                "--body-file",
                "finish-release-pr-body.md",
            ],
            calls[1],
        )

    def test_updates_existing_pr_on_rerun(self) -> None:
        calls = self.run_script(existing_pr_number="123")

        self.assertEqual(self.expected_list_call(), calls[0])
        self.assertEqual(
            [
                "pr",
                "edit",
                "123",
                "--title",
                "Finish release 1.22.0",
                "--body-file",
                "finish-release-pr-body.md",
            ],
            calls[1],
        )

    def run_script(self, existing_pr_number: str) -> list[list[str]]:
        with tempfile.TemporaryDirectory() as temporary_directory:
            temporary_path = Path(temporary_directory)
            fake_bin_path = temporary_path / "bin"
            fake_bin_path.mkdir()
            call_log_path = temporary_path / "gh-calls.jsonl"
            fake_gh_path = fake_bin_path / "gh"
            fake_gh_path.write_text(
                "#!/usr/bin/env python3\n"
                "import json\n"
                "import os\n"
                "import sys\n"
                "with open(os.environ['GH_FAKE_CALL_LOG'], 'a', encoding='utf-8') as log:\n"
                "    log.write(json.dumps(sys.argv[1:]) + '\\n')\n"
                "if sys.argv[1:3] == ['pr', 'list'] and os.environ.get('GH_FAKE_EXISTING_PR'):\n"
                "    print(os.environ['GH_FAKE_EXISTING_PR'])\n",
                encoding="utf-8",
            )
            fake_gh_path.chmod(0o755)

            environment = os.environ.copy()
            environment["PATH"] = f"{fake_bin_path}:{environment['PATH']}"
            environment["GH_FAKE_CALL_LOG"] = str(call_log_path)
            environment["GH_FAKE_EXISTING_PR"] = existing_pr_number

            subprocess.run(
                [
                    "bash",
                    str(SCRIPT_PATH),
                    "finish-release/v1.22.0-sync-development",
                    "development",
                    "Finish release 1.22.0",
                    "finish-release-pr-body.md",
                ],
                check=True,
                env=environment,
            )

            return [
                json.loads(line)
                for line in call_log_path.read_text(encoding="utf-8").splitlines()
            ]

    def expected_list_call(self) -> list[str]:
        return [
            "pr",
            "list",
            "--state",
            "open",
            "--head",
            "finish-release/v1.22.0-sync-development",
            "--base",
            "development",
            "--json",
            "number",
            "--jq",
            ".[0].number // empty",
        ]


if __name__ == "__main__":
    unittest.main()
