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
# pyqbf: upstream python-fbas pins a private GitLab URL that requires auth.
# We install pyqbf from PyPI first, then python-fbas without its own deps,
# then the remaining transitive deps separately.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir --no-deps git+https://github.com/withObsrvr/python-fbas.git@main#egg=python-fbas
RUN pip install --no-cache-dir networkx==3.3 platformdirs==4.3.6 \
    py-aiger==6.2.3 py-aiger-cnf==5.0.8 pyapproxmc==4.1.24 \
    pycryptosat==5.11.21 python-sat==1.8.dev13 requests==2.32.3 \
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
