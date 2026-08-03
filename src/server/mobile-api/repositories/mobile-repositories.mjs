export const MOBILE_RTDB_PATHS = Object.freeze({
  assignment: "assignment",
  cell: "cell",
  image: "image",
  tower: "tower",
  user: "user",
  privilege: "privilege",
  utility: "utility",
  log: "log",
  category: "category",
  achievement: "achievement",
});

export function assertMobileCellRepository(repository) {
  if (!repository || typeof repository.findByAssignmentId !== "function") {
    throw new TypeError("MobileCellRepository requires findByAssignmentId");
  }
  return repository;
}

export const mobileRepositoryOperations = Object.freeze({
  user: ["findUserByEmail"],
  assignment: ["findAssignmentById", "listAssignmentsForRigger"],
  cell: ["findByAssignmentId", "findByRcellId"],
  image: ["listImageMetadata"],
  tower: ["findTowerById"],
  reference: ["readCatalog", "readUtility"],
  loginLog: ["writeLoginLog"],
  metrics: ["claimClose", "incrementProductivity"],
});
