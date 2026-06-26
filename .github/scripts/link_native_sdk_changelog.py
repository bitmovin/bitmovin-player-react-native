"""Link native SDK update entries in CHANGELOG.md to release notes.

Usage:
    python3 .github/scripts/link_native_sdk_changelog.py [CHANGELOG.md]
    python3 .github/scripts/link_native_sdk_changelog.py --check [CHANGELOG.md]
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from link_native_sdk_release_notes import (
    is_valid_native_sdk_version,
    native_sdk_release_notes_url,
)


CHANGELOG_FILE = "CHANGELOG.md"
PLATFORM_LABELS = {"Android": "android", "iOS": "ios"}

ENTRY_PATTERN = re.compile(
    r"^(?P<prefix>- Update Bitmovin's native (?P<platform>Android|iOS) SDK version to )"
    r"(?:`(?P<plain_version>[^`]+)`|\[`(?P<linked_version>[^`]+)`\]\([^)]+\))"
    r"(?P<trailing_period>\.?)$",
    flags=re.MULTILINE,
)


def link_native_sdk_changelog_entries(content: str) -> str:
    def replace_entry(match: re.Match[str]) -> str:
        version = match.group("plain_version") or match.group("linked_version")
        platform_key = PLATFORM_LABELS[match.group("platform")]
        release_notes_url = native_sdk_release_notes_url(platform_key, version)
        if release_notes_url is None:
            return match.group(0)

        return (
            f"{match.group('prefix')}[`{version}`]({release_notes_url})"
            f"{match.group('trailing_period')}"
        )

    return ENTRY_PATTERN.sub(replace_entry, content)


def find_link_issues(content: str) -> list[str]:
    linked_content = link_native_sdk_changelog_entries(content)

    issues = []
    for match in ENTRY_PATTERN.finditer(content):
        version = match.group("plain_version") or match.group("linked_version")
        if not is_valid_native_sdk_version(version):
            line_number = content.count("\n", 0, match.start()) + 1
            issues.append(f"line {line_number}: invalid native SDK version `{version}`")

    for line_number, (old_line, new_line) in enumerate(
        zip(content.splitlines(), linked_content.splitlines(), strict=True),
        start=1,
    ):
        if old_line != new_line:
            issues.append(f"line {line_number}: {old_line}\n  expected: {new_line}")
    return issues


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("changelog", nargs="?", default=CHANGELOG_FILE)
    parser.add_argument("--check", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    changelog_path = Path(args.changelog)
    content = changelog_path.read_text(encoding="utf-8")

    if args.check:
        issues = find_link_issues(content)
        if not issues:
            print("Native SDK changelog links are up to date.")
            return 0

        print("Native SDK changelog entries need release-note links:", file=sys.stderr)
        print("\n".join(issues), file=sys.stderr)
        return 1

    changelog_path.write_text(
        link_native_sdk_changelog_entries(content),
        encoding="utf-8",
    )
    print(f"Updated native SDK changelog links in {changelog_path}.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
