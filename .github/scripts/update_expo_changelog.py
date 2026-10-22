"""Record the aligned Expo patch in the Unreleased changelog."""
import json
from pathlib import Path
import re

from ensure_unreleased_changelog import ensure_unreleased_section


def update_changelog(content: str, version: str) -> str:
    if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version):
        raise ValueError(f"Expected a stable Expo version, got {version!r}")
    content = ensure_unreleased_section(content)
    section = re.search(r"(^## \[Unreleased\][^\n]*\n)(.*?)(?=^## |\Z)", content, re.M | re.S)
    body = section.group(2)
    entry = f"- Update Expo SDK version to `{version}`"
    changed = re.search(r"(^### Changed\n\n)(.*?)(?=^### |\Z)", body, re.M | re.S)
    if changed:
        changes = changed.group(2)
        pattern = r"^- Update Expo SDK version to `[^`]+`[^\n]*$"
        if re.search(pattern, changes, re.M):
            changes = re.sub(pattern, lambda _: entry, changes, flags=re.M)
        else:
            changes = entry + "\n" + changes
        body = body[:changed.start(2)] + changes + body[changed.end(2):]
    else:
        body = body.rstrip("\n")
        body = (body + "\n\n" if body else "\n") + f"### Changed\n\n{entry}\n\n"
    return content[:section.start(2)] + body + content[section.end(2):]


if __name__ == "__main__":
    package = json.loads(Path("package.json").read_text())
    version = package["devDependencies"]["expo"].lstrip("~^")
    changelog = Path("CHANGELOG.md")
    changelog.write_text(update_changelog(changelog.read_text(), version))
