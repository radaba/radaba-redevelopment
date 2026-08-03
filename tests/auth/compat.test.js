import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLegacyUserSessionPayload } from '../../src/lib/auth/compat.js';
import {
  createVerifiedSession,
  logoutSession,
  resolveVerifiedSession,
} from '../../src/lib/auth/session-lifecycle.mjs';

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

test('missing ID token is rejected before verification', async () => {
  let verified = false;
  await assert.rejects(
    createVerifiedSession({
      idToken: '',
      verifyIdToken: async () => { verified = true; },
      resolveUser: async () => ({}),
      createSessionCookie: async () => 'cookie',
      expiresIn: 1,
    }),
    /Firebase ID token is required/,
  );
  assert.equal(verified, false);
});

test('invalid ID token does not create a session', async () => {
  let created = false;
  await assert.rejects(
    createVerifiedSession({
      idToken: 'invalid-token',
      verifyIdToken: async () => { throw new Error('invalid ID token'); },
      resolveUser: async () => ({}),
      createSessionCookie: async () => { created = true; },
      expiresIn: 1,
    }),
    /invalid ID token/,
  );
  assert.equal(created, false);
});

test('valid ID token creates a session after resolving trusted claims', async () => {
  const calls = [];
  const result = await createVerifiedSession({
    idToken: 'valid-token',
    verifyIdToken: async (token) => { calls.push(['verify', token]); return { uid: 'uid-1', email: 'user@example.com' }; },
    resolveUser: async (claims) => { calls.push(['resolve', claims.uid]); return { uid: claims.uid }; },
    createSessionCookie: async (token, options) => { calls.push(['create', token, options.expiresIn]); return 'firebase-session-cookie'; },
    expiresIn: 604800000,
  });
  assert.deepEqual(result, { user: { uid: 'uid-1' }, sessionCookie: 'firebase-session-cookie' });
  assert.deepEqual(calls, [['verify', 'valid-token'], ['resolve', 'uid-1'], ['create', 'valid-token', 604800000]]);
});

test('missing session cookie is rejected', async () => {
  await assert.rejects(
    resolveVerifiedSession({ cookieValue: null, verifySessionCookie: async () => ({}), resolveUser: async () => ({}) }),
    /Unauthorized/,
  );
});

test('invalid session cookie is rejected', async () => {
  await assert.rejects(
    resolveVerifiedSession({
      cookieValue: 'invalid',
      verifySessionCookie: async () => { throw new Error('invalid session'); },
      resolveUser: async () => ({}),
    }),
    /invalid session/,
  );
});

test('revoked session is checked and rejected', async () => {
  let checkRevoked;
  await assert.rejects(
    resolveVerifiedSession({
      cookieValue: 'revoked',
      verifySessionCookie: async (_cookie, check) => { checkRevoked = check; throw new Error('revoked session'); },
      resolveUser: async () => ({}),
    }),
    /revoked session/,
  );
  assert.equal(checkRevoked, true);
});

test('successful logout decodes the session, revokes by uid, and clears the cookie', async () => {
  const calls = [];
  await logoutSession({
    cookieValue: 'session-cookie',
    verifySessionCookie: async (cookie, checkRevoked) => { calls.push(['verify', cookie, checkRevoked]); return { uid: 'uid-1' }; },
    revokeRefreshTokens: async (uid) => { calls.push(['revoke', uid]); },
    clearCookie: async () => { calls.push(['clear']); },
  });
  assert.deepEqual(calls, [['verify', 'session-cookie', false], ['revoke', 'uid-1'], ['clear']]);
});

test('logout with an invalid cookie still clears the cookie', async () => {
  let cleared = false;
  let revoked = false;
  await logoutSession({
    cookieValue: 'invalid',
    verifySessionCookie: async () => { throw new Error('invalid session'); },
    revokeRefreshTokens: async () => { revoked = true; },
    clearCookie: async () => { cleared = true; },
  });
  assert.equal(revoked, false);
  assert.equal(cleared, true);
});
