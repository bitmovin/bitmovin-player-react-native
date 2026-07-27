#!/usr/bin/env bash
set -euo pipefail

branch_name="$1"
remote_name="${2:-origin}"
remote_branch_ref="refs/heads/${branch_name}"

automation_author_email="support@bitmovin.com"
automation_subject="restore unreleased changelog section"
automation_changed_file="CHANGELOG.md"
remote_tracking_ref="refs/remotes/${remote_name}/${branch_name}"
expected_remote_sha=""

is_rewriteable_automation_commit() {
  local commit="$1"
  local author_email subject parent_count changed_files

  author_email="$(git show -s --format=%ae "$commit")"
  subject="$(git show -s --format=%s "$commit")"
  parent_count="$(git show -s --format=%P "$commit" | wc -w | tr -d ' ')"
  changed_files="$(git diff-tree --no-commit-id --name-only -r "$commit")"

  [ "$author_email" = "$automation_author_email" ] &&
    [ "$subject" = "$automation_subject" ] &&
    [ "$parent_count" = "1" ] &&
    [ "$changed_files" = "$automation_changed_file" ]
}

if git ls-remote --exit-code --heads "$remote_name" "$branch_name" >/dev/null; then
  if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
    git fetch --unshallow "$remote_name"
  fi

  git fetch "$remote_name" "+${remote_branch_ref}:${remote_tracking_ref}"
  expected_remote_sha="$(git rev-parse "$remote_tracking_ref")"

  while read -r commit; do
    [ -n "$commit" ] || continue

    if ! is_rewriteable_automation_commit "$commit"; then
      echo "::error::Refusing to rewrite ${branch_name} because it contains non-automation commits." >&2
      echo "Move those changes to a separate PR or update the release source branch, then rerun the workflow." >&2
      echo "Remote-only commits:" >&2
      git log --oneline "HEAD..${remote_tracking_ref}" >&2
      exit 1
    fi
  done < <(git rev-list "HEAD..${remote_tracking_ref}")
else
  status=$?
  if [ "$status" -eq 2 ]; then
    echo "Sync branch does not exist yet"
  else
    exit "$status"
  fi
fi

if [ -n "$expected_remote_sha" ]; then
  git push --force-with-lease="${remote_branch_ref}:${expected_remote_sha}" "$remote_name" "$branch_name"
else
  git push --force-with-lease "$remote_name" "$branch_name"
fi
