"""
FBAS Analysis Microservice
FastAPI wrapper around python-fbas CLI tool
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import subprocess
import json
import tempfile
import os
import time
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="FBAS Analysis Service",
    description="Python FBAS scanner microservice for Stellar network analysis",
    version="1.0.0"
)

# CORS middleware (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models

class QuorumSet(BaseModel):
    threshold: int
    validators: List[str]
    innerQuorumSets: List['QuorumSet'] = Field(default_factory=list, alias="innerQuorumSets")

    class Config:
        populate_by_name = True


class GeoData(BaseModel):
    countryName: Optional[str] = None


class FbasNode(BaseModel):
    publicKey: str
    name: Optional[str] = None
    quorumSet: Optional[QuorumSet] = None
    geoData: Optional[GeoData] = None
    isp: Optional[str] = None


class Organization(BaseModel):
    id: str
    name: Optional[str] = None
    validators: List[str]


class AnalysisRequest(BaseModel):
    nodes: List[FbasNode]
    organizations: List[Organization] = Field(default_factory=list)


class TopTierResponse(BaseModel):
    top_tier: List[str]
    top_tier_size: int
    execution_time_ms: int
    cache_hit: bool = False


class BlockingSetsResponse(BaseModel):
    min_size: int
    total_sets: int
    example_set: List[str]
    execution_time_ms: int


class SplittingSetsResponse(BaseModel):
    min_size: int
    total_sets: int
    example_set: List[str]
    has_split: bool
    execution_time_ms: int


class QuorumsResponse(BaseModel):
    min_size: int
    total_quorums: int
    example_quorum: List[str]
    quorum_intersection: bool
    execution_time_ms: int


class HistoryCriticalResponse(BaseModel):
    critical_sets: List[List[str]]
    min_size: int
    execution_time_ms: int


class FullAnalysisResponse(BaseModel):
    top_tier: TopTierResponse
    blocking_sets: BlockingSetsResponse
    splitting_sets: SplittingSetsResponse
    quorums: QuorumsResponse
    total_execution_time_ms: int


class HealthResponse(BaseModel):
    status: str
    version: str
    python_fbas_available: bool


# Helper Functions

def write_temp_json(data: Any) -> str:
    """Write data to temporary JSON file and return path"""
    fd, path = tempfile.mkstemp(suffix='.json', text=True)
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump(data, f)
        return path
    except Exception as e:
        os.close(fd)
        os.unlink(path)
        raise e


def run_python_fbas(args: List[str], timeout: int = 60) -> subprocess.CompletedProcess:
    """Run python-fbas CLI command"""
    try:
        result = subprocess.run(
            ['python-fbas'] + args,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return result
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=504,
            detail=f"Analysis timeout after {timeout} seconds"
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="python-fbas CLI not found. Is it installed?"
        )


class UnrecognizedOutput(HTTPException):
    """python-fbas produced output this service cannot interpret.

    This exists because the alternative -- returning a default -- is worse than
    failing. Every parser below used to fall back to 0 or [] when the expected
    line was missing, so a changed CLI format, a crash, or a "no result" branch
    all arrived downstream as a real-looking answer of zero. Radar renders those
    numbers as safety thresholds, and "0 organizations" is the most alarming
    statement it can make.

    This is not hypothetical: syncing python-fbas changed `min-quorum` to print
    "Example min-cardinality quorum:" instead of "Example min quorum:", which the
    old parser swallowed as an empty quorum of size 0.
    """

    def __init__(self, command: str, expected: str, output: str):
        super().__init__(
            status_code=502,
            detail=(
                f"Could not parse `python-fbas {command}` output. "
                f"Expected {expected}. This usually means the CLI output format "
                f"changed and this service needs updating.\n"
                f"--- output ---\n{output[:2000]}"
            )
        )


def require_success(command: str, result: subprocess.CompletedProcess) -> None:
    """Fail loudly on a non-zero exit rather than parsing whatever came out."""
    if result.returncode != 0:
        logger.error("python-fbas %s exited %s: %s",
                     command, result.returncode, result.stderr)
        raise HTTPException(
            status_code=502,
            detail=f"python-fbas {command} failed: {result.stderr[:2000]}"
        )


def parse_cardinality(command: str, output: str, label: str) -> int:
    """Read `<label>: <int>` from the output, or raise."""
    for line in output.splitlines():
        if label in line:
            try:
                return int(line.split(':')[-1].strip())
            except ValueError:
                raise UnrecognizedOutput(
                    command, f"an integer after '{label}'", output)
    raise UnrecognizedOutput(command, f"a line containing '{label}'", output)


def parse_validator_list(command: str, output: str, *prefixes: str) -> List[str]:
    """Read the bracketed validator list that follows any of `prefixes`.

    The list may sit on the same line as the prefix or on the next one, and
    python-fbas renders group names unquoted when --group-by is in use, so the
    parse is tolerant about quoting but not about the list being absent.
    """
    lines = output.splitlines()
    for index, line in enumerate(lines):
        if not any(line.strip().startswith(prefix) for prefix in prefixes):
            continue
        for candidate in lines[index:index + 3]:
            if '[' in candidate and ']' in candidate:
                inner = candidate[candidate.index(
                    '[') + 1:candidate.rindex(']')].strip()
                if not inner:
                    return []
                return [
                    item.split('(')[0].strip().strip("'\"")
                    for item in inner.split(',')
                    if item.strip()
                ]
        raise UnrecognizedOutput(
            command, f"a bracketed list after '{prefixes[0]}'", output)
    raise UnrecognizedOutput(
        command, f"a line starting with '{prefixes[0]}'", output)


def prepare_fbas_data(request: AnalysisRequest) -> List[Dict]:
    """Convert request nodes to python-fbas format"""
    nodes_data = []
    for node in request.nodes:
        node_dict = {
            "publicKey": node.publicKey,
            "name": node.name
        }

        if node.quorumSet:
            node_dict["quorumSet"] = {
                "threshold": node.quorumSet.threshold,
                "validators": node.quorumSet.validators,
                "innerQuorumSets": [
                    {
                        "threshold": iq.threshold,
                        "validators": iq.validators,
                        "innerQuorumSets": []
                    }
                    for iq in node.quorumSet.innerQuorumSets
                ]
            }

        if node.geoData:
            node_dict["geoData"] = {"countryName": node.geoData.countryName}

        if node.isp:
            node_dict["isp"] = node.isp

        nodes_data.append(node_dict)

    return nodes_data


# API Endpoints

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Test python-fbas is available
        result = run_python_fbas(['--help'], timeout=5)
        available = result.returncode == 0
    except Exception:
        available = False

    return HealthResponse(
        status="healthy" if available else "degraded",
        version="1.0.0",
        python_fbas_available=available
    )


@app.post("/analyze/top-tier", response_model=TopTierResponse)
async def analyze_top_tier(request: AnalysisRequest):
    """Analyze network top tier"""
    logger.info(f"Top tier analysis requested for {len(request.nodes)} nodes")
    start_time = time.time()

    # Prepare data
    nodes_data = prepare_fbas_data(request)
    fbas_file = write_temp_json(nodes_data)

    try:
        # Run analysis
        result = run_python_fbas([
            '--fbas', fbas_file,
            'top-tier'
        ])

        if result.returncode != 0:
            # A network with disjoint quorums genuinely has no top tier, and
            # python-fbas surfaces that as an assertion rather than a result.
            # This is the one empty answer that is a finding rather than a gap.
            if 'AssertionError' in result.stderr and 'find_min_quorum' in result.stderr:
                logger.warning(
                    "Top tier analysis found disjoint quorums; reporting an empty top tier")
                execution_time = int((time.time() - start_time) * 1000)
                return TopTierResponse(
                    top_tier=[],
                    top_tier_size=0,
                    execution_time_ms=execution_time,
                    cache_hit=False
                )
            require_success('top-tier', result)

        top_tier = parse_validator_list('top-tier', result.stdout, 'Top tier:')

        execution_time = int((time.time() - start_time) * 1000)

        return TopTierResponse(
            top_tier=top_tier,
            top_tier_size=len(top_tier),
            execution_time_ms=execution_time,
            cache_hit=False
        )

    finally:
        os.unlink(fbas_file)


@app.post("/analyze/blocking-sets", response_model=BlockingSetsResponse)
async def analyze_blocking_sets(request: AnalysisRequest):
    """Analyze minimal blocking sets"""
    logger.info(f"Blocking sets analysis requested for {len(request.nodes)} nodes")
    start_time = time.time()

    nodes_data = prepare_fbas_data(request)
    fbas_file = write_temp_json(nodes_data)

    try:
        result = run_python_fbas([
            '--fbas', fbas_file,
            'min-blocking-set'
        ])

        require_success('min-blocking-set', result)

        if 'No blocking set found' in result.stdout:
            raise UnrecognizedOutput(
                'min-blocking-set',
                'a blocking set; python-fbas reported none, which this service '
                'cannot express as a size',
                result.stdout)

        min_size = parse_cardinality(
            'min-blocking-set', result.stdout,
            'Minimal blocking-set cardinality is:')
        example_set = parse_validator_list(
            'min-blocking-set', result.stdout, 'Example:')

        execution_time = int((time.time() - start_time) * 1000)

        return BlockingSetsResponse(
            min_size=min_size,
            total_sets=1,  # python-fbas doesn't report total count
            example_set=example_set,
            execution_time_ms=execution_time
        )

    finally:
        os.unlink(fbas_file)


@app.post("/analyze/splitting-sets", response_model=SplittingSetsResponse)
async def analyze_splitting_sets(request: AnalysisRequest):
    """Analyze minimal splitting sets"""
    logger.info(f"Splitting sets analysis requested for {len(request.nodes)} nodes")
    start_time = time.time()

    nodes_data = prepare_fbas_data(request)
    fbas_file = write_temp_json(nodes_data)

    try:
        result = run_python_fbas([
            '--fbas', fbas_file,
            'min-splitting-set'
        ])

        # python-fbas may exit non-zero when a split is detected, so the exit
        # code is not checked here; the output is authoritative.
        output = result.stdout + result.stderr

        # "No splitting set found" is a real answer, and it is NOT zero -- zero
        # would mean no organizations at all are needed to break safety. The
        # previous parser could not tell the two apart, which is how Radar came
        # to display a safety threshold of 0 countries.
        if 'No splitting set found' in output:
            raise UnrecognizedOutput(
                'min-splitting-set',
                'a splitting set; python-fbas found none, which is not the same '
                'as a threshold of zero',
                output)

        min_size = parse_cardinality(
            'min-splitting-set', output,
            'Minimal splitting-set cardinality is:')
        example_set = parse_validator_list(
            'min-splitting-set', output, 'Example:')
        has_split = 'splits quorums' in output

        execution_time = int((time.time() - start_time) * 1000)

        return SplittingSetsResponse(
            min_size=min_size,
            total_sets=1,
            example_set=example_set,
            has_split=has_split,
            execution_time_ms=execution_time
        )

    finally:
        os.unlink(fbas_file)


@app.post("/analyze/quorums", response_model=QuorumsResponse)
async def analyze_quorums(request: AnalysisRequest):
    """Analyze minimal quorums and check intersection"""
    logger.info(f"Quorum analysis requested for {len(request.nodes)} nodes")
    start_time = time.time()

    nodes_data = prepare_fbas_data(request)
    fbas_file = write_temp_json(nodes_data)

    try:
        # First check intersection
        check_result = run_python_fbas([
            '--fbas', fbas_file,
            'check-intersection'
        ])

        require_success('check-intersection', check_result)

        # This decides whether Radar reports the network as safe or as able to
        # fork, so it must never be inferred from a missing substring. Both
        # outcomes are matched explicitly and anything else is an error.
        if 'No disjoint quorums found' in check_result.stdout:
            has_intersection = True
        elif 'Disjoint quorums:' in check_result.stdout:
            has_intersection = False
        else:
            raise UnrecognizedOutput(
                'check-intersection',
                "either 'No disjoint quorums found' or 'Disjoint quorums:'",
                check_result.stdout)

        # Then find minimal quorum
        quorum_result = run_python_fbas([
            '--fbas', fbas_file,
            'min-quorum'
        ])

        require_success('min-quorum', quorum_result)

        # Both labels are accepted because the default mode changed: min-quorum
        # used to always print "Example min quorum:", and now prints
        # "Example min-cardinality quorum:" unless --mode minimal is passed.
        example_quorum = parse_validator_list(
            'min-quorum', quorum_result.stdout,
            'Example min-cardinality quorum:', 'Example min quorum:')

        execution_time = int((time.time() - start_time) * 1000)

        return QuorumsResponse(
            min_size=len(example_quorum),
            total_quorums=1,
            example_quorum=example_quorum,
            quorum_intersection=has_intersection,
            execution_time_ms=execution_time
        )

    finally:
        os.unlink(fbas_file)


@app.post("/analyze/history-critical", response_model=HistoryCriticalResponse)
async def analyze_history_critical(request: AnalysisRequest):
    """Analyze history-critical sets (validators whose failure causes history loss)"""
    logger.info(f"History-critical analysis requested for {len(request.nodes)} nodes")
    start_time = time.time()

    nodes_data = prepare_fbas_data(request)
    fbas_file = write_temp_json(nodes_data)

    try:
        result = run_python_fbas([
            '--fbas', fbas_file,
            'history-loss'
        ])

        if result.returncode != 0:
            logger.error(f"History-critical analysis failed: {result.stderr}")
            raise HTTPException(status_code=500, detail=result.stderr)

        # Parse output (format varies, this is simplified)
        # TODO: Improve parsing based on actual python-fbas output
        critical_sets = []
        min_size = 0

        execution_time = int((time.time() - start_time) * 1000)

        return HistoryCriticalResponse(
            critical_sets=critical_sets,
            min_size=min_size,
            execution_time_ms=execution_time
        )

    finally:
        os.unlink(fbas_file)


@app.post("/analyze/full", response_model=FullAnalysisResponse)
async def analyze_full(request: AnalysisRequest):
    """Run all analyses in one request (more efficient)"""
    logger.info(f"Full analysis requested for {len(request.nodes)} nodes")
    start_time = time.time()

    # Run all analyses
    top_tier = await analyze_top_tier(request)
    blocking_sets = await analyze_blocking_sets(request)
    splitting_sets = await analyze_splitting_sets(request)
    quorums = await analyze_quorums(request)

    total_time = int((time.time() - start_time) * 1000)

    return FullAnalysisResponse(
        top_tier=top_tier,
        blocking_sets=blocking_sets,
        splitting_sets=splitting_sets,
        quorums=quorums,
        total_execution_time_ms=total_time
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
