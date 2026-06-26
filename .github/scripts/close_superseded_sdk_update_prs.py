"""Select open SDK update PRs superseded by a newer SDK update.

Usage:
    gh pr list --state open --json number,headRefName,baseRefName \
      | python3 .github/scripts/close_superseded_sdk_update_prs.py <android|ios> <version> [base-ref]

The script prints TSV rows:
    <pr-number>\t<head-branch>\t<old-version>
"""
from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from functools import total_ordering
from typing import Any


SEMVER_RE = re.compile(
    r"^(?P<major>0|[1-9]\d*)\."
    r"(?P<minor>0|[1-9]\d*)\."
    r"(?P<patch>0|[1-9]\d*)"
    r"(?:-(?P<prerelease>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?"
    r"(?:\+(?P<build>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$"
)
VALID_SDK_NAMES = {"android", "ios"}


@total_ordering
@dataclass(frozen=True)
class SemVer:
    major: int
    minor: int
    patch: int
    prerelease: tuple[str, ...]

    def __lt__(self, other: object) -> bool:
        if not isinstance(other, SemVer):
            return NotImplemented

        own_core = (self.major, self.minor, self.patch)
        other_core = (other.major, other.minor, other.patch)
        if own_core != other_core:
            return own_core < other_core

        return compare_prerelease(self.prerelease, other.prerelease) < 0


def compare_prerelease(left: tuple[str, ...], right: tuple[str, ...]) -> int:
    if not left and not right:
        return 0
    if not left:
        return 1
    if not right:
        return -1

    for left_identifier, right_identifier in zip(left, right):
        left_is_numeric = left_identifier.isdigit()
        right_is_numeric = right_identifier.isdigit()

        if left_is_numeric and right_is_numeric:
            left_value = int(left_identifier)
            right_value = int(right_identifier)
            if left_value != right_value:
                return -1 if left_value < right_value else 1
        elif left_is_numeric != right_is_numeric:
            return -1 if left_is_numeric else 1
        elif left_identifier != right_identifier:
            return -1 if left_identifier < right_identifier else 1

    if len(left) == len(right):
        return 0
    return -1 if len(left) < len(right) else 1


def parse_semver(version: str) -> SemVer | None:
    match = SEMVER_RE.fullmatch(version)
    if match is None:
        return None

    prerelease = match.group("prerelease")
    return SemVer(
        major=int(match.group("major")),
        minor=int(match.group("minor")),
        patch=int(match.group("patch")),
        prerelease=tuple(prerelease.split(".")) if prerelease else (),
    )


def find_superseded_prs(
    sdk_name: str,
    new_version: str,
    prs: list[dict[str, Any]],
    expected_base_ref: str | None = None,
) -> list[dict[str, Any]]:
    if sdk_name not in VALID_SDK_NAMES:
        raise ValueError("SDK name must be 'android' or 'ios'")

    parsed_new_version = parse_semver(new_version)
    if parsed_new_version is None:
        raise ValueError(f"Invalid SemVer version: {new_version}")

    branch_prefix = f"update_{sdk_name}_player_to_"
    superseded_prs = []

    for pr in prs:
        if expected_base_ref is not None and pr.get("baseRefName") != expected_base_ref:
            continue

        head_ref_name = pr.get("headRefName")
        if not isinstance(head_ref_name, str):
            continue
        if not head_ref_name.startswith(branch_prefix):
            continue

        old_version = head_ref_name.removeprefix(branch_prefix)
        parsed_old_version = parse_semver(old_version)
        if parsed_old_version is None:
            continue

        if parsed_old_version < parsed_new_version:
            superseded_prs.append(
                {
                    "number": pr.get("number"),
                    "headRefName": head_ref_name,
                    "version": old_version,
                }
            )

    return superseded_prs


def load_prs_from_stdin() -> list[dict[str, Any]]:
    try:
        prs = json.load(sys.stdin)
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid PR JSON: {error}") from error

    if not isinstance(prs, list):
        raise ValueError("PR JSON must be a list")
    return prs


def main() -> None:
    if len(sys.argv) not in (3, 4):
        print(
            "Usage: python3 close_superseded_sdk_update_prs.py <android|ios> <version> [base-ref]",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        superseded_prs = find_superseded_prs(
            sdk_name=sys.argv[1],
            new_version=sys.argv[2],
            prs=load_prs_from_stdin(),
            expected_base_ref=sys.argv[3] if len(sys.argv) == 4 else None,
        )
    except ValueError as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)

    for pr in superseded_prs:
        print(f"{pr['number']}\t{pr['headRefName']}\t{pr['version']}")


if __name__ == "__main__":
    main()
