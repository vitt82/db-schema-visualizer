#!/usr/bin/env bash
# scripts/package-and-install.sh
# Build, package and install the prisma and dbml VS Code extensions non-interactively.
# Usage: ./scripts/package-and-install.sh [prisma|dbml|all]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PACKAGE=${1:-all}

# Ensure non-interactive environment for vsce
export CI=true

# Create a minimal LICENSE file if missing (vsce warns and prompts in some cases)
if [ ! -f LICENSE ] && [ ! -f LICENSE.md ] && [ ! -f LICENSE.txt ]; then
  cat > LICENSE <<'EOF'
MIT License

Copyright (c) $(date +%Y) .

Permission is hereby granted, free of charge, to any person obtaining a copy
EOF
  echo "Created temporary LICENSE to avoid vsce prompt"
  CLEAN_LICENSE=true
else
  CLEAN_LICENSE=false
fi

package_and_install() {
  PKG_DIR="$1"
  echo "Packaging extension in $PKG_DIR"
  npm run --prefix "$PKG_DIR" build || npm run --prefix "$PKG_DIR" build:prisma || true
  npm run --prefix "$PKG_DIR" create:package
  VSIX=$(ls "$PKG_DIR"/*.vsix | tail -n1)
  if [ -z "$VSIX" ]; then
    echo "No .vsix found in $PKG_DIR"
    exit 1
  fi
  echo "Installing $VSIX"
  code --install-extension "$VSIX" --force
}

case "$PACKAGE" in
  prisma)
    package_and_install "packages/prisma-vs-code-extension"
    ;;
  dbml)
    package_and_install "packages/dbml-vs-code-extension"
    ;;
  all)
    package_and_install "packages/prisma-vs-code-extension"
    package_and_install "packages/dbml-vs-code-extension"
    ;;
  *)
    echo "Unknown package: $PACKAGE"
    exit 2
    ;;
esac

if [ "$CLEAN_LICENSE" = "true" ]; then
  rm -f LICENSE
  echo "Removed temporary LICENSE"
fi

echo "Done."
