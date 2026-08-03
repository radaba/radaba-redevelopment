const base = {
  assignment_id: 'NPMXL_TEST_SITE_010126_1000000000',
  tower_id: 'TEST_SITE',
  region: 'Test Region',
  sub_region: 'Test Sub Region',
  company: 'TEST PARTNER',
  rigger_name: 'Test Rigger',
  assignment_status: 'Open',
  assignment_state: 'Open',
  created_date: '2026-01-01',
  created_datetime: '2026-01-01 08:00:00',
};

export const assignmentFixtures = Object.freeze({
  minimal: { ...base },
  missingOptional: { assignment_id: base.assignment_id, assignment_state: 'Open' },
  stringCoordinates: { ...base, latitude: '-6.2000', longitude: '106.8166' },
  numericCoordinates: { ...base, latitude: -6.2, longitude: 106.8166 },
  stringImageTotal: { ...base, image_total: '12' },
  numericImageTotal: { ...base, image_total: 12 },
  states: ['Open', 'Accepted', 'On Progress', 'Paused', 'Finished', 'Rejected', 'Dropped'].map((assignment_state) => ({
    ...base,
    assignment_state,
  })),
  malformed: {
    assignment_id: null,
    assignment_state: 42,
    created_datetime: false,
    image_total: true,
  },
});
