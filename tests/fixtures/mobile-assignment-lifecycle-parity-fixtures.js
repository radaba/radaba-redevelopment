export const lifecycleParityMatrix = Object.freeze([
  { state: "Accepted", route: "updateAssignmentDetails", disposition: "deferred", replay: "unknown", reason: "M9R-A safe stop" },
  { state: "Checkin", route: "updateAssignmentDetails", disposition: "deferred", replay: "unknown", reason: "M9R-A safe stop" },
  { state: "Go", route: "updateAssignmentDetails", disposition: "deferred", replay: "unknown", reason: "M9R-A safe stop" },
  { state: "Paused", route: "updateAssignmentDetails", disposition: "exact", replay: "last-write-wins" },
  { state: "Rejected", route: "updateAssignmentDetails", disposition: "exact", replay: "last-write-wins" },
  { state: "Dropped", route: "updateAssignmentDetails", disposition: "exact", replay: "last-write-wins" },
  { state: "On Progress", route: "updateAssignmentDetails", disposition: "exact", replay: "last-write-wins" },
  { state: "Finished", route: "updateAssignmentDetails", disposition: "exact-with-documented-limit", replay: "counter-incrementing" },
  { state: "completed", route: "updateAssignmentDetails", disposition: "deferred", replay: "unknown", reason: "legacy branch not requested" },
  { state: "Closed by ID", route: "updateAssignmentToClosedByID", disposition: "deferred", replay: "unknown", reason: "no confirmed Android caller or DTO" },
]);

export const lifecycleWritePathAllowlist = Object.freeze([
  "assignment", "cell", "image", "tower", "user", "achievement",
]);

export const lifecycleFailureModel = Object.freeze({
  simpleTransition: "one assignment update; failed write leaves no partial mutation",
  finished: "ordered non-atomic fan-out; failure preserves all earlier successful writes",
  automaticRecovery: false,
  safeRetry: false,
});
