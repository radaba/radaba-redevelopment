export function createMobileAssignmentReadService(repository) {
  return Object.freeze({
    async firstByAssignmentId(assignmentId) {
      const values = await repository.findByAssignmentId(assignmentId);
      return values.length ? values[0] : {};
    },
    findAllByAssignmentId: (assignmentId) =>
      repository.findByAssignmentId(assignmentId),
  });
}

export function createMobileImageReadService(repository) {
  return Object.freeze({
    async firstByAssignmentId(assignmentId) {
      const values = await repository.findByAssignmentId(assignmentId);
      return values.length ? values[0] : {};
    },
    findAllByAssignmentId: (assignmentId) =>
      repository.findByAssignmentId(assignmentId),
  });
}

export function createMobileAorSummaryService({ assignments, cells, images }) {
  return Object.freeze({
    async findByAssignmentId(assignmentId) {
      const assignmentRows = await assignments.findByAssignmentId(assignmentId);
      const cellRows = await cells.findByAssignmentId(assignmentId);
      const imageRows = await images.findByAssignmentId(assignmentId);
      if (!assignmentRows.length || !cellRows.length || !imageRows.length) return {};
      return {
        assignment: assignmentRows[0],
        cell: cellRows.map((cell) => ({
          ...cell,
          tower_height: cell.antenna_height,
        })),
        image: imageRows[0],
      };
    },
  });
}
