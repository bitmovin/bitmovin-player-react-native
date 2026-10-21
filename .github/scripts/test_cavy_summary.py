import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr


SCRIPT = Path(__file__).with_name('cavy_summary.py')
FIXTURES = Path(__file__).with_name('fixtures') / 'cavy'


def report(cases='', **counts):
    attributes = {'name': 'cavy', 'failures': '0', 'errors': '0', **counts}
    return '<testsuite ' + ' '.join(
        f'{key}={quoteattr(str(value))}' for key, value in attributes.items()
    ) + '>' + cases + '</testsuite>'


class CavySummaryTests(unittest.TestCase):
    def render(self, xml=None, outcome='success', **environment):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            if xml is not None:
                (root / 'cavy_results.xml').write_text(xml, encoding='utf-8')
            summary = root / 'summary.md'
            env = {
                **os.environ,
                'GITHUB_STEP_SUMMARY': str(summary),
                'CAVY_ARTIFACTS_DIR': str(root),
                'CAVY_SUMMARY_PLATFORM': 'ios',
                'CAVY_SUMMARY_OS': 'iOS 26.5',
                'CAVY_SUMMARY_DEVICE': 'iPhone 17',
                'CAVY_SUMMARY_HEAD': 'head-sha',
                'CAVY_SUMMARY_TEST_OUTCOME': outcome,
                'CAVY_SUMMARY_JOB_STATUS': 'success',
                'CAVY_SUMMARY_RUN_ALLOWED': 'true',
                'CAVY_SUMMARY_ARTIFACT_NAME': 'ios-cavy-123-1',
                'CAVY_SUMMARY_ARTIFACT_URL': '',
                'CAVY_SUMMARY_ARTIFACT_OUTCOME': 'success',
                'GITHUB_SERVER_URL': 'https://github.com',
                'GITHUB_REPOSITORY': 'bitmovin/player',
                'GITHUB_RUN_ID': '123',
                'GITHUB_RUN_ATTEMPT': '1',
                'GITHUB_SHA': 'checkout-sha',
                **environment,
            }
            result = subprocess.run(
                [sys.executable, str(SCRIPT)], env=env,
                capture_output=True, text=True, timeout=10,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout, '')
            self.assertEqual(result.stderr, '')
            self.assertTrue(summary.exists(), 'summary must be written')
            return summary.read_text(encoding='utf-8')

    def test_saved_android_pass_counts_and_navigation(self):
        output = self.render(
            (FIXTURES / 'android-pass.xml').read_text(),
            CAVY_SUMMARY_PLATFORM='android',
            CAVY_SUMMARY_OS='Android API 36',
            CAVY_SUMMARY_DEVICE='pixel_2 / emulator-5554',
            CAVY_SUMMARY_ARTIFACT_URL='https://github.com/bitmovin/player/actions/runs/123/artifacts/456',
        )
        for expected in ['Passed', '| 64 | 64 | 0 | 0 | 0 |',
                         'Android API 36', 'pixel', 'head', 'checkout',
                         'actions/runs/123/artifacts/456', 'cavy_results.xml',
                         'TV runtime', 'physical devices', 'encrypted playback']:
            self.assertIn(expected, output)

    def test_saved_ios_assertions_include_suite_test_and_message(self):
        output = self.render((FIXTURES / 'ios-failure.xml').read_text(), 'failure')
        for expected in ['Assertion failures', '| 54 | 52 | 2 | 0 | 0 |',
                         'loading a VOD source', 'loading a live source',
                         'emits SourceLoad and SourceLoaded events',
                         'Expectation was not met', 'onSourceLoad', 'FairPlay',
                         'https://github.com/bitmovin/player/actions/runs/123#artifacts']:
            self.assertIn(expected, output)

    def test_missing_malformed_empty_and_zero_reports_are_distinct(self):
        for xml, expected in [(None, 'Missing report'), ('', 'Empty report'),
                              ('<bad', 'Malformed report'), (report(), 'Zero tests')]:
            with self.subTest(expected=expected):
                output = self.render(xml, 'failure')
                self.assertIn(expected, output)
                self.assertNotIn('**Passed**', output)

    def test_invalid_xml_and_aggregate_counts_are_rejected(self):
        for xml in [report('<testcase/>') + '<extra/>',
                    '<!DOCTYPE testsuite [<!ENTITY x "x">]>' + report(),
                    report('<testcase/>', tests='2'),
                    report('<testcase/>', failures='1'),
                    report('<testcase><skipped/></testcase>', skipped='0'),
                    report('<other/>'), '<testsuites/>']:
            with self.subTest(xml=xml):
                self.assertIn('Malformed report', self.render(xml, 'failure'))

    def test_passing_cases_do_not_hide_infrastructure_failure(self):
        output = self.render(report('<testcase name="pass"/>'), 'failure')
        self.assertIn('Infrastructure failure', output)
        self.assertIn('| 1 | 1 | 0 | 0 | 0 |', output)
        self.assertNotIn('**Passed**', output)
        output = self.render(report('<testcase/>'), CAVY_SUMMARY_JOB_STATUS='failure')
        self.assertIn('Infrastructure failure', output)

    def test_skipped_execution_ignores_stale_report_and_reports_policy(self):
        output = self.render(report('<testcase/>'), 'skipped',
                             CAVY_SUMMARY_RUN_ALLOWED='false')
        self.assertIn('Not run', output)
        self.assertIn('fork or Dependabot', output)
        self.assertIn('Counts unavailable', output)
        self.assertNotIn('**Passed**', output)
        self.assertIn('Infrastructure failure', self.render(None, 'skipped'))

    def test_skipped_cases_are_not_passes_and_errors_have_details(self):
        output = self.render(report(
            '<testcase name="skip"><skipped message="unsupported"/></testcase>'
            '<testcase classname="suite" name="crash"><error message="crashed"/></testcase>',
            skipped='1', errors='1'), 'failure')
        for expected in ['Test errors', '| 2 | 0 | 0 | 1 | 1 |', 'crashed', 'Skipped cases']:
            self.assertIn(expected, output)
        output = self.render(report('<testcase><skipped/></testcase>', skipped='1'), 'failure')
        self.assertIn('Incomplete', output)
        self.assertNotIn('**Passed**', output)

    def test_cancellation_is_visible_with_partial_results(self):
        output = self.render(report('<testcase/>'), 'cancelled')
        self.assertIn('Cancelled', output)
        self.assertNotIn('**Passed**', output)

    def test_untrusted_strings_cannot_inject_markdown_html_or_workflow_commands(self):
        attack = '<img src=x> [click](https://evil) `code` | row\n::error::bad'
        xml = report(
            f'<testcase classname={quoteattr(attack)} name={quoteattr(attack)}>'
            f'<failure message={quoteattr(attack)}>{escape(attack)}</failure></testcase>',
            failures='1')
        output = self.render(xml, 'failure', CAVY_SUMMARY_HEAD=attack,
                             CAVY_SUMMARY_ARTIFACT_URL='javascript:alert(1)')
        for unsafe in ['<img', '[click]', '`code`', '| row', '\n::error', 'javascript:']:
            self.assertNotIn(unsafe, output)
        self.assertIn('&#60;img', output)

    def test_artifact_upload_failure_is_explicit_and_still_links_run(self):
        output = self.render(None, 'failure', CAVY_SUMMARY_ARTIFACT_OUTCOME='failure')
        self.assertIn('Artifact upload: failure', output)
        self.assertIn('actions/runs/123#artifacts', output)

    def test_output_and_input_are_bounded(self):
        cases = ''.join(
            f'<testcase classname="{i}{"&lt;" * 1000}" name="{"&amp;" * 1000}">'
            f'<failure message="{"&quot;" * 1000}"/></testcase>' for i in range(50)
        )
        output = self.render(report(cases, failures='50'), 'failure')
        self.assertLess(len(output.encode()), 128 * 1024)
        self.assertIn('30 additional failing cases omitted', output)
        self.assertIn('truncated', output)
        self.assertIn('Report too large', self.render('x' * (2 * 1024 * 1024 + 1), 'failure'))


if __name__ == '__main__':
    unittest.main()
