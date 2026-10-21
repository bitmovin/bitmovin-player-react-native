import os
from pathlib import Path
import subprocess
import tempfile
import unittest


WORKFLOW = Path(__file__).resolve().parents[1] / "workflows/expo-auto-doctor.yml"


def step_script(name):
    lines = WORKFLOW.read_text().splitlines()
    start = lines.index(f"      - name: {name}")
    start = next(i for i in range(start, len(lines)) if lines[i] == "        run: |") + 1
    script = []
    for line in lines[start:]:
        if line and not line.startswith("          "):
            break
        script.append(line[10:])
    return "\n".join(script)


class ExpoAutoDoctorTests(unittest.TestCase):
    def run_step(self, name, gh_output="", gh_exit="0"):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for executable, script in {
                "gh": 'printf "%s" "$GH_RESPONSE"; exit "$GH_EXIT"',
                "git": 'printf "%s\\n" "$*" >> "$COMMAND_LOG"',
                "expo": 'echo "Unexpected Expo command substitution" >&2; exit 99',
            }.items():
                path = root / executable
                path.write_text("#!/bin/bash\n" + script + "\n")
                path.chmod(0o755)
            env = dict(os.environ, PATH=f"{root}:{os.environ['PATH']}",
                       GH_RESPONSE=gh_output, GH_EXIT=gh_exit,
                       GITHUB_REPOSITORY="bitmovin/bitmovin-player-react-native",
                       GITHUB_OUTPUT=str(root / "output"), COMMAND_LOG=str(root / "commands"))
            result = subprocess.run(["bash", "-e", "-o", "pipefail", "-c", step_script(name)],
                                    env=env, text=True, capture_output=True)
            output = root / "output"
            commands = root / "commands"
            return result, output.read_text() if output.exists() else "", commands.read_text() if commands.exists() else ""

    def test_open_pr_is_reported_for_preservation(self):
        result, output, _ = self.run_step("Look up open update PR", "1019")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, "number=1019\n")
        self.assertIn("Leaving open PR #1019 unchanged", result.stdout)

    def test_no_open_pr_allows_a_new_update(self):
        result, output, _ = self.run_step("Look up open update PR")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(output, "number=\n")

    def test_api_failure_does_not_allow_branch_reset(self):
        result, output, _ = self.run_step("Look up open update PR", gh_exit="1")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(output, "")

    def test_commit_does_not_execute_expo_command(self):
        result, _, commands = self.run_step("Commit dependency updates")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("commit -m Align Expo dependencies with compatible patch releases", commands)
        self.assertEqual(result.stderr, "")


if __name__ == "__main__":
    unittest.main()
