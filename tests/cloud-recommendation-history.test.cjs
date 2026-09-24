'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const domain = require('../workout-domain.js');

const script = fs.readFileSync(path.join(__dirname, '../training-load-model.js'), 'utf8');
const past = (id, date, weight, reps, ok = true) => ({
  id, date, ended: Date.parse(date + 'T06:00:00Z'),
  ex: [{ n: 'Румынская тяга со штангой', set: [{ w: weight, r: reps, rpe: 8, ok }] }],
});

test('recommendation reloads completed cloud workout, even when local cache lacks it', async () => {
  const listeners = {};
  const current = { id: 'today', userId: 'owner', date: '2026-09-24',
    ex: [{ n: 'Румынская тяга со штангой', programWeightMode: 'prescribed',
      set: [{ w: 135, programW: 135, ok: false, targetRepMin: 4, targetRepMax: 6, targetRpeMin: 8, targetRpeMax: 9 }] }],
  };
  let resolveCloud;
  const query = { select() { return this; }, eq() { return this; }, order() { return this; }, range() {
    return new Promise(resolve => { resolveCloud = resolve; });
  } };
  const context = { console, st: { current, sessions: [past('sep12', '2026-09-12', 115, 12)], exerciseWeightProfiles: {} },
    cloud: { user: { id: 'owner' }, client: { from: () => query } },
    save: () => {}, addEventListener: (name, fn) => { listeners[name] = fn; },
    WorkoutDomain: domain, workoutRegistry: domain.registry([{ id: 'rdl', n: 'Румынская тяга со штангой' }]),
  };
  context.window = context;
  vm.runInNewContext(script, context);
  await Promise.resolve();
  assert.equal(current.ex[0].set[0].recommendation.basis.date, '2026-09-12');
  resolveCloud({ data: [{ external_id: 'sep21', payload: { ...past('sep21', '2026-09-21', 140, 7, 1), userId: 'old-id' } }], error: null });
  await new Promise(resolve => setImmediate(resolve));
  const rec = current.ex[0].set[0].recommendation;
  assert.equal(rec.basis.date, '2026-09-21');
  assert.equal(rec.basis.weight, 140);
  assert.equal(rec.basis.estimatedOneRepMax, 182);
  assert.equal(rec.repRange.lo, 4);
  assert.ok(rec.sessionIds.includes('sep21'));
  // After switching accounts, a stale result must not feed the next account.
  context.cloud.user.id = 'other';
  listeners['unvrsl:workout-set-changed']();
  assert.equal(current.ex[0].set[0].recommendation.basis.date, '2026-09-12');
});
