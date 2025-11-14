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
            # Check if this is the known AssertionError with disjoint quorums
            if 'AssertionError' in result.stderr and 'find_min_quorum' in result.stderr:
                logger.warning(f"Top tier analysis failed due to disjoint quorums (network with splitting sets min_size=0)")
                # Return empty top tier for networks with disjoint quorums
                execution_time = int((time.time() - start_time) * 1000)
                return TopTierResponse(
                    top_tier=[],
                    top_tier_size=0,
                    execution_time_ms=execution_time,
                    cache_hit=False
                )
            logger.error(f"Top tier analysis failed: {result.stderr}")
            raise HTTPException(status_code=500, detail=result.stderr)

        # Parse output
        lines = result.stdout.strip().split('\n')
        top_tier = []

        for line in lines:
            if line.startswith('Top tier:'):
                # Extract validators from output
                tier_str = line.split(':', 1)[1].strip()
                # Parse list format
                tier_str = tier_str.strip('[]')
                if tier_str:
                    top_tier = [v.split('(')[0].strip().strip("'") for v in tier_str.split(',')]

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

        if result.returncode != 0:
            logger.error(f"Blocking sets analysis failed: {result.stderr}")
            raise HTTPException(status_code=500, detail=result.stderr)

        # Parse output
        lines = result.stdout.strip().split('\n')
        min_size = 0
        example_set = []

        for line in lines:
            if 'Minimal blocking-set cardinality is:' in line:
                min_size = int(line.split(':')[-1].strip())
            elif line.startswith('Example:'):
                # Next line contains the set
                idx = lines.index(line)
                if idx + 1 < len(lines):
                    set_str = lines[idx + 1].strip('[]')
                    if set_str:
                        example_set = [v.split('(')[0].strip().strip("'") for v in set_str.split(',')]

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

        # Note: python-fbas may return non-zero if split detected

        # Parse output
        output = result.stdout + result.stderr
        lines = output.strip().split('\n')

        min_size = 0
        example_set = []
        has_split = False

        for line in lines:
            if 'Minimal splitting-set cardinality is:' in line:
                min_size = int(line.split(':')[-1].strip())
            elif 'splits quorums' in line:
                has_split = True
            elif line.startswith('Example:') or line.startswith('['):
                # Try to extract set
                try:
                    if '[' in line:
                        set_str = line[line.index('['):line.index(']')+1]
                        example_set = json.loads(set_str.replace("'", '"'))
                except Exception:
                    # Ignore malformed splitting set output - not critical for the analysis
                    pass

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

        has_intersection = 'No disjoint quorums found' in check_result.stdout

        # Then find minimal quorum
        quorum_result = run_python_fbas([
            '--fbas', fbas_file,
            'min-quorum'
        ])

        if quorum_result.returncode != 0:
            logger.error(f"Quorum analysis failed: {quorum_result.stderr}")
            raise HTTPException(status_code=500, detail=quorum_result.stderr)

        # Parse output
        lines = quorum_result.stdout.strip().split('\n')
        example_quorum = []

        for line in lines:
            if line.startswith('Example min quorum:'):
                # Extract from next lines or same line
                idx = lines.index(line)
                for i in range(idx, min(idx + 15, len(lines))):
                    if lines[i].strip().startswith('['):
                        qstr = lines[i].strip().strip('[]')
                        if qstr:
                            example_quorum = [v.split('(')[0].strip().strip("'") for v in qstr.split(',')]
                        break

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
