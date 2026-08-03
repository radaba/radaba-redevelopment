export function createMobileAuthenticationAdapter(implementation = {}) {
  const missing = (operation) => async () => {
    throw new Error(`Mobile authentication operation is not implemented: ${operation}`);
  };
  return Object.freeze({
    signIn: implementation.signIn ?? missing("signIn"),
    verifyIdToken: implementation.verifyIdToken ?? missing("verifyIdToken"),
    resolveUser: implementation.resolveUser ?? missing("resolveUser"),
    signOut: implementation.signOut ?? missing("signOut"),
  });
}

export function createFirebaseMobileAuthAdapter(firebaseAuth) {
  return createMobileAuthenticationAdapter({
    signIn: (email, password) => firebaseAuth.signIn(email, password),
    verifyIdToken: (token) => firebaseAuth.verifyIdToken(token),
    resolveUser: (uid) => firebaseAuth.getUser(uid),
    signOut: (uid) => firebaseAuth.revokeRefreshTokens(uid),
  });
}
