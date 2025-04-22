{ pkgs ? import <nixpkgs> {} }:

let
  nodejs = pkgs.nodejs_20;
  # Pin pnpm to version 9.15.0
  pnpm = (pkgs.nodePackages.pnpm.override { nodejs = nodejs; }).overrideAttrs (old: {
    version = "9.15.0";
    src = pkgs.fetchurl {
      url = "https://registry.npmjs.org/pnpm/-/pnpm-9.15.0.tgz";
      sha256 = "0a7xy0qwixjfs9035yfzvbvcwk1g03s1j1k8aiip1njglcqzxa09";
    };
  });
in

pkgs.mkShell {
  buildInputs = [
    nodejs
    pnpm
    pkgs.postgresql_15
    pkgs.rustc
    pkgs.cargo
    pkgs.wasm-pack
  ];

  shellHook = ''
    # Ensure we're using the correct pnpm version
    export PATH="${pnpm}/bin:$PATH"
    export NODE_OPTIONS="--max_old_space_size=4096"
    export PATH="$PWD/node_modules/.bin:$PATH"
    
    # Create .env files if they don't exist
    if [ ! -f "apps/backend/.env" ]; then
      cp apps/backend/.env.dist apps/backend/.env
    fi

    # Build shared packages first
    cd packages/shared
    pnpm install
    pnpm run build
    pnpm run post-build
    cd ../..
    
    echo "Stellarbeat development environment ready!"
    echo "Using pnpm version: $(pnpm -v)"
    echo "Using Node.js version: $(node -v)"
    echo "Run 'pnpm install' to install dependencies"
  '';
} 