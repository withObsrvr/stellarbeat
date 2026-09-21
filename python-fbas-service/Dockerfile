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
# pyqbf: the withObsrvr fork of python-fbas declares its qbf extra as a private
# GitLab URL that requires auth, so we install pyqbf from PyPI first, then
# python-fbas with --no-deps, then its transitive deps by hand. Upstream has
# since replaced that URL with `pyqbf==1.1.1.1` from PyPI, so syncing the fork
# would let this entire workaround collapse back to a plain install.
#
# The fork is pinned to a commit rather than @main: an unpinned branch means
# two builds of the same image tag can contain different analysis code.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir --no-deps \
    git+https://github.com/withObsrvr/python-fbas.git@bb26cdbc54e52b1a9000b2b794e6a113241604b3#egg=python-fbas
# python-sat 1.8.dev13 is pinned by python-fbas itself but is NOT on PyPI --
# the index goes 1.8.dev12 -> 1.8.dev14. This image builds today only because
# it was built while that release still existed; any rebuild failed until this
# pin moved to the next published version.
RUN pip install --no-cache-dir networkx==3.3 platformdirs==4.3.6 \
    py-aiger==6.2.3 py-aiger-cnf==5.0.8 pyapproxmc==4.1.24 \
    pycryptosat==5.11.21 python-sat==1.8.dev14 requests==2.32.3 \
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
