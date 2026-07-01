import unittest

from link_native_sdk_release_notes import (
    is_valid_native_sdk_version,
    native_sdk_release_notes_url,
)


class LinkNativeSdkReleaseNotesTests(unittest.TestCase):
    def test_builds_android_release_notes_url_ignoring_build_metadata(self) -> None:
        self.assertEqual(
            "https://developer.bitmovin.com/playback/docs/release-notes-android#31551",
            native_sdk_release_notes_url("android", "3.155.1+jason"),
        )

    def test_builds_ios_release_notes_url(self) -> None:
        self.assertEqual(
            "https://developer.bitmovin.com/playback/docs/release-notes-ios#31150",
            native_sdk_release_notes_url("ios", "3.115.0"),
        )

    def test_builds_legacy_v_prefixed_release_notes_url(self) -> None:
        self.assertEqual(
            "https://developer.bitmovin.com/playback/docs/release-notes-ios#3360",
            native_sdk_release_notes_url("ios", "v3.36.0"),
        )

    def test_prerelease_versions_are_valid_but_not_linkable(self) -> None:
        self.assertTrue(is_valid_native_sdk_version("3.115.0-beta.1"))
        self.assertIsNone(native_sdk_release_notes_url("ios", "3.115.0-beta.1"))

    def test_rejects_malformed_versions(self) -> None:
        self.assertFalse(is_valid_native_sdk_version("3.115"))
        self.assertFalse(is_valid_native_sdk_version("3.115.0-beta..1"))

    def test_rejects_unknown_platforms(self) -> None:
        with self.assertRaises(ValueError):
            native_sdk_release_notes_url("web", "3.115.0")


if __name__ == "__main__":
    unittest.main()
