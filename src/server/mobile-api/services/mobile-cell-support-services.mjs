export function createMobileSectorReadService(repository) {
  return Object.freeze({
    findByRcellId: (rcellId) => repository.findByRcellId(rcellId),
  });
}

export function createMobileUtilityReadService(repository) {
  return Object.freeze({
    async firstByKey() {
      const rows = await repository.listByKey();
      return rows.length ? [rows[0]] : "not found";
    },
  });
}
