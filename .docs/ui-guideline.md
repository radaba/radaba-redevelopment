# Radaba UI Guideline

## Application shell hierarchy

Authenticated pages use the shared sidebar, mobile drawer, sticky header, breadcrumb, content container, and page header. Pages must not recreate navigation or authenticated identity controls.

## Navigation rules

- Define routes once in `navigation-config.ts`.
- Use the same collection for desktop and mobile navigation.
- Mark the exact active route with `aria-current="page"`.
- Breadcrumb labels come from route metadata, never raw URL fragments.
- Collapsed navigation retains accessible text and visible focus styling.

## Responsive behavior

- Mobile-first content spacing uses 1rem, increasing at `sm` and `lg`.
- Below `lg`, desktop navigation is hidden and the header opens a modal drawer.
- At `lg` and above, the desktop sidebar can switch between 16rem and 5rem widths.
- Sidebar state is transient and is not persisted.
- Mobile drawers close on navigation, overlay activation, close-button activation, and Escape.

## Spacing and surfaces

- Use compact 1rem to 1.5rem section gaps.
- Primary surfaces use white backgrounds, restrained slate borders, `rounded-2xl`, and subtle shadows.
- Content remains within a `max-w-7xl` container.
- Avoid horizontal overflow and long unbroken identity text.

## Page headers

Use `PageHeader` for every authenticated route. Provide a clear title and concise description. Use the optional actions slot only for real page actions and the optional breadcrumb slot when a page requires breadcrumb placement outside the shell header.

## Empty and placeholder states

State what is unavailable, why it is unavailable, and the milestone that will introduce it. Placeholder controls must not appear active. Do not fetch or write data merely to make a placeholder look populated.

## Accessibility

- Use semantic header, main, aside, and navigation landmarks.
- Every icon-only control requires an accessible label.
- Interactive elements require visible `focus-visible` styling.
- Menu and drawer triggers expose expanded state.
- Mobile navigation uses a labelled modal dialog, Escape handling, and background scroll protection.
- Maintain readable contrast and meaningful link text.

## Search, filter, and export controls

Search types must be explicit and debounced. Applied criteria remain visible and wrap on mobile. Date/filter drafts use an Apply action that is disabled when invalid; clear-current and reset-all actions have descriptive labels. Export controls expose progress through visible text and an `aria-live` announcement, prevent duplicate activation, and keep errors near the toolbar.

## Administrator editing patterns

Sensitive scalar changes use labelled modal confirmation, show the exact target/value, disable duplicate submission, return nearby success/error feedback, and preserve keyboard focus visibility. Administrative tables become cards below their desktop breakpoint and must not require mobile horizontal scrolling.

Role inventory pages use only authoritative derived counts, keep compatibility states textual, and link to the existing privilege-management flow instead of embedding a matrix per row. Search and presentation filters may operate locally over the server-provided inventory and remain URL-backed. Unsupported lifecycle actions must not appear.

Privilege inventories group by stored category using native collapsible sections and retain a contained desktop role matrix plus complete mobile cards. Security-critical paths require explicit textual protection labels, while the server remains authoritative. Local URL-backed search may cover stored metadata; unavailable descriptions or system/custom classifications must not be inferred.

## Import dialogs

Use explicit Select, Preview, Validate, Confirm, Import, and Results stages, a labelled file control, live summaries, contained desktop tables, mobile cards, and focus-managed modal behavior.

## Assignment operations page

- Keep Create Assignment as the primary header action and Export CSV as the strong secondary action.
- Present search and filter drafts as one compact workflow; debounced search remains immediate while date/category drafts require Apply.
- Keep applied criteria visible. Search and category criteria provide individual removal, while Clear all restores canonical defaults.
- Format dates for people, use valid Unicode separators, and never expose a fabricated total when the repository only returns one page.
- Use a sticky-header table at desktop widths and complete stacked cards below the table breakpoint. Mobile cards must retain every field shown in the list table.
- Empty results explain whether criteria caused the state and provide Clear filters and Create Assignment recovery actions.
- Interaction transitions stay within 150–250 ms and motion-dependent feedback respects `prefers-reduced-motion`.

## Assignment detail pages

- Resolve detail pages by the existing Firebase push key while displaying the business Assignment ID as the primary identity.
- Use compact summary cards followed by a two-column information layout; the overview sidebar becomes sticky only at desktop widths.
- Render legacy fields as responsive definition lists and omit unsupported concepts instead of displaying fabricated priority, progress, comments, attachments, or related records.
- Derive lifecycle presentation only from stored timestamps. Show an associated person only when the existing record provides a defensible relationship.
- Limit actions to verified commands and browser-safe utilities. Missing report and lifecycle data use compact contextual empty states.
- Detail routes require a structure-matching skeleton, semantic headings and lists, visible focus, reduced-motion behavior, and print-safe action visibility.

## Revisit Assignment interaction

- Show Revisit Assignment only when the shared completion contract classifies the current record as completed.
- Require an explicit modal confirmation and a non-empty reason; explain that history remains and the action is not automatically reversible.
- After success, refresh the server view. Display `Revisited xN`, chronological revisit events with actor and reason, and latest revisit metadata without hiding earlier completion timestamps.
- Reopened active records must not retain completed-only locks merely because a historical completion timestamp remains stored.

## Assignment photo evidence

Photo Evidence uses the existing compact section surface and three keyboard-accessible category tabs. Active Assignments expose drag/drop plus a standard `accept="image/*"` multi-file input for mobile camera/gallery selection. Per-file progress, retry, validation errors, loading, and empty states remain adjacent to the evidence section and use live/alert semantics.

The grid uses fixed square containers with two mobile, three tablet, and four desktop columns. Thumbnails lazy-load; original images load only in the modal viewer. The viewer restores focus, supports Escape and arrow navigation, and exposes labelled view, download, and delete controls. Completed Assignments show a read-only explanation instead of an uploader.

## Work Execution

Assignment Detail presents Checklist and Work Report as independent compact cards under one Work Execution section. Use explicit view and edit modes; do not autosave. Desktop uses two columns and mobile stacks full-width controls. Default checklist items remain visibly non-destructive; custom item and material deletion requires confirmation. Save errors are adjacent and announced, pending saves prevent duplicate submission, and Completed records show a read-only explanation instead of editing controls.

## Tower directory pattern

Read-only master-data directories use labelled bounded summaries, a contained desktop table, complete mobile cards, URL-driven filters, cursor navigation, and detail definition lists. Coordinate links appear only after range validation.

## Tower map pattern

Geographic master-data views use query-preserving List/Map switching, bounded summaries and warnings, stacked responsive filters, at least 28rem mobile map height, clustered markers, safe detail popups, fitted/reset viewport behavior, textual empty/error alternatives, and a complete List View for non-map access.
## Tower import workflow

Use the six explicit steps, desktop table/mobile cards, textual statuses, bounded pagination, error download, explicit all-or-nothing confirmation, disabled pending actions, and announced validation/completion summaries implemented by Phase 8F.
## Tower history timeline

Use a list-based newest-first timeline with textual action/source labels, explicit old/new values, keyboard-native disclosure controls, page-local truthful summaries, compact filters, cursor pagination, and the pre-audit empty-state explanation.
