import "server-only";
import type { Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import type { RawTowerRecord } from "@/features/tower/tower-types";
import { TOWER_RTDB_PATH } from "./tower-repository";

export class TowerTransferRepository {
  constructor(private readonly database:Database=firebaseAdminDatabase){}
  async boundedEntries(limit:number){
    const snapshot=await this.database.ref(TOWER_RTDB_PATH).orderByKey().limitToFirst(limit+1).once("value");
    const entries:{key:string;record:RawTowerRecord}[]=[];
    snapshot.forEach(child=>{entries.push({key:child.key??"",record:child.val()??{}});});
    return {entries:entries.slice(0,limit),overflow:entries.length>limit};
  }
}
