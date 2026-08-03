const TIME_BASES = new Set(['onCreate', 'onFinish']);
const PAGE_SIZES = new Set([10, 25, 50]);
const FILTER_KEYS = ['status', 'region', 'sub_region', 'company', 'rigger_name'];
const SEARCH_TYPES = new Set(['assignmentId', 'towerId']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLA_STATES = new Set(['Warning', 'Overdue', 'Escalated']);
const AGING_BUCKETS = new Set(['0-1', '2-3', '4-7', '8-14', '15+']);

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function jakartaDate(offsetDays = 0, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const date = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function defaultAssignmentDates(now = new Date()) {
  return { startDate: jakartaDate(-8, now), endDate: jakartaDate(0, now) };
}

export function parseAssignmentListParams(input = {}, now = new Date()) {
  const defaults = defaultAssignmentDates(now);
  const suppliedTimeBasis = firstValue(input.timeBasis) ?? 'onCreate';
  const suppliedStartDate = firstValue(input.startDate) ?? defaults.startDate;
  const suppliedEndDate = firstValue(input.endDate) ?? defaults.endDate;
  const parsedPage = Number(firstValue(input.page) ?? '1');
  const parsedPageSize = Number(firstValue(input.pageSize) ?? '10');
  const validDates = DATE_PATTERN.test(suppliedStartDate) &&
    DATE_PATTERN.test(suppliedEndDate) && suppliedStartDate <= suppliedEndDate;

  const canonicalCategory = firstValue(input.filterCategory);
  const canonicalValues = (Array.isArray(input.filterValues) ? input.filterValues : [input.filterValues])
    .filter((value) => typeof value === 'string').map((value) => value.trim()).filter((value) => value.length > 0 && value.length <= 100).slice(0, 20);
  const legacyActive = FILTER_KEYS.flatMap((key) => {
    const values = (Array.isArray(input[key]) ? input[key] : [input[key]])
      .filter((value) => typeof value === 'string').map((value) => value.trim()).filter((value) => value.length > 0 && value.length <= 100).slice(0, 20);
    return values.length ? [{ key, values }] : [];
  });
  const canonicalActive = FILTER_KEYS.includes(canonicalCategory) && canonicalValues.length
    ? [{ key: canonicalCategory, values: canonicalValues }] : [];
  const active = canonicalActive.length ? canonicalActive : legacyActive.slice(0, 1);

  const searchType = firstValue(input.searchType);
  const searchValue = String(firstValue(input.searchValue) ?? '').trim();
  const hasSearch = SEARCH_TYPES.has(searchType) && searchValue.length > 0 && searchValue.length <= 200;
  const slaState = firstValue(input.slaState);
  const agingBucket = firstValue(input.agingBucket);

  return {
    timeBasis: TIME_BASES.has(suppliedTimeBasis) ? suppliedTimeBasis : 'onCreate',
    startDate: validDates ? suppliedStartDate : defaults.startDate,
    endDate: validDates ? suppliedEndDate : defaults.endDate,
    page: Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1,
    pageSize: PAGE_SIZES.has(parsedPageSize) ? parsedPageSize : 10,
    ...(active[0] ? { filterCategory: active[0].key, filterValues: active[0].values } : {}),
    ...(hasSearch ? { searchType, searchValue } : {}),
    ...(SLA_STATES.has(slaState) ? { slaState } : {}),
    ...(AGING_BUCKETS.has(agingBucket) ? { agingBucket } : {}),
  };
}

