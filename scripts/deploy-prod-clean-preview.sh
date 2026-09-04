#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="casadooleiro-35c4e"
APP_ID="1:391973666005:web:5ab4e4a406b591cccc765c"
CHANNEL_ID="prod-clean-ui-final"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/release-dist"
TMP_CONFIG="$(mktemp)"

cleanup(){ rm -f "$TMP_CONFIG"; }
trap cleanup EXIT

cd "$ROOT_DIR"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

for dir in admin portal css js icons; do
  cp -R "$dir" "$OUT_DIR/$dir"
done

for file in index.html manifest.webmanifest .nojekyll; do
  if [[ -e "$file" ]]; then cp "$file" "$OUT_DIR/$file"; fi
done

node scripts/prepare-prod-clean-ui.mjs "$OUT_DIR"

firebase apps:sdkconfig WEB "$APP_ID" \
  --project "$PROJECT_ID" \
  -o "$TMP_CONFIG"

node - "$TMP_CONFIG" "$OUT_DIR/js/firebase/firebase-config.js" <<'NODE'
const fs=require('fs');
const [source,target]=process.argv.slice(2);
const config=JSON.parse(fs.readFileSync(source,'utf8'));
fs.writeFileSync(target,`window.OLEIRO_FIREBASE_CONFIG = ${JSON.stringify(config)};\n`,'utf8');
NODE

BUILD_STAMP="$(date -u +%Y%m%d%H%M%S)"
node - "$OUT_DIR" "$BUILD_STAMP" <<'NODE'
const fs=require('fs');
const path=require('path');
const [root,stamp]=process.argv.slice(2);
const htmlFiles=['index.html','admin/index.html','portal/index.html'];
for(const relative of htmlFiles){
  const file=path.join(root,relative);
  if(!fs.existsSync(file))continue;
  let text=fs.readFileSync(file,'utf8');
  text=text.replace(/((?:src|href)="(?:\.\.\/)?(?:js|css)\/[^"?]+)(?:\?[^\"]*)?(\")/g,`$1?v=${stamp}$2`);
  fs.writeFileSync(file,text,'utf8');
}
fs.writeFileSync(path.join(root,'release.json'),JSON.stringify({
  version:`preview-${stamp}`,
  build:stamp,
  channel:'prod-clean-ui-final',
  publishedAt:new Date().toISOString()
})+'\n','utf8');
NODE

find "$OUT_DIR/js" -type f -name '*.js' -print0 | xargs -0 -n1 node --check

firebase hosting:channel:deploy "$CHANNEL_ID" \
  --config firebase.release-preview.json \
  --project "$PROJECT_ID"
