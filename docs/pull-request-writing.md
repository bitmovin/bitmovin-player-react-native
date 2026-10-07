# Writing pull requests

Read the current [PR template](../.github/PULL_REQUEST_TEMPLATE.md) before drafting. Keep its headings
and order; remove optional sections and checklist items that do not apply.

## Explain why, then give the highlights

Start with the concrete problem, why it matters, and the resulting behavior.
Include enough context to review without opening an issue. For platform-specific
changes, name the affected platforms and any compatibility limits.

Changes should usually need 1–3 short bullets. Six is the normal ceiling, never
a target; exceed it only for independent points essential to review. Keep
behavior, compatibility, consequential decisions, and limitations. Cut file,
helper, delegate, and bridge-wiring inventories and review-fix history. Explain
a mechanism only when its consequence changes the review.

## Edit for reviewer value

Ask of every sentence: does this help the reviewer in a significant way, or is
it mostly filler? Replace jargon with plain words. Keep exact API, sample, or
test names when needed to identify a contract, locate coverage, or follow a
smoke test.

Privately score each highlight and every independent claim inside it:

- 0–5: filler, repetition, obvious diff detail, or implementation inventory; discard
- 6–8: useful behavior, compatibility, decision, coverage, or risk context
- 9–10: essential context whose absence could cause a wrong review decision

Score strictly. Effort, complexity, and file counts earn no points. If removing
a claim would not meaningfully affect review, it scores below six. Never publish
scores or pack low-value claims into long bullets to meet the limit. Check for
repeated ideas across sections; a small PR can have one highlight.

## Tests describes coverage

Describe which behaviors added, changed, or removed tests cover. Group related
cases; name a suite only when it helps locate meaningful coverage. If coverage
is unchanged, say so with a brief reason. Explain any important coverage gap.

Do not list execution commands, pass/fail outcomes, test counts, or CI deferrals
in the description. Keep that validation evidence in the delivery report.

## Keep only applicable checklist items

Delete inapplicable author and reviewer checklist lines. Do not leave them
unchecked, tick them as a substitute for applicability, hide them in HTML
comments, or explain inapplicability in a comment. Keep applicable unfinished
items unchecked. Never mark reviewer work done on the author's behalf.

When editing an open PR, fetch its current description first and preserve
attachments and existing reviewer check states.

## Manual testing is a smoke test

When reviewer manual testing is needed, include concise, runnable instructions
and expected results. If a reviewer manual-testing checkbox remains, these
instructions are required before the description is ready for review. An
author's report that they tested it does not replace reviewer instructions.

Start with “Open sample X” in the example app. Omit routine build and launch
steps; link to setup documentation when needed. Include the affected platform,
non-default settings, and required device, assets, or patch. Cover the core
behavior and highest-risk regression, rather than a full test matrix.

For example: “Open sample X on iOS, enable setting Y, and seek during playback.
Playback should resume at the selected position.” Use the actual sample and
setting names in the PR.

If meaningful manual testing does not apply, remove its section and checklist
item. If it applies but no runnable path exists, report the gap instead of
deleting the obligation.

## Public repository

Use public issues, documentation, and examples. Keep internal tickets, private
URLs, customer details, credentials, and local investigation notes out of PRs
and committed documentation. Summarize the relevant problem in public-safe terms.
