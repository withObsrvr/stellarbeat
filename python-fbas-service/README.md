# Python FBAS Analysis Service

FastAPI microservice wrapper around the python-fbas CLI tool for Stellar network FBAS analysis.

## Features

- RESTful API for FBAS analysis
- Supports all python-fbas analysis types:
  - Top tier analysis
  - Minimal blocking sets
  - Minimal splitting sets
  - Minimal quorums + intersection check
  - History-critical sets (NEW!)
- Docker containerized
- Health check endpoint
- Structured JSON responses

## Quick Start

### Using Docker (Recommended)

```bash
# Build image
docker build -t python-fbas-service .

# Run container
docker run -p 8080:8080 python-fbas-service

# Test health endpoint
curl http://localhost:8080/health
```

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run service
python app.py

# Or with uvicorn
uvicorn app:app --reload --port 8080
```

## API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "python_fbas_available": true
}
```

### Top Tier Analysis
```http
POST /analyze/top-tier
Content-Type: application/json

{
  "nodes": [
    {
      "publicKey": "GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH",
      "name": "SDF 1",
      "quorumSet": {
        "threshold": 5,
        "validators": [],
        "innerQuorumSets": [...]
      }
    },
    ...
  ]
}
```

Response:
```json
{
  "top_tier": ["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", ...],
  "top_tier_size": 21,
  "execution_time_ms": 3450,
  "cache_hit": false
}
```

### Minimal Blocking Sets
```http
POST /analyze/blocking-sets
```

Response:
```json
{
  "min_size": 6,
  "total_sets": 1,
  "example_set": ["GA5STBMV6QDXFDGD62MEHLLHZTPDI77U3PFOD2SELU5RJDHQWBR5NNK7", ...],
  "execution_time_ms": 4200
}
```

### Minimal Splitting Sets
```http
POST /analyze/splitting-sets
```

Response:
```json
{
  "min_size": 3,
  "total_sets": 1,
  "example_set": ["GA5STBMV6QDXFDGD62MEHLLHZTPDI77U3PFOD2SELU5RJDHQWBR5NNK7", ...],
  "has_split": false,
  "execution_time_ms": 4100
}
```

### Minimal Quorums
```http
POST /analyze/quorums
```

Response:
```json
{
  "min_size": 12,
  "total_quorums": 1,
  "example_quorum": ["GA5STBMV6QDXFDGD62MEHLLHZTPDI77U3PFOD2SELU5RJDHQWBR5NNK7", ...],
  "quorum_intersection": true,
  "execution_time_ms": 5300
}
```

### History-Critical Sets
```http
POST /analyze/history-critical
```

Response:
```json
{
  "critical_sets": [["GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH", ...]],
  "min_size": 3,
  "execution_time_ms": 4800
}
```

### Full Analysis
```http
POST /analyze/full
```

Runs all analyses in one request (more efficient). Returns:
```json
{
  "top_tier": {...},
  "blocking_sets": {...},
  "splitting_sets": {...},
  "quorums": {...},
  "total_execution_time_ms": 18500
}
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  python-fbas:
    build: ./python-fbas-service
    ports:
      - "8080:8080"
    environment:
      - LOG_LEVEL=INFO
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    restart: unless-stopped
```

## Performance

Typical analysis times on 301-node Stellar network:
- Top tier: ~3-4s
- Blocking sets: ~4-5s
- Splitting sets: ~4-5s
- Quorums: ~3-4s
- Full analysis: ~15-20s

## Error Handling

Service returns standard HTTP error codes:
- `200 OK` - Success
- `400 Bad Request` - Invalid input
- `500 Internal Server Error` - Analysis failed
- `503 Service Unavailable` - python-fbas not available
- `504 Gateway Timeout` - Analysis timeout (>60s)

## Environment Variables

- `PORT` - Service port (default: 8080)
- `LOG_LEVEL` - Logging level (default: INFO)
- `ANALYSIS_TIMEOUT` - Max analysis time in seconds (default: 60)

## Integration with Backend

See `docs/python-fbas-integration-architecture.md` for TypeScript client implementation and integration guide.

## Development

Run tests (TODO):
```bash
pytest tests/
```

Format code:
```bash
black app.py
```

Lint:
```bash
pylint app.py
```

## Troubleshooting

**Service not starting:**
- Check python-fbas is installed: `python-fbas --help`
- Check port 8080 is available: `lsof -i :8080`

**Analysis timing out:**
- Increase timeout in environment variables
- Check network size (1000+ nodes may be slow)

**Incorrect results:**
- Verify input data format matches specification
- Check logs for warnings about invalid nodes

## License

Same as parent project (Stellarbeat/OBSRVR Radar)

## Support

For issues, see main project issue tracker or contact dev team.
