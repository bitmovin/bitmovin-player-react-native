import unittest
from contextlib import redirect_stdout
from io import StringIO

from update_player_sdk_update_changelog import update_unreleased_changed_section, validate_inputs


class UpdatePlayerSdkUpdateChangelogTests(unittest.TestCase):
    def test_adds_linked_android_entry(self) -> None:
        content = "# Changelog\n\n## [Unreleased]\n\n### Changed\n\n- Existing change\n"

        updated = update_unreleased_changed_section(content, "android", "3.154.0+jason")

        self.assertIn(
            "- Update Bitmovin's native Android SDK version to [`3.154.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31540)",
            updated,
        )

    def test_adds_linked_ios_entry(self) -> None:
        content = "# Changelog\n\n## [Unreleased]\n\n### Changed\n\n"

        updated = update_unreleased_changed_section(content, "ios", "3.114.1")

        self.assertIn(
            "- Update Bitmovin's native iOS SDK version to [`3.114.1`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31141)",
            updated,
        )

    def test_replaces_unlinked_existing_entry(self) -> None:
        content = (
            "# Changelog\n\n"
            "## [Unreleased]\n\n"
            "### Changed\n\n"
            "- Update Bitmovin's native iOS SDK version to `3.113.0`\n"
        )

        updated = update_unreleased_changed_section(content, "ios", "3.114.1")

        self.assertNotIn("`3.113.0`", updated)
        self.assertIn(
            "- Update Bitmovin's native iOS SDK version to [`3.114.1`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31141)",
            updated,
        )

    def test_replaces_linked_existing_entry_idempotently(self) -> None:
        content = (
            "# Changelog\n\n"
            "## [Unreleased]\n\n"
            "### Changed\n\n"
            "- Update Bitmovin's native Android SDK version to [`3.153.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31530)\n"
        )

        updated = update_unreleased_changed_section(content, "android", "3.154.0+jason")
        updated_again = update_unreleased_changed_section(updated, "android", "3.154.0+jason")

        self.assertEqual(updated, updated_again)
        self.assertEqual(updated.count("release-notes-android"), 1)

    def test_replaces_legacy_v_prefixed_linked_entry_with_trailing_period(self) -> None:
        content = (
            "# Changelog\n\n"
            "## [Unreleased]\n\n"
            "### Changed\n\n"
            "- Update Bitmovin's native iOS SDK version to "
            "[`v3.36.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3360).\n"
        )

        updated = update_unreleased_changed_section(content, "ios", "3.114.1")

        self.assertNotIn("v3.36.0", updated)
        self.assertEqual(updated.count("native iOS SDK version"), 1)
        self.assertIn(
            "- Update Bitmovin's native iOS SDK version to [`3.114.1`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31141)",
            updated,
        )

    def test_prerelease_entry_is_not_linked(self) -> None:
        content = "# Changelog\n\n## [Unreleased]\n\n### Changed\n\n"

        updated = update_unreleased_changed_section(content, "ios", "3.115.0-beta.1")

        self.assertIn("- Update Bitmovin's native iOS SDK version to `3.115.0-beta.1`", updated)
        self.assertNotIn("release-notes-ios", updated)

    def test_rejects_malformed_versions(self) -> None:
        with self.assertRaises(SystemExit), redirect_stdout(StringIO()):
            validate_inputs("3.115.0-beta..1", "ios")

    def test_rejects_v_prefixed_versions(self) -> None:
        with self.assertRaises(SystemExit), redirect_stdout(StringIO()):
            validate_inputs("v3.115.0", "ios")


if __name__ == "__main__":
    unittest.main()
