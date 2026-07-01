import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from ensure_unreleased_changelog import ensure_unreleased_section


class EnsureUnreleasedSectionTests(unittest.TestCase):
    def test_inserts_unreleased_above_first_release(self) -> None:
        content = "# Changelog\n\n## [1.20.1] - 2026-06-12\n\n### Fixed\n\n- Fix\n"

        updated = ensure_unreleased_section(content)

        self.assertEqual(
            "# Changelog\n\n## [Unreleased]\n\n## [1.20.1] - 2026-06-12\n\n### Fixed\n\n- Fix\n",
            updated,
        )

    def test_does_not_duplicate_existing_unreleased(self) -> None:
        content = "# Changelog\n\n## [Unreleased]\n\n## [1.20.1] - 2026-06-12\n"

        updated = ensure_unreleased_section(content)

        self.assertEqual(content, updated)

    def test_preserves_intro_text(self) -> None:
        content = (
            "# Changelog\n"
            "All notable changes to this project will be documented in this file.\n\n"
            "## [1.20.1] - 2026-06-12\n"
        )

        updated = ensure_unreleased_section(content)

        self.assertEqual(
            "# Changelog\n"
            "All notable changes to this project will be documented in this file.\n\n"
            "## [Unreleased]\n\n"
            "## [1.20.1] - 2026-06-12\n",
            updated,
        )


if __name__ == "__main__":
    unittest.main()
