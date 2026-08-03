import type { Tower } from "./tower-types";
import * as runtime from "./tower-transfer-contract.mjs";
export const TOWER_TRANSFER_HEADERS=runtime.TOWER_TRANSFER_HEADERS as readonly string[];
export const TOWER_PREVIEW_MAX_BYTES=runtime.TOWER_PREVIEW_MAX_BYTES as number;
export const TOWER_PREVIEW_MAX_ROWS=runtime.TOWER_PREVIEW_MAX_ROWS as number;
export const TOWER_MATCH_SCAN_LIMIT=runtime.TOWER_MATCH_SCAN_LIMIT as number;
export const TOWER_EXPORT_MAX_ROWS=runtime.TOWER_EXPORT_MAX_ROWS as number;
export const TOWER_NULL_TOKEN=runtime.TOWER_NULL_TOKEN as string;
export const TowerTransferError=runtime.TowerTransferError as typeof runtime.TowerTransferError;
export interface ParsedTransfer {headers:string[];rows:{rowNumber:number;values:Record<string,string>}[]}
export interface PreviewMessage {severity:"error"|"warning";field:string;code:string;message:string}
export interface PreviewDifference {field:string;currentValue:unknown;proposedValue:unknown}
export interface PreviewRow {rowNumber:number;towerId:string;classification:"new"|"changed"|"unchanged"|"duplicate"|"ambiguous"|"invalid";messages:PreviewMessage[];differences:PreviewDifference[];original:Record<string,string>;matched:{firebaseKey:string;towerId:string}|null}
export interface TowerPreview {totalRows:number;validRows:number;invalidRows:number;newTowers:number;changedTowers:number;unchangedTowers:number;ambiguousMatches:number;duplicateRows:number;warningCount:number;totalChangedFields:number;rows:PreviewRow[]}
export const parseTransferCsv=runtime.parseTransferCsv as (input:string)=>ParsedTransfer;
export const previewTowerRows=runtime.previewTowerRows as (parsed:ParsedTransfer,existing:{key:string;record:Record<string,unknown>}[])=>TowerPreview;
export const towerExportCsv=runtime.towerExportCsv as (towers:Tower[])=>string;
export const towerValidationCsv=runtime.towerValidationCsv as (rows:PreviewRow[])=>string;
export interface TowerImportResultRow {rowNumber:number;towerId:string;firebaseKey:string|null;result:"created"|"updated"|"unchanged"|"blocked"|"conflict"|"failed";changedFields:string[];errorCode:string|null;message:string}
export const towerImportResultCsv=runtime.towerImportResultCsv as (rows:TowerImportResultRow[])=>string;
export const escapeSpreadsheetValue=runtime.escapeSpreadsheetValue as (value:unknown)=>string;

export const encodeCsv=runtime.encodeCsv as (headers:readonly string[],rows:unknown[][])=>string;
