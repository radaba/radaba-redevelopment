# Phase 7J: Assignment Comments and Collaboration

## Scope

Assignment Detail contains one plain-text operational Discussion thread. Comments are independent history and do not change workflow, completion prerequisites, the lifecycle timeline, Photo Evidence, Work Execution, or notifications. Typing indicators, read receipts, mentions, markdown, HTML, emoji tooling, and attachments remain deferred.

## Data model

Comments are stored at `assignment_comment/{assignmentPushKey}/{commentPushKey}` so unbounded discussion data does not enlarge the legacy Assignment record or its transactions. Each record stores `assignment_id`, server-derived `author_id`, `author_name`, `author_role`, numeric `created_at`, optional `edited_at`, `message`, `deleted`, optional `reply_to`, and `client_request_id`.

The Firebase push key is the comment ID and chronological pagination cursor. `reply_to` reserves a compatible future reply/mention boundary without activating those capabilities. Avatar images are not persisted because the current user model has no confirmed avatar contract; the UI derives initials.

## Permissions and lifecycle

Reading and creating comments require an Active verified session and strict `/assignment` access. Users may edit or soft-delete their own comment for 15 minutes. `super_admin` may delete any non-deleted comment. Server APIs derive identity, role, and time from the authenticated session and never accept them from the browser.

Completed Assignments keep all comments visible but make Discussion read-only. Revisit preserves the thread and restores commenting. Commands resolve the current Assignment and reject completed, missing, cross-Assignment, expired, or unauthorized mutations.

## Validation and history

Validation is centralized: input is trimmed, must contain a visible non-whitespace character, and is limited to 2,000 characters. React renders message text directly with preserved newlines; markdown and HTML are not interpreted.

Deletion is a soft delete. Author and timestamp history remain while the message is suppressed. Comments never produce lifecycle timeline entries.

## Pagination and realtime architecture

The initial API returns the newest 30 push-key-ordered comments. Older pages use an exclusive push-key cursor and preserve the browser scroll position when prepended.

An authenticated server-sent events endpoint reuses the HttpOnly Firebase session and listens through Firebase Admin only to the newest 30 records. It forwards `child_added` and `child_changed` events. The browser merges by comment ID and auto-scrolls only when already near the bottom. This avoids introducing direct browser RTDB authorization or downloading the full thread.

Client-generated UUID request IDs make retries idempotent. Comment mutation transactions recheck ownership, recency, and deletion state against the latest comment.

## Future boundaries

- Mentions may be parsed from plain text later, but no notification is created now.
- `reply_to` may support replies later without changing current rendering.
- Attachments require a separate approved Storage and metadata contract.
- A confirmed user avatar field can replace initials without changing comment authorship.

## Compatibility

The existing `assignment`, `user`, and `privilege` shapes are unchanged. No database migration is required. Android and legacy Assignment workflow consumers can ignore the new isolated optional path.
