#!/bin/sh
# Builds the site and publishes it to the gh-pages branch (GitHub Pages).
# Relative asset paths keep it working on github.io/luma-tape/ and on a custom domain.
set -eu
cd "$(dirname "$0")/.."
REMOTE="${LUMA_TAPE_REMOTE:-https://github.com/Cynthiawongss/luma-tape.git}"
NODE_BIN="${NODE_BIN:-node}"

"$NODE_BIN" --test tests/*.test.mjs
LUMA_TAPE_BASE=./ "$NODE_BIN" node_modules/vite/bin/vite.js build

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT
cp -R dist/. "$OUT/"
touch "$OUT/.nojekyll"
cd "$OUT"
git init -q -b gh-pages
git add -A
git -c user.name="${GIT_AUTHOR_NAME:-Luma Tape deploy}" -c user.email="${GIT_AUTHOR_EMAIL:-212732289+Cynthiawongss@users.noreply.github.com}" \
  commit -q -m "Publish $(git -C "$OLDPWD" rev-parse --short HEAD)"
git push -q -f "$REMOTE" gh-pages
echo "Published. GitHub Pages usually updates within a minute or two."
