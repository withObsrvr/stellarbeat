{ pkgs ? import <nixpkgs> {} }:

let
  nodejs = pkgs.nodejs_20;
  pnpm = pkgs.nodePackages.pnpm.override { nodejs = nodejs; };
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
    export NODE_OPTIONS="--max_old_space_size=4096"
    export PATH="$PWD/node_modules/.bin:$PATH"
    
    # Create .env files if they don't exist
    if [ ! -f "apps/backend/.env" ]; then
      cp apps/backend/.env.dist apps/backend/.env
    fi
    
    echo "Stellarbeat development environment ready!"
    echo "Run 'pnpm install' to install dependencies"
  '';
} 