export function createFakeMobileCellRepository(options = {}) {
  const operations = [];
  const records = options.records ?? [];
  return {
    operations,
    async findByAssignmentId(assignmentId) {
      operations.push({
        type: "read",
        path: "cell",
        orderBy: "assignment_id",
        equalTo: assignmentId,
      });
      if (options.error) throw options.error;
      return structuredClone(records);
    },
  };
}

export function createFakeMobileAuth(options = {}) {
  const operations = [];
  return {
    operations,
    async signIn(email, password) {
      void password;
      operations.push({ type: "signIn", email, password: "[redacted]" });
      if (options.error) throw options.error;
      return structuredClone(options.result ?? {});
    },
    async verifyIdToken(token) {
      void token;
      operations.push({ type: "verifyIdToken", token: "[redacted]" });
      if (options.error) throw options.error;
      return structuredClone(options.decoded ?? {});
    },
  };
}

export function createFakeMobileReadRepository(path, options = {}) {
  const operations = [];
  const records = options.records ?? [];
  return {
    operations,
    async findByAssignmentId(assignmentId) {
      operations.push({
        type: "read",
        path,
        orderBy: "assignment_id",
        equalTo: assignmentId,
      });
      if (options.error) throw options.error;
      return structuredClone(records);
    },
  };
}

export function createFakeMobileSectorRepository(options = {}) {
  const operations = [];
  return {
    operations,
    async findByRcellId(rcellId) {
      operations.push({ type: "read", path: "cell", orderBy: "rcell_id", equalTo: rcellId });
      if (options.error) throw options.error;
      return structuredClone(options.records ?? []);
    },
  };
}

export function createFakeMobileUtilityRepository(options = {}) {
  const operations = [];
  return {
    operations,
    async listByKey() {
      operations.push({ type: "read", path: "utility", orderBy: "$key" });
      if (options.error) throw options.error;
      return structuredClone(options.records ?? []);
    },
  };
}
