import { mobileCellFixture } from "./mobile-api-fixtures.js";

export const mobileAssignmentFixture = Object.freeze({
  assignment_id: "ASG-SAMPLE-002",
  tower_id: "TWR-SAMPLE-002",
  sitename: "Sanitized Assignment Site",
  assignment_state: "On Progress",
  assignment_status: "Open",
  assignment_category: "Audit",
  rigger_email: "rigger@example.invalid",
  rigger_name: "Sanitized Rigger",
  created_date: "2026-02-03",
  created_datetime: "2026-02-03 08:09:10",
  completed: false,
  image_total: "0",
  image_last_count: 0,
  image_uploaded_count: 0,
  images_category: null,
  g900: 1,
  g1800: 0,
});

export const mobileImageFixture = Object.freeze({
  assignment_id: "ASG-SAMPLE-002",
  multi_sector: "No",
  add_sector: "",
  total_antenna: "3",
  total_rru: "3",
  single_sector: "Yes",
  tower_height: "40",
  route_distance: "0",
  tower_type: "SST",
  image_status: null,
  report_url: "https://example.invalid/mobile/report",
});

export const assignmentDetailGolden = Object.freeze({
  code: 200,
  message: "success",
  data: mobileAssignmentFixture,
});

export const imageDetailGolden = Object.freeze({
  code: 200,
  message: "success",
  data: mobileImageFixture,
});

export const aorCellFixture = Object.freeze({
  ...mobileCellFixture,
  assignment_id: "ASG-SAMPLE-002",
  rcell_id: "sector_1_g900_ASG-SAMPLE-002",
  antenna_height: "35",
  tower_height: "40",
});

export const aorSummaryGolden = Object.freeze({
  code: 200,
  message: "success",
  data: {
    assignment: mobileAssignmentFixture,
    cell: [{ ...aorCellFixture, tower_height: "35" }],
    image: mobileImageFixture,
  },
});
