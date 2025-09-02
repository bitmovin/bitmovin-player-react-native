"""Update the Unreleased → Changed section in CHANGELOG.md with a new SDK version entry.

Usage:
    python3 update_player_sdk_update_changelog.py <version> <android|ios>

Notes:
- Keeps the same CLI interface as before.
- More robust handling of line endings (LF/CRLF), whitespace, and semver (incl. pre-release/build).
- Idempotently replaces existing SDK update line for the given platform or inserts at the top of the Changed list.
"""
from __future__ import annotations

import sys
import re
from typing import Tuple


CHANGELOG_FILE = "CHANGELOG.md"

# Common headers and labels
HEADER_CHANGELOG = "# Changelog"
HEADER_UNRELEASED = "## [Unreleased]"
SUBHEADER_CHANGED = "### Changed"

# CLI / messages
MESSAGE_USAGE = "Usage: python3 update_player_sdk_update_changelog.py.py <version> <platform>"
ERROR_INVALID_PLATFORM = "Error: Invalid platform. Must be 'android' or 'ios'."
ERROR_INVALID_VERSION = (
    "Error: Invalid version. Must be SemVer, e.g. 1.2.3, 1.2.3-beta.1, or 1.2.3+build."
)
MESSAGE_SUCCESS = "Changelog updated successfully."
MESSAGE_ADDING_ENTRY = (
    "Adding entry for platform '{platform}' with version '{version}' to {file}"
)

# Platforms and labels
PLATFORM_ANDROID = "android"
PLATFORM_IOS = "ios"
PLATFORMS = {PLATFORM_ANDROID: "Android", PLATFORM_IOS: "iOS"}

# SemVer: MAJOR.MINOR.PATCH with optional -pre-release and +build metadata
SEMVER_RE = r"[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?"

# Entry line template pieces
ENTRY_LINE_PREFIX = "- Update Bitmovin's native {platform} SDK version to `"


def normalize_newlines(text: str) -> str:
    """Normalize CRLF to LF to make regex handling deterministic."""
    return text.replace("\r\n", "\n")


def load_changelog(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return normalize_newlines(f.read())
    except FileNotFoundError:
        print(f"Error: {path} not found.")
        sys.exit(1)


def write_changelog(path: str, content: str) -> None:
    # Collapse 3+ blank lines to 2 to avoid excessive spacing
    content = re.sub(r"\n{3,}", "\n\n", content)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)


def build_entry(platform_key: str, version: str) -> Tuple[str, re.Pattern[str]]:
    platform_label = PLATFORMS[platform_key]
    entry_prefix = ENTRY_LINE_PREFIX.format(platform=platform_label)
    new_entry = f"{entry_prefix}{version}`"
    # Pattern to find an existing entry for this platform regardless of version
    existing_pattern = re.compile(
        rf"^{re.escape(entry_prefix)}{SEMVER_RE}`$",
        flags=re.MULTILINE,
    )
    return new_entry, existing_pattern


def update_unreleased_changed_section(content: str, platform_key: str, version: str) -> str:
    # Find Unreleased section (tolerate optional text after header and CRLF)
    unreleased_section_pattern = re.compile(
        rf"({re.escape(HEADER_UNRELEASED)}[^\n]*\n)(.*?)(?=\n## \[|\Z)",
        flags=re.DOTALL,
    )

    match = unreleased_section_pattern.search(content)

    new_entry, existing_pattern = build_entry(platform_key, version)

    if match:
        unreleased_header = match.group(1)
        unreleased_body = match.group(2)

        # Locate or create the '### Changed' subsection inside Unreleased
        changed_subsection_pattern = re.compile(
            rf"({re.escape(SUBHEADER_CHANGED)}[^\n]*\n\n)(.*?)(?=\n## \[|\n### |\Z)",
            flags=re.DOTALL,
        )
        changed_match = changed_subsection_pattern.search(unreleased_body)

        if changed_match:
            changed_header = changed_match.group(1)
            changed_body = changed_match.group(2)

            if existing_pattern.search(changed_body):
                # Replace existing line for this platform
                new_changed_body = existing_pattern.sub(new_entry, changed_body)
            else:
                # Prepend new entry to keep fresh updates at the top
                new_changed_body = new_entry + "\n" + changed_body

            new_unreleased_body = changed_subsection_pattern.sub(
                changed_header + new_changed_body,
                unreleased_body,
            )
        else:
            # Create the Changed subsection with our new entry
            suffix = "\n" if not unreleased_body.endswith("\n") else ""
            new_unreleased_body = (
                unreleased_body
                + suffix
                + f"\n{SUBHEADER_CHANGED}\n\n"
                + new_entry
                + "\n"
            )

        # Reassemble content with the updated Unreleased section
        return unreleased_section_pattern.sub(
            unreleased_header + new_unreleased_body, content, count=1
        )

    # No Unreleased section – insert one after '# Changelog' header if present
    changelog_header_pattern = re.compile(rf"({re.escape(HEADER_CHANGELOG)}[^\n]*\n)")
    header_match = changelog_header_pattern.search(content)

    new_section = f"\n{HEADER_UNRELEASED}\n\n{SUBHEADER_CHANGED}\n\n" + new_entry + "\n"

    if header_match:
        insert_pos = header_match.end()
        return content[:insert_pos] + new_section + content[insert_pos:]

    # If even the top-level header is missing, prepend a standard header
    return f"{HEADER_CHANGELOG}\n" + new_section + content


def validate_inputs(version: str, platform: str) -> None:
    if platform not in PLATFORMS:
        print(ERROR_INVALID_PLATFORM)
        sys.exit(1)
    if not re.fullmatch(SEMVER_RE, version):
        print(ERROR_INVALID_VERSION)
        sys.exit(1)


def main() -> None:
    if len(sys.argv) != 3:
        print(MESSAGE_USAGE)
        sys.exit(1)

    version = sys.argv[1].strip()
    platform = sys.argv[2].strip().lower()

    validate_inputs(version, platform)

    print(MESSAGE_ADDING_ENTRY.format(platform=platform, version=version, file=CHANGELOG_FILE))

    content = load_changelog(CHANGELOG_FILE)
    new_content = update_unreleased_changed_section(content, platform, version)

    write_changelog(CHANGELOG_FILE, new_content)
    print(MESSAGE_SUCCESS)


if __name__ == "__main__":
    main()
