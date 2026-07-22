const test = require('node:test');
const assert = require('node:assert/strict');
const { buildLegacyUserSessionPayload } = require('../../src/lib/auth/compat.js');

test('buildLegacyUserSessionPayload preserves the legacy-compatible user shape', () => {
  const user = {
    uid: 'abc123',
    email: 'User@Example.com',
    role: 'admin',
    status: 'Active',
    name: 'Example User',
    region: 'West',
    sub_region: 'North',
  };

  const payload = buildLegacyUserSessionPayload(user, [{ id: 1, name: 'Assignment' }]);

  assert.equal(payload.uid, 'abc123');
  assert.equal(payload.email, 'user@example.com');
  assert.equal(payload.role, 'admin');
  assert.equal(payload.status, 'Active');
  assert.equal(payload.name, 'Example User');
  assert.equal(payload.region, 'West');
  assert.equal(payload.sub_region, 'North');
  assert.deepEqual(payload.privilege, [{ id: 1, name: 'Assignment' }]);
});
