import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseAssignmentListParams } from '../../src/features/assignment/assignment-list-params.mjs';
import {
  ASSIGNMENT_SEARCH_FIELDS,
  buildTowerSearchRange,
  getAssignmentSearchField,
} from '../../src/features/assignment/assignment-search-contract.mjs';
import {
  ASSIGNMENT_CSV_HEADINGS,
  ASSIGNMENT_EXPORT_MAX_ROWS,
  assignmentCsvFilename,
  escapeCsvCell,
  serializeAssignmentCsv,
} from '../../src/features/assignment/assignment-csv-contract.mjs';
import { canAccessAssignment } from '../../src/features/assignment/assignment-privilege.mjs';

test('parses supported search URL values and trims the value', () => {
  const parsed = parseAssignmentListParams({
    searchType: 'assignmentId',
    searchValue: '  TEST-123  ',
    page: '4',
  });
  assert.equal(parsed.searchType, 'assignmentId');
  assert.equal(parsed.searchValue, 'TEST-123');
  assert.equal(parsed.page, 4);
});

test('invalid search type and empty search value fall back without a search', () => {
  assert.equal(parseAssignmentListParams({ searchType: 'freeText', searchValue: 'abc' }).searchType, undefined);
  assert.equal(parseAssignmentListParams({ searchType: 'towerId', searchValue: '   ' }).searchType, undefined);
});

test('invalid URL values fall back safely', () => {
  const parsed = parseAssignmentListParams({ timeBasis: 'bad', page: '0', pageSize: '999' });
  assert.equal(parsed.timeBasis, 'onCreate');
  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 10);
});

test('maps Assignment ID and Tower ID to exact fields', () => {
  assert.equal(getAssignmentSearchField('assignmentId', 'onCreate'), 'assignment_id');
  assert.equal(getAssignmentSearchField('towerId', 'onCreate'), 'index_created_date_tower_id');
  assert.equal(getAssignmentSearchField('towerId', 'onFinish'), 'index_closed_date_tower_id');
  assert.deepEqual(ASSIGNMENT_SEARCH_FIELDS.towerId, {
    onCreate: 'index_created_date_tower_id',
    onFinish: 'index_closed_date_tower_id',
  });
  assert.deepEqual(buildTowerSearchRange(' TEST_SITE ', '2026-01-01', '2026-01-09'), {
    startAt: 'TEST_SITE_2026-01-01',
    endAt: 'TEST_SITE_2026-01-09',
  });
});

test('CSV heading order is stable and Duration is deliberately absent', () => {
  assert.deepEqual(ASSIGNMENT_CSV_HEADINGS, [
    'Assignment ID', 'Region', 'Sub-region', 'Partner', 'Rigger',
    'Status', 'Assignment Time', 'Finished Time', 'Image Total',
  ]);
  assert.equal(ASSIGNMENT_CSV_HEADINGS.includes('Duration'), false);
});

test('CSV escaping handles commas, quotes, newlines, and formula injection', () => {
  assert.equal(escapeCsvCell('a,b'), '"a,b"');
  assert.equal(escapeCsvCell('a"b'), '"a""b"');
  assert.equal(escapeCsvCell('a\nb'), '"a\nb"');
  assert.equal(escapeCsvCell('=SUM(A1:A2)'), "'=SUM(A1:A2)");
  assert.equal(escapeCsvCell('+1'), "'+1");
  assert.equal(escapeCsvCell('-1'), "'-1");
  assert.equal(escapeCsvCell('@cmd'), "'@cmd");
});

test('CSV is UTF-8 BOM prefixed and RFC 4180 line terminated', () => {
  const csv = serializeAssignmentCsv([{
    assignment_id: 'ID,1',
    region: 'Region',
    sub_region: 'Sub',
    company: 'PARTNER',
    rigger_name: 'A "Rigger"',
    assignment_state: 'Open',
    created_date: '2026-01-01',
    closed_date: null,
    image_total: 2,
  }]);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.match(csv, /"ID,1"/);
  assert.match(csv, /"A ""Rigger"""/);
  assert.ok(csv.endsWith('\r\n'));
});

test('export policy has a fixed row limit and stable filename', () => {
  assert.equal(ASSIGNMENT_EXPORT_MAX_ROWS, 5000);
  assert.equal(assignmentCsvFilename('2026-07-23'), 'radaba-assignments-2026-07-23.csv');
});

test('export privilege is denied without exact access and allowed with it', () => {
  assert.equal(canAccessAssignment(null, 'manager'), false);
  assert.equal(canAccessAssignment([{ path: '/assignment', manager: false }], 'manager'), false);
  assert.equal(canAccessAssignment([{ path: '/assignment', manager: true }], 'manager'), true);
});

test('client changes search and filter navigation with page reset', async () => {
  const source = await readFile(new URL('../../src/components/assignment/assignment-page-client.tsx', import.meta.url), 'utf8');
  assert.match(source, /if \(resetPage\) next\.set\("page", "1"\)/);
  assert.match(source, /window\.setTimeout/);
  assert.match(source, /500/);
});

test('export route verifies session and privilege and repository exposes no writes', async () => {
  const route = await readFile(new URL('../../src/app/api/assignments/export/route.ts', import.meta.url), 'utf8');
  const repository = await readFile(new URL('../../src/server/assignment/assignment-repository.ts', import.meta.url), 'utf8');
  assert.match(route, /resolveAuthenticatedUser/);
  assert.match(route, /canAccessAssignment/);
  assert.match(route, /status: 401/);
  assert.match(route, /status: 403/);
  assert.match(route, /status: 413/);
  assert.doesNotMatch(repository, /\b(create|update|delete|set|push|remove)\s*\(/);
});
