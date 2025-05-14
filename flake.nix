{
  description = "Radar development environment";

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
            sha256 = "0a7xy0qwixjfs9035yfzvbvcwk1g03s1j1k8aiip1njglcqzxa09";
          };
        });

        # Docker image for users service
        usersDockerImage = pkgs.dockerTools.buildImage {
          name = "radar-users";
          tag = "latest";
          config = {
            Cmd = [ "node" "apps/users/lib/index.js" ];
            WorkingDir = "/app";
            Env = [
              "NODE_ENV=production"
              "PORT=3000"
            ];
            ExposedPorts = {
              "3000/tcp" = {};
            };
          };
        };
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
            
            # Set up environment files
            if [ ! -f "apps/backend/.env" ]; then
              cp apps/backend/.env apps/backend/.env
            fi
            if [ ! -f "apps/frontend/.env" ]; then
              cp apps/frontend/.env apps/frontend/.env
            fi
            if [ ! -f "apps/users/.env" ]; then
              cp apps/users/.env apps/users/.env
            fi

            # Load environment variables
            set -a
            source apps/backend/.env
            source apps/frontend/.env
            source apps/users/.env
            set +a

            # Build shared packages first
            cd packages/shared
            pnpm install
            pnpm run build
            pnpm run post-build
            cd ../..
            
            # Set custom prompt
            export PS1="\[\033[1;32m\][nix:radar]\[\033[0m\] \[\033[1;34m\]\w\[\033[0m\] \[\033[1;36m\]\$\[\033[0m\] "
            
            echo "Radar development environment ready!"
            echo "Using pnpm version: $(pnpm -v)"
            echo "Using Node.js version: $(node -v)"
            echo "Environment variables loaded from .env files"
            echo "Run 'pnpm install' to install dependencies"
          '';
        };

        packages.default = pkgs.stdenv.mkDerivation {
          name = "radar";
          src = ./.;

          buildInputs = [
            nodejs
            pnpm
          ];

          buildPhase = ''
            export HOME=$TMPDIR
            export PATH="${pnpm}/bin:$PATH"
            
            # Install dependencies
            pnpm install --frozen-lockfile
            
            # Build shared packages first
            cd packages/shared
            pnpm run build
            pnpm run post-build
            cd ../..
            
            # Build the rest of the project
            pnpm build
          '';

          installPhase = ''
            mkdir -p $out
            cp -r . $out/
          '';
        };

        # Add Docker images to packages
        packages.users-docker = usersDockerImage;
      });
} 