import unittest

from link_native_sdk_changelog import find_link_issues, link_native_sdk_changelog_entries


class LinkNativeSdkChangelogTests(unittest.TestCase):
    def test_links_native_sdk_entries(self) -> None:
        content = (
            "# Changelog\n\n"
            "- Update Bitmovin's native Android SDK version to `3.155.1+jason`\n"
            "- Update Bitmovin's native iOS SDK version to `3.115.0`\n"
        )

        updated = link_native_sdk_changelog_entries(content)

        self.assertIn(
            "- Update Bitmovin's native Android SDK version to [`3.155.1+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31551)",
            updated,
        )
        self.assertIn(
            "- Update Bitmovin's native iOS SDK version to [`3.115.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#31150)",
            updated,
        )

    def test_ignores_non_native_sdk_entries(self) -> None:
        content = "- Update Google Cast SDK version to `4.8.1`\n"

        updated = link_native_sdk_changelog_entries(content)

        self.assertEqual(content, updated)

    def test_preserves_legacy_v_prefix_and_trailing_period(self) -> None:
        content = "- Update Bitmovin's native iOS SDK version to `v3.36.0`.\n"

        updated = link_native_sdk_changelog_entries(content)

        self.assertEqual(
            "- Update Bitmovin's native iOS SDK version to [`v3.36.0`](https://developer.bitmovin.com/playback/docs/release-notes-ios#3360).\n",
            updated,
        )

    def test_leaves_prerelease_entries_unlinked(self) -> None:
        content = "- Update Bitmovin's native iOS SDK version to `3.115.0-beta.1`\n"

        updated = link_native_sdk_changelog_entries(content)

        self.assertEqual(content, updated)

    def test_reports_invalid_native_sdk_versions(self) -> None:
        content = "- Update Bitmovin's native iOS SDK version to `3.115`\n"

        issues = find_link_issues(content)

        self.assertEqual(
            ["line 1: invalid native SDK version `3.115`"],
            issues,
        )

    def test_ignores_invalid_non_native_dependency_versions(self) -> None:
        content = (
            "- Update Google Cast SDK version to `4.8`\n"
            "- Update IMA SDK dependency on Android to `3.38`\n"
        )

        issues = find_link_issues(content)
        updated = link_native_sdk_changelog_entries(content)

        self.assertEqual([], issues)
        self.assertEqual(content, updated)

    def test_replaces_stale_links(self) -> None:
        content = (
            "- Update Bitmovin's native Android SDK version to "
            "[`3.154.0+jason`](https://example.com/wrong#anchor)\n"
        )

        updated = link_native_sdk_changelog_entries(content)

        self.assertEqual(
            "- Update Bitmovin's native Android SDK version to "
            "[`3.154.0+jason`](https://developer.bitmovin.com/playback/docs/release-notes-android#31540)\n",
            updated,
        )


if __name__ == "__main__":
    unittest.main()
