# Relationship graph

```mermaid
erDiagram
  TOWER ||--o{ ASSIGNMENT : "tower_id snapshot"
  ASSIGNMENT ||--o{ CELL : "assignment_id"
  ASSIGNMENT ||--o| IMAGE : "assignment_id aggregate"
  ASSIGNMENT ||--o{ ASSIGNMENT_PHOTO : "assignment push key"
  ASSIGNMENT ||--o{ REPORT : "embedded report fields"
  TOWER ||--o{ TOWER_AUDIT : "tower push key"
  USER ||--o{ ASSIGNMENT : "rigger/coordinator/RNO fields"
```

These are logical relationships only; RTDB enforces no foreign keys. Tower/Assignment/Cell relationships use business child fields, while audit/photo nesting uses Firebase push keys. Embedded image relationships are dynamic field-name and metadata based.
