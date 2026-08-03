import * as runtime from "./administrator-audit-center.mjs";
export interface AdministratorAuditViewRecord {
  auditId: string;
  timestamp: string;
  administratorIdentifier: string;
  administratorEmail: string;
  action: string;
  resourceType: string;
  resourceIdentifier: string;
  summary: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  requestIdentifier: string;
  ipAddress: string | null;
  userAgent: string | null;
  malformed: boolean;
}
export type AdministratorAuditSearchParams = Record<string, string | string[] | undefined>;
export interface AdministratorAuditListItem {
  auditId: string;
  timestamp: string;
  action: string;
  actionLabel: string;
  resourceType: string;
  resourceIdentifier: string;
  administratorIdentifier: string;
  administratorEmail: string;
  summary: string;
  requestIdentifier: string;
  malformed: boolean;
}
export interface AdministratorAuditAppliedFilters {
  q: string;
  action: string;
  resourceType: string;
  administrator: string;
  dateFrom: string;
  dateTo: string;
  sort: string;
  direction: "asc" | "desc";
}
export interface AdministratorAuditFilterOptions {
  actions: string[];
  resourceTypes: string[];
  administrators: Array<{ uid: string | null; email: string | null; label: string }>;
}
export interface AdministratorAuditListDto {
  items: AdministratorAuditListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  appliedFilters: AdministratorAuditAppliedFilters;
  availableFilterOptions: AdministratorAuditFilterOptions;
}
export const mapAdministratorAuditRecord = runtime.mapAdministratorAuditRecord as (
  key: string,
  raw: unknown,
) => AdministratorAuditViewRecord;
export const buildAdministratorAuditList = runtime.buildAdministratorAuditList as (
  records: AdministratorAuditViewRecord[],
  query?: AdministratorAuditSearchParams,
) => AdministratorAuditListDto;
export const administratorAuditActionLabel = runtime.administratorAuditActionLabel as (
  action: string,
) => string;
export const compareAdministratorAuditSnapshots = runtime.compareAdministratorAuditSnapshots as (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) => Array<{
  key: string;
  before: unknown;
  after: unknown;
  state: "added" | "removed" | "changed" | "unchanged";
}>;
