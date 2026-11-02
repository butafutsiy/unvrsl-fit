'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('ready shell uses one document scroller, not a separate body scroller', () => {
  const css = read('ui-stability.js');
  assert.match(css, /html\.\$\{READY\}\{[^}]*overflow-y:auto!important/);
  assert.match(css, /body\.\$\{READY\}\{[^}]*overflow-x:clip!important;overflow-y:visible!important/);
});

test('client workouts do not create an implicit second scroller', () => {
  const css = read('client-workout-scroll.js');
  assert.match(css, /body\.\$\{ROOT_CLASS\}\{[^}]*overflow-x:clip!important;overflow-y:visible!important/);
  assert.doesNotMatch(css, /body\.\$\{ROOT_CLASS\}\{[^}]*overflow-x:hidden!important;overflow-y:visible!important/);
});

test('PWA loads matching updated modules for release v587', () => {
  const html = read('index.html');
  assert.match(html, /ui-stability\.js\?v=587/g);
  assert.doesNotMatch(html, /ui-stability\.js\?v=561/);
  assert.match(html, /frequent-patch\.js\?v=587/);
  assert.match(read('frequent-patch.js'), /client-workout-scroll\.js\?v=587/);
  assert.match(read('sw.js'), /SW_RELEASE = "v587"/);
});
