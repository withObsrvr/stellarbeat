FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for python-fbas
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    cmake \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
#
# The --no-deps dance below is required for exactly one reason: python-fbas
# pins python-sat==1.8.dev13, which is not on PyPI (the index goes 1.8.dev12 ->
# 1.8.dev14). A plain `pip install python-fbas[qbf]` therefore cannot resolve.
# Once that pin moves upstream, everything here collapses to one line.
#
# The private-GitLab pyqbf URL that used to justify this is gone: the fork is
# now synced with upstream, which declares `pyqbf==1.1.1.1` from PyPI. We still
# install pyqbf from requirements.txt because --no-deps skips extras.
#
# The fork is pinned to a commit rather than @main: an unpinned branch means
# two builds of the same image tag can contain different analysis code.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir --no-deps \
    git+https://github.com/withObsrvr/python-fbas.git@f5e51c4b95128a10b1393ccd05fb9906d92ea2f1#egg=python-fbas
# python-fbas pins python-sat itself, but that pin was 1.8.dev13, which has
# been DELETED from PyPI -- zero files remain, and the index goes 1.8.dev12 ->
# 1.8.dev14. The 0.1.0 image only built because it predates that removal.
#
# We install python-sat explicitly here because --no-deps above skips
# python-fbas's own dependencies. 1.9.dev15 is the current PyPI release and
# ships a cp311 manylinux wheel, so it avoids compiling from sdist. It matches
# the pin now carried in python-fbas's pyproject.toml, whose test suite passes
# green against it. Keep the two in step.
RUN pip install --no-cache-dir networkx==3.3 platformdirs==4.3.6 \
    py-aiger==6.2.3 py-aiger-cnf==5.0.8 pyapproxmc==4.1.24 \
    pycryptosat==5.11.21 python-sat==1.9.dev15 requests==2.32.3 \
    z3-solver==4.13.3.0 matplotlib==3.9.2

# Copy application code
COPY app.py .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
