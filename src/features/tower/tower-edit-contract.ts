import type {RawTowerRecord,TowerScalar} from "./tower-types";
import * as runtime from "./tower-edit-contract.mjs";
export const TOWER_EDIT_FIELDS=runtime.TOWER_EDIT_FIELDS as readonly string[];
export const prepareTowerEdit=(current:RawTowerRecord,input:unknown)=>runtime.prepareTowerEdit(current,input) as {updates:Record<string,TowerScalar>;record:RawTowerRecord};
