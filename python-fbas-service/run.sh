#!/usr/bin/env bash
# Wrapper script to run Python FBAS service with proper library paths

# Export library path for native extensions
if [ -n "$NIX_CC_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu" ]; then
    # Running in Nix - set library paths
    export LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:$(dirname $(dirname $(which gcc)))/lib"
fi

# Run the Python service
exec python app.py "$@"
