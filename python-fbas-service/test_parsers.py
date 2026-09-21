"""Fixture tests for the python-fbas CLI output parsers.

These exist because the service reads the CLI's stdout. That is a contract with
no schema, and it has already changed underneath us once: syncing python-fbas
turned `min-quorum`'s default output from "Example min quorum:" into
"Example min-cardinality quorum:". The old parser swallowed that as an empty
result, which downstream became a threshold of zero.

Each fixture below is real output copied from the CLI. When a sync breaks one,
that is the point: a failing test here is the signal that the service needs
updating, instead of Radar quietly reporting zeroes.

Run: python -m pytest python-fbas-service/test_parsers.py
"""

import pytest
from fastapi import HTTPException

from app import parse_cardinality, parse_validator_list


TOP_TIER = "Top tier: ['SDF', 'LOBSTR', 'Blockdaemon', 'SatoshiPay']\n"

BLOCKING_SET = (
    "Minimal blocking-set cardinality is: 4\n"
    "Example:\n"
    "['SDF', 'LOBSTR', 'Blockdaemon', 'Range']\n"
)

SPLITTING_SET = (
    "Minimal splitting-set cardinality is: 4\n"
    "Example:\n"
    "['SDF', 'LOBSTR', 'Blockdaemon', 'Range']\n"
    "splits quorums\n"
    "['SDF', 'OBSRVR']\n"
    "and\n"
    "['MoneyGram', 'Creit Technologies LLP']\n"
)

# The pre-sync format. Still produced by `min-quorum --mode minimal`.
MIN_QUORUM_LEGACY = "Example min quorum:\n['SDF', 'LOBSTR', 'Blockdaemon']\n"

# The current default (`--mode min-cardinality`).
MIN_QUORUM_CURRENT = (
    "Minimal quorum cardinality is: 3\n"
    "Example min-cardinality quorum:\n"
    "['SDF', 'LOBSTR', 'Blockdaemon']\n"
)


def test_top_tier():
    assert parse_validator_list('top-tier', TOP_TIER, 'Top tier:') == [
        'SDF', 'LOBSTR', 'Blockdaemon', 'SatoshiPay']


def test_blocking_set_cardinality_and_members():
    assert parse_cardinality(
        'min-blocking-set', BLOCKING_SET,
        'Minimal blocking-set cardinality is:') == 4
    assert parse_validator_list(
        'min-blocking-set', BLOCKING_SET, 'Example:') == [
        'SDF', 'LOBSTR', 'Blockdaemon', 'Range']


def test_splitting_set_cardinality_and_members():
    assert parse_cardinality(
        'min-splitting-set', SPLITTING_SET,
        'Minimal splitting-set cardinality is:') == 4
    assert parse_validator_list(
        'min-splitting-set', SPLITTING_SET, 'Example:') == [
        'SDF', 'LOBSTR', 'Blockdaemon', 'Range']


@pytest.mark.parametrize('output', [MIN_QUORUM_LEGACY, MIN_QUORUM_CURRENT])
def test_min_quorum_accepts_both_formats(output):
    """The sync changed this label; both must keep working."""
    assert parse_validator_list(
        'min-quorum', output,
        'Example min-cardinality quorum:', 'Example min quorum:') == [
        'SDF', 'LOBSTR', 'Blockdaemon']


def test_grouped_output_is_unquoted():
    """With --group-by, python-fbas prints raw group names rather than reprs."""
    grouped = "Minimal blocking-set cardinality is: 2\nExample:\n[sdf.org, lobstr.co]\n"
    assert parse_validator_list(
        'min-blocking-set', grouped, 'Example:') == ['sdf.org', 'lobstr.co']


def test_empty_list_is_not_an_error():
    assert parse_validator_list('top-tier', "Top tier: []\n", 'Top tier:') == []


# ── The point of the whole exercise ──────────────────────────────────────────

def test_missing_cardinality_raises_instead_of_returning_zero():
    with pytest.raises(HTTPException) as caught:
        parse_cardinality(
            'min-splitting-set', "No splitting set found\n",
            'Minimal splitting-set cardinality is:')
    assert caught.value.status_code == 502


def test_changed_label_raises_instead_of_returning_empty():
    """What the sync actually did, had we not accepted both labels."""
    with pytest.raises(HTTPException) as caught:
        parse_validator_list(
            'min-quorum', MIN_QUORUM_CURRENT, 'Example min quorum:')
    assert caught.value.status_code == 502


def test_non_integer_cardinality_raises():
    with pytest.raises(HTTPException):
        parse_cardinality(
            'min-blocking-set',
            "Minimal blocking-set cardinality is: unknown\n",
            'Minimal blocking-set cardinality is:')
