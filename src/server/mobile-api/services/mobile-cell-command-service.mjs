function legacyCellPayload(body) {
  if (body === null || typeof body !== "object") {
    throw new TypeError("Cannot read properties of invalid Cell body");
  }
  const update = structuredClone(body);
  if (typeof body.mechanical_tilt_before !== "undefined") {
    update.mechanical_tilt_after = body.mechanical_tilt_before;
  }
  if (typeof body.electrical_tilt_before !== "undefined") {
    update.electrical_tilt_after = body.electrical_tilt_before;
  }
  if (typeof body.azimuth_before !== "undefined") {
    update.azimuth_after = body.azimuth_before;
  }
  if (typeof body.antenna_height !== "undefined") {
    update.antenna_height_after = body.antenna_height;
  }
  return update;
}

export function createMobileCellCommandService(repository) {
  return {
    async update(body) {
      const value = legacyCellPayload(body);
      const matches = await repository.findCellsByRcellId(body.rcell_id);
      if (matches.length > 0) {
        for (const match of matches) {
          await repository.updateCell(match.key, value);
        }
      } else {
        await repository.createCell(value);
      }
      return value;
    },
  };
}
