#!/usr/bin/env bash
# Build the deployable Codeopolis site into _site/.
#
# Runs identically locally and in CI, so a broken deploy can always be
# reproduced with: ./scripts/build-site.sh && python3 -m http.server -d _site 8000
set -euo pipefail

OUT="${1:-_site}"
VERSION="${SITE_VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo dev)}"

rm -rf "$OUT"
mkdir -p "$OUT"

# Ship the runtime site only. Repo-tooling directories never reach the CDN.
rsync -a \
  --exclude '.git' \
  --exclude '.github' \
  --exclude 'node_modules' \
  --exclude 'tests' \
  --exclude 'scripts' \
  --exclude "$OUT" \
  ./ "$OUT/"

# Pages runs Jekyll over the artifact unless told not to.
touch "$OUT/.nojekyll"

# The service worker is cache-first for same-origin requests, so a deploy only
# reaches returning players if CACHE changes. Stamp it with the commit.
node -e '
const fs = require("fs");
const path = process.argv[1];
const version = process.argv[2];
const before = fs.readFileSync(path, "utf8");
const after = before.replace(/const CACHE=.[^"\x27]*./, `const CACHE=\x27codeopolis-${version}\x27`);
if (after === before) {
  console.error("sw.js CACHE constant not found - cache busting would silently break");
  process.exit(1);
}
fs.writeFileSync(path, after);
' "$OUT/sw.js" "$VERSION"

cat > "$OUT/build-info.json" <<JSON
{
  "version": "$VERSION",
  "builtAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "ref": "${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo local)}"
}
JSON

echo "Built $OUT (version $VERSION, $(find "$OUT" -type f | wc -l) files)"
grep -o "const CACHE='[^']*'" "$OUT/sw.js"
