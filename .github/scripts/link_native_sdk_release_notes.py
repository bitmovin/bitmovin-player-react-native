"""Build Bitmovin native SDK release-note links."""
from __future__ import annotations

import re


NATIVE_SDK_RELEASE_NOTES_URLS = {
    "android": "https://developer.bitmovin.com/playback/docs/release-notes-android",
    "ios": "https://developer.bitmovin.com/playback/docs/release-notes-ios",
}
SEMVER_PATTERN = re.compile(
    r"^v?"
    r"(?P<major>0|[1-9]\d*)\."
    r"(?P<minor>0|[1-9]\d*)\."
    r"(?P<patch>0|[1-9]\d*)"
    r"(?:-(?P<prerelease>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
    r"(?:\+(?P<build>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$"
)
VALID_PLATFORM_KEYS = set(NATIVE_SDK_RELEASE_NOTES_URLS)


def is_valid_native_sdk_version(version: str) -> bool:
    return SEMVER_PATTERN.fullmatch(version) is not None


def native_sdk_release_notes_url(platform_key: str, version: str) -> str | None:
    if platform_key not in VALID_PLATFORM_KEYS:
        raise ValueError("Platform key must be 'android' or 'ios'")

    match = SEMVER_PATTERN.fullmatch(version)
    if match is None or match.group("prerelease"):
        return None

    anchor = f"{match.group('major')}{match.group('minor')}{match.group('patch')}"
    return f"{NATIVE_SDK_RELEASE_NOTES_URLS[platform_key]}#{anchor}"
