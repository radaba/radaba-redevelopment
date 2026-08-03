import type { NormalizedImageReference, SourceRecord, SourceRecordType } from "./cells-images-types";
import * as implementation from "./embedded-image-contract.mjs";

export const parseImageField = implementation.parseImageField as (fieldKey: string) => {
  category: string; categoryKnown: boolean; sector: string | null; band: string | null;
};
export const createImageId = implementation.createImageId as (
  sourceRecordType: SourceRecordType, sourceRecordKey: string, fieldKey: string
) => string;
export const extractEmbeddedImages = implementation.extractEmbeddedImages as (input: {
  sourceRecordType: SourceRecordType; sourceRecordKey: string; record: SourceRecord;
}) => NormalizedImageReference[];
export const safeStorageContext = implementation.safeStorageContext as (url: string | null) => string | null;
