# M13R production preparation

M13R provides inert operational controls, health/readiness surfaces, sanitized mobile request instrumentation, deterministic rollout selection, rollback configuration, and runbooks. It does not deploy, switch traffic, call legacy fallback, enable enforcement, or declare production readiness.

M12 blockers remain authoritative: missing Android-called routes, deferred lifecycle contracts, disabled Android Bearer authentication, and absent live staging evidence. `/ready` must not be used to override these governance gates.