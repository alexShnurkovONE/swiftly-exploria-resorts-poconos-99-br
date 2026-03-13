#!/bin/bash
# Recomputes content-hash versions for style.css and script.js and updates index.html.
# Run this before deploying whenever you change CSS or JS.

CSS_HASH=$(shasum -a 256 style.css | cut -c1-8)
JS_HASH=$(shasum -a 256 script.js | cut -c1-8)

sed -i '' "s|style\.css?v=[a-f0-9]*|style.css?v=${CSS_HASH}|g" index.html
sed -i '' "s|script\.js?v=[a-f0-9]*|script.js?v=${JS_HASH}|g" index.html

echo "style.css  → ?v=${CSS_HASH}"
echo "script.js  → ?v=${JS_HASH}"
