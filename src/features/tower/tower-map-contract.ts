import type {Tower} from "./tower-types";
import * as runtime from "./tower-map-contract.mjs";
export interface TowerNetworkTechnology{known:boolean;sectors:number|null}
export interface TowerMapMarker{towerKey:string;towerId:string;siteId:string;siteName:string;latitude:number;longitude:number;region:string;subRegion:string;kabupaten:string;cluster:string;siteType:string;btsType:string;network:Record<"gsm"|"umts"|"lte",TowerNetworkTechnology>}
export interface TowerInvalidCoordinate{towerKey:string;towerId:string;siteId:string;siteName:string;reason:string}
export interface TowerMapData{markers:TowerMapMarker[];invalidCoordinates:TowerInvalidCoordinate[];scanned:number;excludedInvalidCoordinates:number;boundedResult:boolean}
export interface TowerMapFilters{q?:string;region?:string;subRegion?:string;siteType?:string;technology?:string;coordinates?:string}
export const TOWER_MAP_MAX_RECORDS=runtime.TOWER_MAP_MAX_RECORDS as 1000;
export const TOWER_MAP_DEFAULT_CENTER=runtime.TOWER_MAP_DEFAULT_CENTER as unknown as readonly[number,number];
export const TOWER_MAP_DEFAULT_ZOOM=runtime.TOWER_MAP_DEFAULT_ZOOM as 4;
export const parseTowerCoordinates=runtime.parseTowerCoordinates as(tower:Partial<Tower>)=>{valid:boolean;latitude:number|null;longitude:number|null;reason:string|null};
export const towerNetworkSummary=runtime.towerNetworkSummary as(tower:Tower)=>Record<"gsm"|"umts"|"lte",TowerNetworkTechnology>;
export const serializeTowerMapMarker=runtime.serializeTowerMapMarker as(tower:Tower)=>TowerMapMarker|null;
export const buildTowerMapData=runtime.buildTowerMapData as(towers:Tower[],boundedResult?:boolean)=>TowerMapData;
export const filterTowerMapData=runtime.filterTowerMapData as(data:TowerMapData,filters:TowerMapFilters)=>TowerMapData;