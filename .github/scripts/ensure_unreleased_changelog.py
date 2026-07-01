"""Ensure CHANGELOG.md contains a top-level [Unreleased] section."""
from __future__ import annotations

import re
import sys


CHANGELOG_FILE = "CHANGELOG.md"
HEADER_CHANGELOG = "# Changelog"
HEADER_UNRELEASED = "## [Unreleased]"


def normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n")


def ensure_unreleased_section(content: str) -> str:
    if re.search(rf"^{re.escape(HEADER_UNRELEASED)}(?:\s|$)", content, flags=re.MULTILINE):
        return content

    release_heading_match = re.search(r"^## \[[^\]]+\]", content, flags=re.MULTILINE)
    if release_heading_match:
        prefix = content[: release_heading_match.start()]
        suffix = content[release_heading_match.start() :]
        prefix = prefix.rstrip("\n") + "\n\n"
        return prefix + HEADER_UNRELEASED + "\n\n" + suffix

    changelog_header_match = re.search(
        rf"^{re.escape(HEADER_CHANGELOG)}[^\n]*\n?",
        content,
        flags=re.MULTILINE,
    )
    if changelog_header_match:
        prefix = content[: changelog_header_match.end()].rstrip("\n") + "\n\n"
        suffix = content[changelog_header_match.end() :].lstrip("\n")
        return prefix + HEADER_UNRELEASED + "\n\n" + suffix

    return HEADER_CHANGELOG + "\n\n" + HEADER_UNRELEASED + "\n\n" + content


def main() -> None:
    path = sys.argv[1] if len(sys.argv) > 1 else CHANGELOG_FILE
    with open(path, "r", encoding="utf-8") as changelog:
        content = normalize_newlines(changelog.read())

    updated = ensure_unreleased_section(content)

    with open(path, "w", encoding="utf-8", newline="\n") as changelog:
        changelog.write(updated)


if __name__ == "__main__":
    main()
