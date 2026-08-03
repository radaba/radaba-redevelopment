import { isTerminalAssignment } from "@/features/assignment/assignment-command-contract";
import type { AssignmentListItem } from "@/features/assignment/assignment-types";
import type { RiggerDetailData,RiggerListItem,RiggerListResult } from "@/features/rigger/rigger-types";
import type { RiggerListQuery } from "@/features/rigger/rigger-query-contract";
import type { AssignmentReadRepository } from "@/server/assignment/assignment-repository";
import type { RiggerReadRepository } from "./rigger-repository";
const email=(value:string|null)=>String(value??"").trim().toLowerCase();
const recent=(rows:AssignmentListItem[])=>[...rows].sort((a,b)=>String(b.created_datetime??"").localeCompare(String(a.created_datetime??""))||b.key.localeCompare(a.key));
export class RiggerService {
  constructor(private readonly riggers:RiggerReadRepository,private readonly assignments:AssignmentReadRepository){}
  async list(query:RiggerListQuery):Promise<RiggerListResult>{
    const [result,window]=await Promise.all([this.riggers.list(query),this.assignments.readBoundedRiggerWindow()]);
    const grouped=new Map<string,AssignmentListItem[]>();for(const row of window.rows){const key=email(row.rigger_email);if(!key)continue;grouped.set(key,[...(grouped.get(key)??[]),row])}
    const rows:RiggerListItem[]=result.rows.map(rigger=>{const related=recent(grouped.get(email(rigger.email))??[]);return {...rigger,workload:{activeAssignments:related.filter(row=>!isTerminalAssignment({assignment_state:row.assignment_state})).length,latestAssignment:related[0]??null}}});
    return {...result,rows,workloadWindowBounded:window.exceededLimit};
  }
  async detail(key:string):Promise<RiggerDetailData|null>{
    const rigger=await this.riggers.findByKey(key);if(!rigger)return null;
    if(!rigger.name||!rigger.email)return {rigger,assignments:[],assignmentsFailed:false,assignmentWindowBounded:false};
    try{const result=await this.assignments.findRecentByRiggerIdentity({name:rigger.name,email:rigger.email});return {rigger,assignments:result.rows,assignmentsFailed:false,assignmentWindowBounded:result.exceededLimit}}
    catch{return {rigger,assignments:[],assignmentsFailed:true,assignmentWindowBounded:false}}
  }
}

