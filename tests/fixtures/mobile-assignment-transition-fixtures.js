export const transitionAssignment = {
  assignment_id: "ASG-SAMPLE-009",
  assignment_state: "Accepted",
  assignment_status: "Open",
  created_date: "2026-07-20",
  rigger_email: "rigger@example.invalid",
  tower_id: "TOWER-SAMPLE-009",
};

export const androidTransitionBodies = {
  pause: {
    assignment_state: "Paused",
    assignment_id: "ASG-SAMPLE-009",
    tower_id: "TOWER-SAMPLE-009",
    rigger_email: "rigger@example.invalid",
  },
  reject: {
    assignment_state: "Rejected",
    assignment_id: "ASG-SAMPLE-009",
    tower_id: "TOWER-SAMPLE-009",
    rigger_email: "rigger@example.invalid",
    reason: "Other",
  },
  drop: {
    assignment_state: "Dropped",
    assignment_id: "ASG-SAMPLE-009",
    tower_id: "TOWER-SAMPLE-009",
    rigger_email: "rigger@example.invalid",
    reason: "Sick",
  },
  resume: {
    assignment_state: "On Progress",
    assignment_id: "ASG-SAMPLE-009",
    tower_id: "TOWER-SAMPLE-009",
    rigger_email: "rigger@example.invalid",
  },
};

export const fixedTransitionTime = {
  currDatetime: "2026-07-27 13:14:15",
  currDate: "2026-07-27",
  compactDate: "072726",
  sequenceSeconds: 1785158055,
};

