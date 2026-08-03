const STATUS_TONES = Object.freeze({
  Open: 'blue',
  Accepted: 'blue',
  'On Progress': 'amber',
  Paused: 'amber',
  Finished: 'green',
  Rejected: 'red',
  Dropped: 'red',
});

export function assignmentStatusTone(status) {
  return STATUS_TONES[status] ?? 'gray';
}
