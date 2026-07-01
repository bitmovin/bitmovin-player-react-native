#!/usr/bin/env bash
set -euo pipefail

branch_name="$1"
target_base="$2"
pr_title="$3"
pr_body_file="$4"

existing_pr_number="$(
  gh pr list \
    --state open \
    --head "$branch_name" \
    --base "$target_base" \
    --json number \
    --jq '.[0].number // empty'
)"

if [ -n "$existing_pr_number" ]; then
  gh pr edit "$existing_pr_number" \
    --title "$pr_title" \
    --body-file "$pr_body_file"
else
  gh pr create \
    --base "$target_base" \
    --head "$branch_name" \
    --title "$pr_title" \
    --body-file "$pr_body_file"
fi
