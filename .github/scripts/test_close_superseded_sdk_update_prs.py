import unittest

from close_superseded_sdk_update_prs import find_superseded_prs, normalize_prs_payload


class FindSupersededPrsTests(unittest.TestCase):
    def test_closes_only_older_prs_for_same_sdk(self) -> None:
        prs = [
            {"number": 10, "headRefName": "update_ios_player_to_3.113.0"},
            {"number": 11, "headRefName": "update_ios_player_to_3.114.0"},
            {"number": 12, "headRefName": "update_ios_player_to_3.115.0"},
            {"number": 13, "headRefName": "update_android_player_to_3.153.0+jason"},
            {"number": 14, "headRefName": "feature/manual-sdk-update"},
        ]

        superseded = find_superseded_prs("ios", "3.114.0", prs)

        self.assertEqual(
            [{"number": 10, "headRefName": "update_ios_player_to_3.113.0", "version": "3.113.0"}],
            superseded,
        )

    def test_handles_android_build_metadata(self) -> None:
        prs = [
            {"number": 20, "headRefName": "update_android_player_to_3.151.0+jason"},
            {"number": 21, "headRefName": "update_android_player_to_3.152.0+preview"},
            {"number": 22, "headRefName": "update_android_player_to_3.153.0+jason"},
        ]

        superseded = find_superseded_prs("android", "3.152.0+jason", prs)

        self.assertEqual(
            [{"number": 20, "headRefName": "update_android_player_to_3.151.0+jason", "version": "3.151.0+jason"}],
            superseded,
        )

    def test_closes_prerelease_when_stable_version_arrives(self) -> None:
        prs = [
            {"number": 30, "headRefName": "update_ios_player_to_3.114.0-beta.1"},
        ]

        superseded = find_superseded_prs("ios", "3.114.0", prs)

        self.assertEqual(
            [{"number": 30, "headRefName": "update_ios_player_to_3.114.0-beta.1", "version": "3.114.0-beta.1"}],
            superseded,
        )

    def test_ignores_malformed_versions(self) -> None:
        prs = [
            {"number": 40, "headRefName": "update_ios_player_to_not-a-version"},
            {"number": 41, "headRefName": "update_ios_player_to_3.113"},
        ]

        superseded = find_superseded_prs("ios", "3.114.0", prs)

        self.assertEqual([], superseded)

    def test_ignores_prs_targeting_different_base_branch(self) -> None:
        prs = [
            {
                "number": 50,
                "headRefName": "update_ios_player_to_3.113.0",
                "baseRefName": "support/v0",
            },
            {
                "number": 51,
                "headRefName": "update_ios_player_to_3.112.0",
                "baseRefName": "development",
            },
        ]

        superseded = find_superseded_prs("ios", "3.114.0", prs, "development")

        self.assertEqual(
            [
                {
                    "number": 51,
                    "headRefName": "update_ios_player_to_3.112.0",
                    "version": "3.112.0",
                }
            ],
            superseded,
        )

    def test_keeps_same_core_version_with_different_build_metadata(self) -> None:
        prs = [
            {"number": 60, "headRefName": "update_android_player_to_3.152.0+preview"},
        ]

        superseded = find_superseded_prs("android", "3.152.0+jason", prs)

        self.assertEqual([], superseded)

    def test_ignores_prerelease_numeric_identifiers_with_leading_zeroes(self) -> None:
        prs = [
            {"number": 70, "headRefName": "update_ios_player_to_3.114.0-01"},
        ]

        superseded = find_superseded_prs("ios", "3.114.0", prs)

        self.assertEqual([], superseded)

    def test_normalizes_paginated_graphql_pr_payload(self) -> None:
        payload = [
            {
                "data": {
                    "repository": {
                        "pullRequests": {
                            "nodes": [
                                {
                                    "number": 80,
                                    "headRefName": "update_ios_player_to_3.113.0",
                                    "baseRefName": "development",
                                }
                            ]
                        }
                    }
                }
            },
            {
                "data": {
                    "repository": {
                        "pullRequests": {
                            "nodes": [
                                {
                                    "number": 81,
                                    "headRefName": "update_ios_player_to_3.112.0",
                                    "baseRefName": "support/v0",
                                }
                            ]
                        }
                    }
                }
            },
        ]

        self.assertEqual(
            [
                {
                    "number": 80,
                    "headRefName": "update_ios_player_to_3.113.0",
                    "baseRefName": "development",
                },
                {
                    "number": 81,
                    "headRefName": "update_ios_player_to_3.112.0",
                    "baseRefName": "support/v0",
                },
            ],
            normalize_prs_payload(payload),
        )

    def test_rejects_malformed_graphql_pr_payload(self) -> None:
        with self.assertRaises(ValueError):
            normalize_prs_payload([{"data": None}])


if __name__ == "__main__":
    unittest.main()
