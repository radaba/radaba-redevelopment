const OPEN = "Open";
const CLOSED = "Closed";
const SUPPORTED_STATES = new Set(["Paused", "Rejected", "Dropped", "On Progress"]);

export class UnsupportedAssignmentTransitionError extends Error {
  constructor() {
    super("The assignment state not supported");
    this.name = "UnsupportedAssignmentTransitionError";
  }
}

function composites(assignment, status, state, time) {
  return {
    rigger_email_assignment_status_tower_id:
      `${assignment.rigger_email}_${status}_${assignment.tower_id}`,
    rigger_email_assignment_status_assignment_id:
      `${assignment.rigger_email}_${status}_NPMXL_${assignment.tower_id}` +
      `_${time.compactDate}_${time.sequenceSeconds}`,
    index_created_date_assignment_state: `${state}_${assignment.created_date}`,
  };
}

const builders = {
  Paused: (assignment, body, time) => ({
    paused_datetime: time.currDatetime,
    paused_date: time.currDate,
    assignment_state: body.assignment_state,
    ...composites(assignment, OPEN, "Paused", time),
  }),
  Rejected: (assignment, body, time) => ({
    reason: body.reason,
    closed_datetime: time.currDatetime,
    closed_date: time.currDate,
    assignment_state: body.assignment_state,
    assignment_status: CLOSED,
    ...composites(assignment, CLOSED, "Rejected", time),
    index_created_date_assignment_status: `${CLOSED}_${assignment.created_date}`,
  }),
  Dropped: (assignment, body, time) => ({
    reason: body.reason,
    closed_datetime: time.currDatetime,
    closed_date: time.currDate,
    site_datetime: time.currDatetime,
    site_date: time.currDate,
    assignment_state: body.assignment_state,
    assignment_status: CLOSED,
    ...composites(assignment, CLOSED, "Dropped", time),
    index_created_date_assignment_status: `${CLOSED}_${assignment.created_date}`,
  }),
  "On Progress": (assignment, body, time) => ({
    assignment_state: body.assignment_state,
    ...composites(assignment, OPEN, "On Progress", time),
  }),
};

export function createMobileAssignmentTransitionService(repository, clock) {
  const supports = (body) =>
    body !== null &&
    typeof body === "object" &&
    SUPPORTED_STATES.has(body.assignment_state);

  return {
    supports,
    async transition(body) {
      if (!supports(body)) throw new UnsupportedAssignmentTransitionError();
      const assignments = await repository.findAssignments(body.assignment_id);
      if (assignments.length === 0) return "The assignment not found";
      const assignment = assignments[0];
      if (assignment.value?.rigger_email) {
        await repository.findUsersByEmail(assignment.value.rigger_email);
      }
      const update = builders[body.assignment_state](
        assignment.value,
        body,
        clock.current(),
      );
      await repository.updateAssignment(assignment.key, update);
      return update;
    },
  };
}

