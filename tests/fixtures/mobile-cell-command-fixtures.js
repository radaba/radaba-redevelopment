export const androidCellBase = Object.freeze({
  assignment_id: "ASG-SAMPLE-011",
  tower_id: "TOWER-SAMPLE-011",
  rigger_email: "rigger@example.invalid",
  company: "Sample Company",
  coordinator_email: "coordinator@example.invalid",
  coordinator_name: "Sample Coordinator",
  kabupaten: "Sample Regency",
  kecamatan: "Sample District",
  province: "Sample Province",
  region: "Sample Region",
  rigger_name: "Sample Rigger",
  rno_email: "rno@example.invalid",
  rno_name: "Sample RNO",
  sitename: "Sample Site",
  sub_region: "Sample Subregion",
  tower_latitude: "-6.2000",
  tower_longitude: "106.8166",
  rcell_id: "sector_2_l1800_ASG-SAMPLE-011",
  band: "l1800",
  sector: "2",
});

export const cellUpdateBody = Object.freeze({
  ...androidCellBase,
  mechanical_tilt_before: "4",
  electrical_tilt_before: "2",
  azimuth_before: "120",
  antenna_height: "42",
});

export const antennaPortBody = Object.freeze({
  ...androidCellBase,
  antenna_port_quantity: "8",
  antenna_port_in_use: "4",
  antenna_port_aisg_cable: "2",
  antenna_port_note: "",
});

export const expectedMirroredCellUpdate = Object.freeze({
  ...cellUpdateBody,
  mechanical_tilt_after: "4",
  electrical_tilt_after: "2",
  azimuth_after: "120",
  antenna_height_after: "42",
});
