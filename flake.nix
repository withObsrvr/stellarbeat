{
  description = "Stellarbeat development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        nodejs = pkgs.nodejs_20;
        # Pin pnpm to version 9.15.0
        pnpm = (pkgs.nodePackages.pnpm.override { nodejs = nodejs; }).overrideAttrs (old: {
          version = "9.15.0";
          src = pkgs.fetchurl {
            url = "https://registry.npmjs.org/pnpm/-/pnpm-9.15.0.tgz";
            hash = "sha256-9vJqB3ZvY7ZvY7ZvY7ZvY7ZvY7ZvY7ZvY7ZvY7ZvY7ZvY=";
          };
        });
      in
      {
        devShells.default = pkgs.mkShell {
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
            
            echo "Stellarbeat development environment ready!"
            echo "Using pnpm version: $(pnpm -v)"
            echo "Using Node.js version: $(node -v)"
            echo "Run 'pnpm install' to install dependencies"
          '';
        };

        packages.default = pkgs.stdenv.mkDerivation {
          name = "stellarbeat";
          src = ./.;

          buildInputs = [
            nodejs
            pnpm
          ];

          buildPhase = ''
            export HOME=$TMPDIR
            export PATH="${pnpm}/bin:$PATH"
            pnpm install --frozen-lockfile
            pnpm build
          '';

          installPhase = ''
            mkdir -p $out
            cp -r . $out/
          '';
        };
      });
} 