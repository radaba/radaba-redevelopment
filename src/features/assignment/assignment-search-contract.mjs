export const ASSIGNMENT_SEARCH_FIELDS = Object.freeze({
  assignmentId: 'assignment_id',
  towerId: Object.freeze({
    onCreate: 'index_created_date_tower_id',
    onFinish: 'index_closed_date_tower_id',
  }),
});

export function getAssignmentSearchField(searchType, timeBasis) {
  if (searchType === 'assignmentId') return ASSIGNMENT_SEARCH_FIELDS.assignmentId;
  if (searchType === 'towerId') return ASSIGNMENT_SEARCH_FIELDS.towerId[timeBasis];
  return undefined;
}

export function buildTowerSearchRange(value, startDate, endDate) {
  const trimmed = value.trim();
  return { startAt: `${trimmed}_${startDate}`, endAt: `${trimmed}_${endDate}` };
}
