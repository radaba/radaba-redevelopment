# R20 Authorization

Current proven policy:

- Active exact `/assignment` users: Tower view/workspace access.
- Strict administrator: Tower create, edit, and import.
- Coordinator: no proven Tower mutation permission.
- Rigger: no Tower mutation permission.
- Inactive user: denied.

Future update/archive/delete must remain strict-administrator-only until an existing narrower scope is proven. Every write must resolve the user and active status server-side; browser Firebase and client-selected paths are forbidden.
