export const securityProfiles = Object.freeze({
  owner: {
    uid: "uid-owner-sample",
    email: "owner@example.invalid",
    role: "Rigger",
    position: "Rigger",
    status: "Active",
    disabled: false,
  },
  inactive: {
    uid: "uid-inactive-sample",
    email: "inactive@example.invalid",
    role: "Rigger",
    position: "Rigger",
    status: "Not Active",
    disabled: false,
  },
  disabled: {
    uid: "uid-disabled-sample",
    email: "disabled@example.invalid",
    role: "Rigger",
    position: "Rigger",
    status: "Active",
    disabled: true,
  },
  other: {
    uid: "uid-other-sample",
    email: "other@example.invalid",
    role: "Rigger",
    position: "Rigger",
    status: "Active",
    disabled: false,
  },
  coordinator: {
    uid: "uid-coordinator-sample",
    email: "coordinator@example.invalid",
    role: "Coordinator",
    position: "Coordinator",
    status: "Active",
    disabled: false,
  },
  unrelatedCoordinator: {
    uid: "uid-unrelated-coordinator",
    email: "unrelated-coordinator@example.invalid",
    role: "Coordinator",
    position: "Coordinator",
    status: "Active",
    disabled: false,
  },
  administrator: {
    uid: "uid-administrator-sample",
    email: "administrator@example.invalid",
    role: "Administrator",
    position: "Administrator",
    status: "Active",
    disabled: false,
  },
  unknownRole: {
    uid: "uid-unknown-role",
    email: "unknown-role@example.invalid",
    role: "Unknown",
    position: "Unknown",
    status: "Active",
    disabled: false,
  },
});

export const securityAssignment = Object.freeze({
  assignment_id: "ASG-SECURITY-SAMPLE-001",
  tower_id: "TOWER-SECURITY-SAMPLE-001",
  rigger_email: securityProfiles.owner.email,
  coordinator_email: securityProfiles.coordinator.email,
  rno_email: "rno@example.invalid",
  assignment_status: "Open",
});

export const securityCell = Object.freeze({
  rcell_id: "sector_1_l1800_ASG-SECURITY-SAMPLE-001",
  assignment_id: securityAssignment.assignment_id,
  tower_id: securityAssignment.tower_id,
  band: "l1800",
  sector: "1",
});
