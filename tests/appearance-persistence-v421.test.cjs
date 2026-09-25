const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function appearance(storage, owner = 'user-a') {
  const app = read('app.js');
  const definitions = ['savedAppearance', 'restoreAppearance', 'rememberAppearance']
    .map(name => app.split('\n').find(line => line.startsWith(`function ${name}(`))).join('\n');
  const ctx = {
    localStorage: storage,
    window: {cloud: {user: {id: owner}}},
    st: {accountOwnerId: owner, theme: 'dark', accent: '#30d158'},
    COLORS: ['#30d158', '#bf5af2', '#0a84ff'],
    applyAccent() {}, applyTheme() {}, console,
  };
  vm.createContext(ctx);
  vm.runInContext("const APPEARANCE_KEY='unvrsl-appearance-v1';\n" + definitions, ctx);
  return ctx;
}

test('a selected theme and accent survive sign out, reload and cloud reconciliation', () => {
  const values = new Map();
  const storage = {getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v)};
  const current = appearance(storage);
  current.st.theme = 'light';
  current.st.accent = '#bf5af2';
  vm.runInContext('rememberAppearance()', current);
  current.window.cloud.user = null;
  current.st = {accountOwnerId: 'user-a', theme: 'dark', accent: '#30d158'};
  vm.runInContext("restoreAppearance('user-a')", current);
  assert.equal(current.st.theme, 'light');
  assert.equal(current.st.accent, '#bf5af2');
  const reopened = appearance(storage);
  vm.runInContext("restoreAppearance('user-a')", reopened);
  assert.equal(reopened.st.theme, 'light');
  assert.equal(reopened.st.accent, '#bf5af2');
});

test('appearance is keyed by person and invalid stored accents cannot change the UI', () => {
  const values = new Map();
  const storage = {getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v)};
  const first = appearance(storage);
  first.st.theme = 'light'; first.st.accent = '#bf5af2';
  vm.runInContext('rememberAppearance()', first);
  const other = appearance(storage, 'user-b');
  vm.runInContext("restoreAppearance('user-b')", other);
  assert.equal(other.st.theme, 'dark');
  assert.equal(other.st.accent, '#30d158');
  values.set('unvrsl-appearance-v1', JSON.stringify({'user-b': {theme: 'light', accent: 'red'}}));
  vm.runInContext("restoreAppearance('user-b')", other);
  assert.equal(other.st.theme, 'light');
  assert.equal(other.st.accent, '#30d158');
});

test('account refresh reapplies preferences and light workout detail cards have readable values', () => {
  assert.match(read('account-sync.js'), /st=merged;restoreAppearance\(user\.id\)/);
  assert.match(read('storage-resilience.js'), /restoreAppearance\(st\.accountOwnerId\)/);
  assert.match(read('cloud.js'), /await window\.accountSyncNow\(\{quiet:true\}\).*await cloud\.client\.auth\.signOut\(\)/);
  const css = read('theme-light.css');
  for (const cls of ['.cj107-metric', '.cj107-metric b', '.cj107-metric span', '.tcv3-session-metric'])
    assert.ok(css.includes(cls), cls);
  assert.match(css, /body #modal \.cj107-metric,[\s\S]*?background:#f4f5f8!important;color:#19191d!important/);
});
