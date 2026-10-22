"""Publish existing Cavy XML as bounded Markdown without changing test status.

Uses only the standard library so it also runs after dependency setup fails.
Untrusted report content goes only to GITHUB_STEP_SUMMARY, never stdout or
workflow commands. No annotations or GitHub API/token access is needed.
https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#adding-a-job-summary
"""

import os
import re
import string
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path


MAX_REPORT_BYTES = 2 * 1024 * 1024
MAX_FAILURES = 20


def text(value, limit=240):
    value = ''.join(
        ' ' if char.isspace() or unicodedata.category(char).startswith('C') else char
        for char in str(value)
    )
    if len(value) > limit:
        value = value[:limit] + ' (truncated)'
    # Encode Markdown syntax as entities as well as HTML syntax. In particular,
    # pipes cannot add table cells and newlines cannot create workflow commands.
    return ''.join(
        f'&#{ord(char)};' if char in string.punctuation else char
        for char in value
    )


class ReportTreeBuilder(ET.TreeBuilder):
    def doctype(self, name, pubid, system):
        # Reject real DTDs without mistaking CDATA or comments for declarations.
        raise ValueError('XML declarations are not supported')


def read_report(directory):
    try:
        with (Path(directory) / 'cavy_results.xml').open('rb') as source:
            raw = source.read(MAX_REPORT_BYTES + 1)
    except FileNotFoundError:
        return 'Missing report', None
    except OSError:
        return 'Unreadable report', None
    if len(raw) > MAX_REPORT_BYTES:
        return 'Report too large (limit: 2 MiB)', None
    if not raw.strip():
        return 'Empty report', None
    try:
        xml = raw.decode('utf-8-sig')
        root = ET.fromstring(xml, parser=ET.XMLParser(target=ReportTreeBuilder()))
        if root.tag != 'testsuite' or any(case.tag != 'testcase' for case in root):
            raise ValueError('Expected Cavy testsuite/testcase format')
        counts = {'tests': len(root), 'failures': 0, 'errors': 0, 'skipped': 0}
        for case in root:
            statuses = [case.find(tag) is not None for tag in ('failure', 'error', 'skipped')]
            if sum(statuses) > 1:
                raise ValueError('Conflicting case statuses')
            for key, present in zip(('failures', 'errors', 'skipped'), statuses):
                counts[key] += present
        for key in counts:
            supplied = root.get(key)
            # The pinned Cavy CLI omits tests; real testcase elements are the
            # source of truth. Validate aggregates whenever they are supplied.
            if supplied is None and key in ('tests', 'skipped'):
                continue
            if not supplied or not re.fullmatch(r'[0-9]+', supplied):
                raise ValueError('Invalid count')
            if int(supplied) != counts[key]:
                raise ValueError('Mismatched count')
        counts['passed'] = counts['tests'] - sum(
            counts[key] for key in ('failures', 'errors', 'skipped')
        )
        return '', (root, counts)
    except (ValueError, ET.ParseError):
        return 'Malformed report (invalid XML or inconsistent counts)', None


def run_url(env):
    server = env.get('GITHUB_SERVER_URL', '')
    repository = env.get('GITHUB_REPOSITORY', '')
    run_id = env.get('GITHUB_RUN_ID', '')
    if (re.fullmatch(r'https://[A-Za-z0-9.-]+(?::[0-9]+)?', server)
            and re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository)
            and re.fullmatch(r'[0-9]+', run_id)):
        return f'{server}/{repository}/actions/runs/{run_id}'
    return ''


def build_summary(env):
    outcome = env.get('CAVY_SUMMARY_TEST_OUTCOME', '')
    job_status = env.get('CAVY_SUMMARY_JOB_STATUS', '')
    executed = outcome in ('success', 'failure', 'cancelled')
    problem, result = read_report(env.get('CAVY_ARTIFACTS_DIR', '.')) if executed else ('', None)
    counts = result[1] if result else None
    if outcome == 'cancelled' or job_status == 'cancelled':
        state = 'Cancelled; results may be partial'
    elif not executed:
        state = (
            'Not run: fork or Dependabot policy (no license secret exposed)'
            if env.get('CAVY_SUMMARY_RUN_ALLOWED') == 'false'
            else 'Infrastructure failure: test step did not run'
        )
    elif problem:
        state = problem
    elif not counts['tests']:
        state = 'Zero tests'
    elif counts['errors']:
        state = 'Test errors'
    elif counts['failures']:
        state = 'Assertion failures'
    elif counts['skipped']:
        state = 'Incomplete: skipped cases are not passes'
    elif outcome != 'success' or job_status != 'success':
        state = 'Infrastructure failure: reported cases passed, but execution, cleanup or job failed'
    else:
        state = 'Passed'

    lines = [
        f'## Cavy integration tests: {text(env.get("CAVY_SUMMARY_PLATFORM", "unknown"))}',
        '', f'**{state}**', '',
        '| OS / runtime | Device | Head SHA | Checkout SHA | Attempt |',
        '| --- | --- | --- | --- | --- |',
        '| ' + ' | '.join(text(env.get(key, 'unknown')) for key in (
            'CAVY_SUMMARY_OS', 'CAVY_SUMMARY_DEVICE', 'CAVY_SUMMARY_HEAD',
            'GITHUB_SHA', 'GITHUB_RUN_ATTEMPT',
        )) + ' |', '',
        f'Test step: {text(outcome or "not started")}; job before summary: {text(job_status)}.', '',
    ]
    if counts is None:
        lines += ['Counts unavailable; no tests are claimed as passing.', '']
    else:
        lines += [
            '| Total reported | Passed | Failed assertions | Errors | Skipped |',
            '| --- | --- | --- | --- | --- |',
            '| ' + ' | '.join(str(counts[key]) for key in (
                'tests', 'passed', 'failures', 'errors', 'skipped',
            )) + ' |', '',
        ]
        failures = [case for case in result[0]
                    if case.find('failure') is not None or case.find('error') is not None]
        if failures:
            lines += ['### Failing cases', '', '| Suite | Test | Assertion / error |',
                      '| --- | --- | --- |']
            for case in failures[:MAX_FAILURES]:
                details = []
                for child in case:
                    if child.tag in ('failure', 'error'):
                        details += [child.get('message', ''), ''.join(child.itertext())]
                lines += ['| ' + ' | '.join((
                    text(case.get('classname', 'unknown suite'), 120),
                    text(case.get('name', 'unnamed test'), 200),
                    text(' '.join(details).strip() or 'No assertion message supplied', 500),
                )) + ' |']
            lines += ['']
            if len(failures) > MAX_FAILURES:
                lines += [f'{len(failures) - MAX_FAILURES} additional failing cases omitted; see the full reports.', '']
        if counts['skipped']:
            lines += ['Skipped cases are excluded from the passed count; see the XML for details.', '']
    if problem or (counts and not counts['tests']):
        lines += ['Report unavailable or unusable: inspect supervisor, build, launcher and Cavy logs for infrastructure failures.', '']

    lines += ['Counts describe only the cases present in the XML report; absent suites are not passes.',
              '', '### Diagnostics', '',
              f'Artifact upload: {text(env.get("CAVY_SUMMARY_ARTIFACT_OUTCOME", "unknown"))}.',
              f'Artifact name: {text(env.get("CAVY_SUMMARY_ARTIFACT_NAME", "unknown"))}.', '']
    url = run_url(env)
    artifact = env.get('CAVY_SUMMARY_ARTIFACT_URL', '')
    if url:
        if re.fullmatch(re.escape(url) + r'/artifacts/[0-9]+', artifact):
            lines += [f'[Download diagnostics artifact]({artifact}) · [All run artifacts]({url}#artifacts)']
        else:
            lines += [f'[Open run artifacts]({url}#artifacts) (select the artifact name above; upload may be unavailable).']
    return '\n'.join(lines) + '\n'


if __name__ == '__main__':
    # GitHub provides this path in Actions; local invocations have no summary sink.
    if destination := os.environ.get('GITHUB_STEP_SUMMARY'):
        with Path(destination).open('a', encoding='utf-8') as summary:
            summary.write(build_summary(os.environ))
