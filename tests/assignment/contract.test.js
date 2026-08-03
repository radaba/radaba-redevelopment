import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRawAssignmentToListItem } from '../../src/features/assignment/assignment-mapper.mjs';
import {
  ASSIGNMENT_COMPOSITE_FIELDS,
  buildAssignmentCompositeRange,
  buildAssignmentDateRange,
} from '../../src/features/assignment/assignment-query-contract.mjs';
import { canAccessAssignment } from '../../src/features/assignment/assignment-privilege.mjs';
import { assignmentFixtures } from '../fixtures/assignment-fixtures.js';

test('maps a raw record without mutation and preserves assignment identity and status', () => {
  const raw = { ...assignmentFixtures.minimal };
  const before = structuredClone(raw);
  const item = mapRawAssignmentToListItem('-sanitized-key', raw);
  assert.equal(item.key, '-sanitized-key');
  assert.equal(item.assignment_id, raw.assignment_id);
  assert.equal(item.assignment_state, 'Open');
  assert.deepEqual(raw, before);
});

test('maps null and missing fields explicitly', () => {
  const item = mapRawAssignmentToListItem('key', assignmentFixtures.missingOptional);
  assert.equal(item.region, null);
  assert.equal(item.closed_datetime, null);
});

test('preserves string and numeric image totals', () => {
  assert.equal(mapRawAssignmentToListItem('a', assignmentFixtures.stringImageTotal).image_total, '12');
  assert.equal(mapRawAssignmentToListItem('b', assignmentFixtures.numericImageTotal).image_total, 12);
  assert.equal(mapRawAssignmentToListItem('c', assignmentFixtures.malformed).image_total, null);
});

test('preserves every confirmed status value', () => {
  assert.deepEqual(
    assignmentFixtures.states.map((raw, index) => mapRawAssignmentToListItem(String(index), raw).assignment_state),
    ['Open', 'Accepted', 'On Progress', 'Paused', 'Finished', 'Rejected', 'Dropped'],
  );
});

test('contains every exact active composite mapping', () => {
  assert.deepEqual(ASSIGNMENT_COMPOSITE_FIELDS.onCreate, {
    status: 'index_created_date_assignment_status',
    rigger_name: 'index_created_date_rigger_name',
    region: 'index_created_date_region',
    sub_region: 'index_created_date_sub_region',
    company: 'index_created_date_company',
  });
  assert.deepEqual(ASSIGNMENT_COMPOSITE_FIELDS.onFinish, {
    status: 'index_closed_date_assignment_status',
    rigger_name: 'index_closed_date_rigger_name',
    region: 'index_closed_date_region',
    sub_region: 'index_closed_date_sub_region',
    company: 'index_closed_date_company',
  });
});

test('builds inclusive created and closed date boundaries', () => {
  assert.deepEqual(buildAssignmentDateRange('2026-01-01', '2026-01-09'), {
    startAt: '2026-01-01', endAt: '2026-01-09',
  });
  assert.deepEqual(buildAssignmentCompositeRange('Test Region', '2026-01-01', '2026-01-09'), {
    startAt: 'Test Region_2026-01-01', endAt: 'Test Region_2026-01-09',
  });
});

test('allows Assignment only for exact path and exact true role property', () => {
  const privileges = [{ path: '/assignment', manager: true, web_admin: false }];
  assert.equal(canAccessAssignment(privileges, 'manager'), true);
  assert.equal(canAccessAssignment(privileges, 'web_admin'), false);
  assert.equal(canAccessAssignment([{ path: '/assignments', manager: true }], 'manager'), false);
});

test('read repository interface exposes no write method', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile(
    new URL('../../src/server/assignment/assignment-repository.ts', import.meta.url), 'utf8',
  ));
  assert.match(source, /findByAssignmentId/);
  assert.match(source, /list\(input/);
  assert.doesNotMatch(source, /\b(create|update|delete|set|push)\s*\(/);
});

test('Firebase repository looks up individual records by assignment_id equality', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile(
    new URL('../../src/server/assignment/firebase-assignment-repository.ts', import.meta.url), 'utf8',
  ));
  assert.match(source, /orderByChild\(assignmentSearchField\("assignmentId", "onCreate"\)\)/);
  assert.match(source, /\.equalTo\(assignmentId\.trim\(\)\)/);
});


