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

        # PostgreSQL setup script
        setupPostgres = pkgs.writeShellScriptBin "setup-postgres" ''
          #!/bin/bash
          
          # Create directories for PostgreSQL data
          mkdir -p .nix-postgres/{dev,test}
          
          # Initialize dev database if not exists
          if [ ! -d ".nix-postgres/dev/data" ]; then
            echo "🔧 Initializing PostgreSQL dev database..."
            ${pkgs.postgresql_15}/bin/initdb -D .nix-postgres/dev/data --auth=trust --no-locale --encoding=UTF8
          fi
          
          # Initialize test database if not exists
          if [ ! -d ".nix-postgres/test/data" ]; then
            echo "🔧 Initializing PostgreSQL test database..."
            ${pkgs.postgresql_15}/bin/initdb -D .nix-postgres/test/data --auth=trust --no-locale --encoding=UTF8
          fi
          
          # Start dev PostgreSQL (port 25432)
          if ! ${pkgs.postgresql_15}/bin/pg_ctl status -D .nix-postgres/dev/data >/dev/null 2>&1; then
            echo "🚀 Starting PostgreSQL dev server on port 25432..."
            ${pkgs.postgresql_15}/bin/pg_ctl -D .nix-postgres/dev/data -l .nix-postgres/dev/logfile start -o "-p 25432 -k $PWD/.nix-postgres/dev"
            sleep 2
            
            # Create databases and user
            ${pkgs.postgresql_15}/bin/createdb -h localhost -p 25432 stellarbeat 2>/dev/null || true
            ${pkgs.postgresql_15}/bin/createdb -h localhost -p 25432 stellarbeat_users 2>/dev/null || true
            ${pkgs.postgresql_15}/bin/psql -h localhost -p 25432 -d postgres -c "CREATE USER \"user\" WITH PASSWORD 'password';" 2>/dev/null || true
            ${pkgs.postgresql_15}/bin/psql -h localhost -p 25432 -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE stellarbeat TO \"user\";" 2>/dev/null || true
            ${pkgs.postgresql_15}/bin/psql -h localhost -p 25432 -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE stellarbeat_users TO \"user\";" 2>/dev/null || true
          fi
          
          # Start test PostgreSQL (port 25433)
          if ! ${pkgs.postgresql_15}/bin/pg_ctl status -D .nix-postgres/test/data >/dev/null 2>&1; then
            echo "🚀 Starting PostgreSQL test server on port 25433..."
            ${pkgs.postgresql_15}/bin/pg_ctl -D .nix-postgres/test/data -l .nix-postgres/test/logfile start -o "-p 25433 -k $PWD/.nix-postgres/test"
            sleep 2
            
            # Create test database and user
            ${pkgs.postgresql_15}/bin/createdb -h localhost -p 25433 stellarbeat_test 2>/dev/null || true
            ${pkgs.postgresql_15}/bin/psql -h localhost -p 25433 -d postgres -c "CREATE USER \"user\" WITH PASSWORD 'password';" 2>/dev/null || true
            ${pkgs.postgresql_15}/bin/psql -h localhost -p 25433 -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE stellarbeat_test TO \"user\";" 2>/dev/null || true
          fi
          
          echo "✅ PostgreSQL databases are ready!"
          echo "   Dev:  postgresql://user:password@localhost:25432/stellarbeat"
          echo "   Dev:  postgresql://user:password@localhost:25432/stellarbeat_users"
          echo "   Test: postgresql://user:password@localhost:25433/stellarbeat_test"
        '';

        # PostgreSQL stop script
        stopPostgres = pkgs.writeShellScriptBin "stop-postgres" ''
          #!/bin/bash
          
          echo "🛑 Stopping PostgreSQL servers..."
          
          # Stop dev server
          if ${pkgs.postgresql_15}/bin/pg_ctl status -D .nix-postgres/dev/data >/dev/null 2>&1; then
            ${pkgs.postgresql_15}/bin/pg_ctl -D .nix-postgres/dev/data stop
            echo "   Dev server stopped"
          fi
          
          # Stop test server
          if ${pkgs.postgresql_15}/bin/pg_ctl status -D .nix-postgres/test/data >/dev/null 2>&1; then
            ${pkgs.postgresql_15}/bin/pg_ctl -D .nix-postgres/test/data stop
            echo "   Test server stopped"
          fi
          
          echo "✅ All PostgreSQL servers stopped"
        '';

        # PostgreSQL status script
        statusPostgres = pkgs.writeShellScriptBin "postgres-status" ''
          #!/bin/bash
          
          echo "📊 PostgreSQL Status:"
          
          # Check dev server
          if ${pkgs.postgresql_15}/bin/pg_ctl status -D .nix-postgres/dev/data >/dev/null 2>&1; then
            echo "   Dev (port 25432):  ✅ Running"
          else
            echo "   Dev (port 25432):  ❌ Stopped"
          fi
          
          # Check test server
          if ${pkgs.postgresql_15}/bin/pg_ctl status -D .nix-postgres/test/data >/dev/null 2>&1; then
            echo "   Test (port 25433): ✅ Running"
          else
            echo "   Test (port 25433): ❌ Stopped"
          fi
        '';

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
            # Python for python-fbas-service
            pkgs.python311
            pkgs.python311Packages.pip
            pkgs.python311Packages.virtualenv
            # C++ libraries needed for python-fbas native extensions
            pkgs.stdenv.cc.cc.lib
            pkgs.gcc
            pkgs.zlib
            pkgs.cmake
            pkgs.pkg-config
            # PostgreSQL management scripts
            setupPostgres
            stopPostgres
            statusPostgres
          ];

          shellHook = ''
            # Ensure we're using the correct pnpm version
            export PATH="${pnpm}/bin:$PATH"
            export NODE_OPTIONS="--max_old_space_size=4096"
            export PATH="$PWD/node_modules/.bin:$PATH"

            # Make C++ libraries available for Python native extensions
            export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib}/lib:$LD_LIBRARY_PATH"

            # Make zlib available for CMake builds
            export PKG_CONFIG_PATH="${pkgs.zlib.dev}/lib/pkgconfig:$PKG_CONFIG_PATH"
            export CMAKE_PREFIX_PATH="${pkgs.zlib.dev}:$CMAKE_PREFIX_PATH"
            
            # Set up PostgreSQL environment variables
            export DATABASE_DEV_URL="postgresql://user:password@localhost:25432/stellarbeat"
            export DATABASE_TEST_URL="postgresql://user:password@localhost:25433/stellarbeat_test"
            
            # Add .nix-postgres to .gitignore if not already there
            if [ ! -f .gitignore ] || ! grep -q ".nix-postgres" .gitignore; then
              echo ".nix-postgres/" >> .gitignore
            fi
            
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
            source apps/backend/.env 2>/dev/null || true
            source apps/frontend/.env 2>/dev/null || true
            source apps/users/.env 2>/dev/null || true
            set +a

            # Build shared packages first
            if [ -d "packages/shared" ]; then
              cd packages/shared
              pnpm install
              pnpm run build
              pnpm run post-build
              cd ../..
            fi
            
            # Auto-start PostgreSQL databases
            echo "🔧 Setting up PostgreSQL databases..."
            setup-postgres
            
            # Set custom prompt
            export PS1="\[\033[1;32m\][nix:radar]\[\033[0m\] \[\033[1;34m\]\w\[\033[0m\] \[\033[1;36m\]\$\[\033[0m\] "
            
            echo ""
            echo "🎉 Radar development environment ready!"
            echo "Using pnpm version: $(pnpm -v)"
            echo "Using Node.js version: $(node -v)"
            echo "Using Python version: $(python3 --version 2>&1 | cut -d' ' -f2)"
            echo ""
            echo "📊 Database URLs:"
            echo "   DEV:  $DATABASE_DEV_URL"
            echo "   TEST: $DATABASE_TEST_URL"
            echo ""
            echo "🔧 Available commands:"
            echo "   setup-postgres   - Start PostgreSQL databases"
            echo "   stop-postgres    - Stop PostgreSQL databases"
            echo "   postgres-status  - Check database status"
            echo ""
            echo "💡 Run 'pnpm install' to install dependencies"
            
            # Cleanup function for when shell exits
            cleanup() {
              echo "🧹 Cleaning up PostgreSQL connections..."
              stop-postgres
            }
            trap cleanup EXIT
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
            if [ -d "packages/shared" ]; then
              cd packages/shared
              pnpm run build
              pnpm run post-build
              cd ../..
            fi
            
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
        
        # Add PostgreSQL management scripts as packages
        packages.setup-postgres = setupPostgres;
        packages.stop-postgres = stopPostgres;
        packages.postgres-status = statusPostgres;
      });
}