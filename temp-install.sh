#!/usr/bin/env bash
# Temporary script to install @tailwindcss/postcss package using nix
cd /home/tmosleyiii/projects/obsrvr/stellarbeat
nix develop --command pnpm add -D @tailwindcss/postcss --filter frontend