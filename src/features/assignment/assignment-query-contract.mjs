export const ASSIGNMENT_TIME_FIELDS = Object.freeze({
  onCreate: 'created_date',
  onFinish: 'closed_date',
});

export const ASSIGNMENT_COMPOSITE_FIELDS = Object.freeze({
  onCreate: Object.freeze({
    status: 'index_created_date_assignment_status',
    rigger_name: 'index_created_date_rigger_name',
    region: 'index_created_date_region',
    sub_region: 'index_created_date_sub_region',
    company: 'index_created_date_company',
  }),
  onFinish: Object.freeze({
    status: 'index_closed_date_assignment_status',
    rigger_name: 'index_closed_date_rigger_name',
    region: 'index_closed_date_region',
    sub_region: 'index_closed_date_sub_region',
    company: 'index_closed_date_company',
  }),
});

export function getAssignmentQueryField(timeBasis, filterCategory) {
  if (!filterCategory) return ASSIGNMENT_TIME_FIELDS[timeBasis];
  return ASSIGNMENT_COMPOSITE_FIELDS[timeBasis]?.[filterCategory];
}

export function buildAssignmentDateRange(startDate, endDate) {
  return { startAt: startDate, endAt: endDate };
}

export function buildAssignmentCompositeRange(value, startDate, endDate) {
  return { startAt: `${value}_${startDate}`, endAt: `${value}_${endDate}` };
}
