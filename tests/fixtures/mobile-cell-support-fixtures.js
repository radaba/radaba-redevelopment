import { mobileCellFixture } from "./mobile-api-fixtures.js";

export const sectorCellFixture = Object.freeze({
  ...mobileCellFixture,
  rcell_id: "sector_2_l1800_ASG-SAMPLE-003",
  assignment_id: "ASG-SAMPLE-003",
  sector: "2",
  band: "l1800",
  azimuth_before: 0,
  azimuth_after: "",
  antenna_port_note: null,
});

export const utilityFixture = Object.freeze({
  app_url: "https://example.invalid/mobile/app",
  app_version: 7,
  banner: { tutorial: { image_url: "https://example.invalid/mobile/banner" } },
  distance: 0,
  geolocation: "",
  force_update: false,
  maintenance: false,
});

export const sectorGolden = Object.freeze({ code: 200, message: "success", data: [sectorCellFixture] });
export const utilityGolden = Object.freeze({ code: 200, message: "success", data: [utilityFixture] });
