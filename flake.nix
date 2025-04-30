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
            sha256 = "0a7xy0qwixjfs9035yfzvbvcwk1g03s1j1k8aiip1njglcqzxa09";
          };
        });

        # Docker image for users service
        usersDockerImage = pkgs.dockerTools.buildImage {
          name = "stellarbeat-users";
          tag = "latest";
          config = {
            Cmd = [ "node" "apps/users/lib/index.js" ];
            WorkingDir = "/app";
            Env = [
              "NODE_ENV=production"
              "PORT=7000"
            ];
            ExposedPorts = {
              "7000/tcp" = {};
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

            # Load environment variables
            set -a
            source apps/backend/.env
            source apps/frontend/.env
            set +a

            # Build shared packages first
            cd packages/shared
            pnpm install
            pnpm run build
            pnpm run post-build
            cd ../..
            
            # Set custom prompt
            export PS1="\[\033[1;32m\][nix:stellarbeat]\[\033[0m\] \[\033[1;34m\]\w\[\033[0m\] \[\033[1;36m\]\$\[\033[0m\] "
            
            echo "Stellarbeat development environment ready!"
            echo "Using pnpm version: $(pnpm -v)"
            echo "Using Node.js version: $(node -v)"
            echo "Environment variables loaded from .env files"
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