#!/usr/bin/env bash
set -euo pipefail

pass=0
fail=0
warn=0

ok()   { pass=$((pass + 1)); printf "  \033[32m✓\033[0m %s\n" "$1"; }
fail() { fail=$((fail + 1)); printf "  \033[31m✗\033[0m %s\n" "$1"; }
warn() { warn=$((warn + 1)); printf "  \033[33m?\033[0m %s\n" "$1"; }

check_cmd() {
  local cmd="$1" label="$2" version_cmd="${3:---version}"
  if command -v "$cmd" &>/dev/null; then
    local version
    version=$("$cmd" $version_cmd 2>&1 | head -1) || version="(version unknown)"
    ok "$label — $version"
  else
    fail "$label — \`$cmd\` not found"
  fi
}

echo ""
echo "harness"
echo "-------"
check_cmd node "Node.js"
check_cmd npm "npm"
check_cmd claude "Claude Code"

if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  ok "ANTHROPIC_API_KEY is set"
else
  fail "ANTHROPIC_API_KEY is not set"
fi

echo ""
echo "languages"
echo "---------"

# TypeScript & JavaScript share node/npm (already checked above)
check_cmd npx "TypeScript / JavaScript (npx)"

check_cmd python3 "Python"
if python3 -m venv --help &>/dev/null; then
  ok "Python — venv module"
else
  fail "Python — venv module not available (apt install python3-venv on Debian/Ubuntu)"
fi

check_cmd ruby "Ruby"
check_cmd bundle "Ruby — Bundler"

check_cmd cargo "Rust"
check_cmd go "Go" "version"
check_cmd stack "Haskell"

check_cmd java "Java (JDK)" "-version"
check_cmd javac "Java — javac (confirms full JDK)" "-version"

echo ""
echo "---"
printf "%d passed, %d failed, %d warnings\n" "$pass" "$fail" "$warn"

if [ "$fail" -gt 0 ]; then
  echo ""
  echo "some prerequisites are missing. you can still run benchmarks for"
  echo "languages whose prerequisites are met — use --language to filter."
  exit 1
fi
