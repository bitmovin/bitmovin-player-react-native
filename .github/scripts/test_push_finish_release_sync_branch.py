import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parent / "push_finish_release_sync_branch.sh"
BRANCH_NAME = "finish-release/v1.22.0-sync-development"


class PushFinishReleaseSyncBranchTests(unittest.TestCase):
    def test_pushes_new_sync_branch(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            remote_path, release_path = self.create_repositories(Path(temporary_directory))
            self.commit_release_sync_change(release_path)

            result = self.run_script(release_path)

            self.assertEqual(0, result.returncode, result.stderr)
            self.assertEqual(
                "# Changelog\n\n## [Unreleased]\n",
                self.git(
                    remote_path,
                    "show",
                    f"refs/heads/{BRANCH_NAME}:CHANGELOG.md",
                ).stdout,
            )

    def test_rewrites_remote_branch_with_only_automation_commits(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            remote_path, release_path = self.create_repositories(Path(temporary_directory))
            self.commit_release_sync_change(release_path)
            self.push_branch(release_path)
            self.commit_release_sync_change(release_path, "second automation commit\n")

            result = self.run_script(release_path)

            self.assertEqual(0, result.returncode, result.stderr)
            self.assertEqual(
                "second automation commit\n",
                self.git(
                    remote_path,
                    "show",
                    f"refs/heads/{BRANCH_NAME}:CHANGELOG.md",
                ).stdout,
            )

    def test_rewrites_remote_automation_branch_from_shallow_checkout(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            temporary_path = Path(temporary_directory)
            remote_path, release_path = self.create_repositories(temporary_path)
            self.commit_release_sync_change(release_path)
            self.push_branch(release_path)
            self.advance_release_base(release_path)
            shallow_path = self.clone_shallow_release_base(temporary_path, remote_path)
            self.commit_release_sync_change(shallow_path, "second automation commit\n")

            result = self.run_script(shallow_path)

            self.assertEqual(0, result.returncode, result.stderr)
            self.assertEqual(
                "second automation commit\n",
                self.git(
                    remote_path,
                    "show",
                    f"refs/heads/{BRANCH_NAME}:CHANGELOG.md",
                ).stdout,
            )

    def test_refuses_to_rewrite_remote_branch_with_manual_commit(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            temporary_path = Path(temporary_directory)
            remote_path, release_path = self.create_repositories(temporary_path)
            self.commit_release_sync_change(release_path)
            self.push_branch(release_path)
            manual_path = self.clone_manual_repository(temporary_path, remote_path)
            self.commit_manual_change(manual_path)
            self.push_branch(manual_path)

            self.commit_release_sync_change(release_path, "second automation commit\n")

            result = self.run_script(release_path)

            self.assertEqual(1, result.returncode)
            self.assertIn("Refusing to rewrite", result.stderr)
            self.assertEqual(
                "manual change",
                self.git(
                    remote_path,
                    "log",
                    "-1",
                    "--format=%s",
                    f"refs/heads/{BRANCH_NAME}",
                ).stdout.strip(),
            )

    def create_repositories(self, temporary_path: Path) -> tuple[Path, Path]:
        remote_path = temporary_path / "remote.git"
        release_path = temporary_path / "release"

        self.git(temporary_path, "init", "--bare", str(remote_path))
        self.git(temporary_path, "clone", str(remote_path), str(release_path))
        self.configure_user(release_path, "Bitmovin Release Automation", "support@bitmovin.com")
        self.git(release_path, "checkout", "-B", "main")
        (release_path / "CHANGELOG.md").write_text("# Changelog\n", encoding="utf-8")
        self.git(release_path, "add", "CHANGELOG.md")
        self.git(release_path, "commit", "-m", "initial release base")
        self.git(release_path, "push", "origin", "HEAD:main")
        self.git(release_path, "checkout", "-B", BRANCH_NAME, "main")

        return remote_path, release_path

    def clone_manual_repository(self, temporary_path: Path, remote_path: Path) -> Path:
        manual_path = temporary_path / "manual"
        self.git(temporary_path, "clone", str(remote_path), str(manual_path))
        self.configure_user(manual_path, "Manual User", "manual@example.com")
        self.git(manual_path, "checkout", "-B", BRANCH_NAME, f"origin/{BRANCH_NAME}")
        return manual_path

    def clone_shallow_release_base(self, temporary_path: Path, remote_path: Path) -> Path:
        shallow_path = temporary_path / "shallow"
        self.git(
            temporary_path,
            "clone",
            "--depth",
            "1",
            "--branch",
            "main",
            f"file://{remote_path}",
            str(shallow_path),
        )
        self.configure_user(shallow_path, "Bitmovin Release Automation", "support@bitmovin.com")
        self.git(shallow_path, "checkout", "-B", BRANCH_NAME)
        return shallow_path

    def commit_release_sync_change(
        self,
        repository_path: Path,
        changelog_content: str = "# Changelog\n\n## [Unreleased]\n",
    ) -> None:
        (repository_path / "CHANGELOG.md").write_text(changelog_content, encoding="utf-8")
        self.git(repository_path, "add", "CHANGELOG.md")
        self.git(repository_path, "commit", "-m", "restore unreleased changelog section")

    def commit_manual_change(self, repository_path: Path) -> None:
        (repository_path / "manual.txt").write_text("manual\n", encoding="utf-8")
        self.git(repository_path, "add", "manual.txt")
        self.git(repository_path, "commit", "-m", "manual change")

    def advance_release_base(self, repository_path: Path) -> None:
        self.git(repository_path, "checkout", "main")
        (repository_path / "base.txt").write_text("base advanced\n", encoding="utf-8")
        self.git(repository_path, "add", "base.txt")
        self.git(repository_path, "commit", "-m", "advance release base")
        self.git(repository_path, "push", "origin", "HEAD:main")

    def push_branch(self, repository_path: Path) -> None:
        self.git(repository_path, "push", "origin", f"HEAD:{BRANCH_NAME}")

    def run_script(self, repository_path: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["bash", str(SCRIPT_PATH), BRANCH_NAME],
            cwd=repository_path,
            text=True,
            capture_output=True,
        )

    def configure_user(self, repository_path: Path, name: str, email: str) -> None:
        self.git(repository_path, "config", "user.name", name)
        self.git(repository_path, "config", "user.email", email)

    def git(
        self,
        cwd: Path,
        *args: str,
        check: bool = True,
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["git", *args],
            cwd=cwd,
            check=check,
            text=True,
            capture_output=True,
        )


if __name__ == "__main__":
    unittest.main()
