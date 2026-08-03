# Production structured logging

Mobile operational logs are single JSON records containing timestamp, request ID, optional correlation ID, route, method, rounded latency, status, hashed 12-character actor ID, security mode, and compatibility mode. Sink failures are swallowed.

Never record passwords, ID/refresh tokens, Authorization, cookies, full bodies, private Firebase data, image URLs, coordinates, or raw Firebase errors. Platform retention, access control, forwarding, sampling, and deletion policy remain deployment prerequisites.