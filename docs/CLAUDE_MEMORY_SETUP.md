# Setting Up Claude Code Memory for Project-Specific Requirements

This document explains how to ensure Claude Code remembers your project-specific requirements across sessions.

## The CLAUDE.md Approach (Recommended)

Claude Code automatically looks for and reads a `CLAUDE.md` file in your project root. This is the best way to provide persistent context.

### Step 1: Create CLAUDE.md

Create a file named `CLAUDE.md` in your project root:

```bash
touch CLAUDE.md
```

### Step 2: Add Your Project Requirements

Edit the file to include your specific requirements:

```markdown
# Project Context for Claude Code

## Build Requirements
- **CRITICAL**: All builds and npm commands must be run inside nix development environment
- Never run `npm run build`, `npm test`, or any npm commands directly
- Always use: `nix develop` first, then run npm commands inside the nix shell

## Development Environment
- Project uses Nix for dependency management
- TypeScript compilation requires nix environment
- Database migrations require nix environment

## Common Commands
```bash
# Correct way to build
nix develop
npm run build

# Correct way to run tests
nix develop
npm test

# Correct way to run type checking
nix develop
npm run typecheck
```

## Project Structure Notes
- Backend: apps/backend/
- Shared packages: packages/shared/
- Trust metrics: apps/backend/src/network-scan/domain/trust/
- Database migrations: apps/backend/src/core/infrastructure/database/migrations/

## Testing
- Jest tests must be run in nix environment
- Database tests require nix environment for TypeORM
```

### Step 3: Verify Claude Reads It

After creating the file, you can ask Claude to confirm it can see your requirements:
- "What are the build requirements for this project?"
- "How should I run tests?"

## Alternative Approaches

### Option 1: Package.json Scripts with Warnings

Modify your `package.json` to include warnings:

```json
{
  "scripts": {
    "build": "echo '⚠️  Run this command inside nix develop!' && npm run build:actual",
    "build:actual": "tsc",
    "build:nix": "nix develop -c npm run build:actual"
  }
}
```

### Option 2: Shell Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Project-specific aliases
alias npm-stellarbeat="nix develop -c npm"
alias build-stellarbeat="nix develop -c npm run build"
```

### Option 3: direnv Setup

If you use direnv, create a `.envrc` file:

```bash
# .envrc
use nix
```

Then run:
```bash
direnv allow
```

This automatically enters the nix environment when you cd into the project directory.

### Option 4: Pre-commit Hook

Create a pre-commit hook that checks for nix:

```bash
# .git/hooks/pre-commit
#!/bin/bash
if [ -z "$IN_NIX_SHELL" ]; then
    echo "Error: Not in nix shell. Run 'nix develop' first."
    exit 1
fi
```

## Best Practices

1. **Always use CLAUDE.md** - This is the most reliable way to provide context
2. **Keep it updated** - Add new requirements as they come up
3. **Be specific** - Include exact commands and common pitfalls
4. **Test it** - Verify Claude can see and understand your requirements

## Example CLAUDE.md Template

```markdown
# Project Context for Claude Code

## Environment Requirements
- [Your specific environment needs]

## Build Process
- [Your build steps]

## Testing
- [Your test requirements]

## Common Pitfalls
- [Things to avoid]

## Useful Commands
- [Project-specific commands]
```

## Troubleshooting

If Claude still forgets your requirements:
1. Check that CLAUDE.md is in the project root
2. Verify the file is not empty
3. Ask Claude directly: "What does my CLAUDE.md file say?"
4. Consider adding more specific details to the file