#!/usr/bin/env python3

import argparse
import os
import sys
import xml.etree.ElementTree as ET


def load_results(path: str):
    if not os.path.exists(path):
        return None
    root = ET.parse(path).getroot()
    cases = []
    for tc in root.iter("testcase"):
        name = tc.attrib.get("name", "")
        classname = tc.attrib.get("classname", "")
        failure = tc.find("failure")
        cases.append(
            {
                "classname": classname,
                "name": name,
                "failure": None
                if failure is None
                else " ".join(((failure.attrib.get("message") or failure.text or "").strip()).split()),
            }
        )
    tests = int(root.attrib.get("tests", len(cases)))
    failed = int(root.attrib.get("failures", len([c for c in cases if c["failure"]])))
    passed = tests - failed
    return {"tests": tests, "failures": failed, "passed": passed, "cases": cases}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--android", dest="android_path", default=None)
    parser.add_argument("--ios", dest="ios_path", default=None)
    args = parser.parse_args()

    platforms = [
        ("Android", args.android_path, os.environ.get("ANDROID_STATUS")),
        ("iOS", args.ios_path, os.environ.get("IOS_STATUS")),
    ]

    summary_lines = ["## Integration Test Results"]
    overall_fail = False
    overall_totals = {"tests": 0, "passed": 0, "failures": 0}

    for name, path, status in platforms:
        if not path:
            continue
        data = load_results(path)
        if data is None and (status is None or status == ""):
            continue
        if data is None:
            summary_lines.append(f"- {name}: no results file found")
            overall_fail = overall_fail or (status not in (None, "", "0"))
            continue
        overall_totals["tests"] += data["tests"]
        overall_totals["passed"] += data["passed"]
        overall_totals["failures"] += data["failures"]

        # Summary table per platform
        summary_lines.append(f"### {name} Summary")
        summary_lines.append("| Tests | Passed | Failed |")
        summary_lines.append("| --- | --- | --- |")
        summary_lines.append(f"| {data['tests']} | {data['passed']} | {data['failures']} |")
        summary_lines.append("")

        # Detailed tests table per platform
        summary_lines.append(f"### {name} Tests")
        summary_lines.append("| Test | Result |")
        summary_lines.append("| --- | --- |")
        for case in data["cases"]:
            test_name = f"{case['classname']}.{case['name']}" if case["classname"] else case["name"]
            if case["failure"]:
                summary_lines.append(f"| {test_name} | ❌ Failed |")
                print(f"::error file={path},line=1,col=0::{name} {test_name}: {case['failure']}")
            else:
                summary_lines.append(f"| {test_name} | ✅ Passed |")
        summary_lines.append("")

        overall_fail = overall_fail or data["failures"] > 0 or (status not in (None, "", "0"))

    # Overall table (only if we saw any data)
    if overall_totals["tests"] > 0:
        summary_lines.insert(1, "")
        summary_lines.insert(1, f"| {overall_totals['tests']} | {overall_totals['passed']} | {overall_totals['failures']} |")
        summary_lines.insert(1, "| Tests | Passed | Failed |")
        summary_lines.insert(1, "| --- | --- | --- |")
        summary_lines.insert(1, "### Overall Summary")

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as fh:
            fh.write("\n".join(summary_lines) + "\n")

    sys.exit(1 if overall_fail else 0)


if __name__ == "__main__":
    main()
