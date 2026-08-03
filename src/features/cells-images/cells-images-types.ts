export type SourceRecordType = "tower" | "cell";
export type DataQuality = "complete" | "missing-name" | "missing-url";
export interface SourceRecord { [key: string]: unknown }
export interface CellRecord extends SourceRecord {
  databaseKey: string;
}
export interface TowerVisitRecord extends SourceRecord {
  databaseKey: string;
}
export interface NormalizedImageReference {
  id: string;
  sourceRecordType: SourceRecordType;
  sourceRecordKey: string;
  fieldKey: string;
  nameField: string;
  urlField: string;
  fileName: string | null;
  url: string | null;
  category: string;
  categoryKnown: boolean;
  assignmentId: string | null;
  towerId: string | null;
  siteName: string | null;
  cellKey: string | null;
  rcellId: string | null;
  sector: string | null;
  band: string | null;
  riggerName: string | null;
  riggerEmail: string | null;
  submittedAt: string | null;
  dataQuality: DataQuality;
}
export type TowerImageReference = NormalizedImageReference & { sourceRecordType: "tower" };
export type CellImageReference = NormalizedImageReference & { sourceRecordType: "cell" };
