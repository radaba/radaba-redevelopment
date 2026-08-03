# M12R staging security rollout

Local mode validation passed: legacy-compatible permits current Android traffic; observe evaluates and audits without blocking; enforce rejects protected calls without a verified token. Client input cannot change mode, and production enforce remains impossible in code.

Android currently has its Authorization interceptor line commented out. Before staging enforce, Android must store/refresh the signin token, send Bearer, handle expired/revoked 401, distinguish 403, and exercise logout. Because Android modification is forbidden in M12R, only legacy-compatible and observe are compatible today.

Rollback: set the approved staging deployment back to legacy-compatible and redeploy the prior approved artifact. No schema rollback is involved. This document authorizes no configuration change or rollout stage.