import unittest

from update_expo_changelog import update_changelog


class ExpoChangelogTests(unittest.TestCase):
    def test_creates_unreleased_changed_without_modifying_release(self):
        release = "## [1.0.0] - 2026-01-01\n\n### Changed\n\n- Update Expo SDK version to `56.0.0`\n"
        result = update_changelog("# Changelog\n\n" + release, "57.0.30")
        self.assertIn("## [Unreleased]\n\n### Changed\n\n- Update Expo SDK version to `57.0.30`", result)
        self.assertTrue(result.endswith(release))

    def test_preserves_other_changes_and_sections(self):
        content = "# Changelog\n\n## [Unreleased]\n\n### Added\n\n- Feature\n\n### Changed\n\n- Existing change\n\n### Fixed\n\n- Fix\n"
        result = update_changelog(content, "57.0.30")
        self.assertIn("- Update Expo SDK version to `57.0.30`\n- Existing change", result)
        self.assertIn("### Added\n\n- Feature", result)
        self.assertIn("### Fixed\n\n- Fix", result)

    def test_replaces_previous_patch_entry_idempotently(self):
        content = "# Changelog\n\n## [Unreleased]\n\n### Changed\n\n- Update Expo SDK version to `57.0.29`\n- Other change\n"
        result = update_changelog(content, "57.0.30")
        self.assertNotIn("57.0.29", result)
        self.assertEqual(result.count("57.0.30"), 1)
        self.assertEqual(update_changelog(result, "57.0.30"), result)

    def test_rejects_invalid_version(self):
        with self.assertRaises(ValueError):
            update_changelog("# Changelog\n", "not-a-version")


if __name__ == "__main__":
    unittest.main()
