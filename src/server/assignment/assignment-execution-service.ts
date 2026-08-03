import { isCompletedAssignment, jakartaParts } from "@/features/assignment/assignment-command-contract";
import { canEditAssignmentExecution, type AssignmentChecklistUpdate, type AssignmentExecutionActor, type AssignmentWorkReportUpdate } from "@/features/assignment/assignment-execution-contract";
import type { AssignmentCommandRepository } from "./assignment-command-repository";
import { AssignmentCommandError } from "./assignment-command-errors";
export class AssignmentExecutionService {
  constructor(private readonly repo: AssignmentCommandRepository, private readonly now = () => new Date()) {}
  private async resolve(id: string, actor: AssignmentExecutionActor) {
    const assignmentId=id.trim(); if(!assignmentId) throw new AssignmentCommandError("invalid-input","Assignment ID is required.");
    const found=await this.repo.findByAssignmentId(assignmentId); if(found.length!==1) throw new AssignmentCommandError(found.length?"stale-record":"assignment-not-found",found.length?"Assignment identity is ambiguous.":"Assignment was not found.");
    if(isCompletedAssignment(found[0].value)) throw new AssignmentCommandError("ASSIGNMENT_COMPLETED","Completed Assignment work execution is read-only. Revisit the Assignment before editing.");
    if(!canEditAssignmentExecution(found[0].value,actor)) throw new AssignmentCommandError("permission-denied","Only the assigned Rigger, Coordinator, or administrator may edit work execution while this Assignment is active.");
    return found[0];
  }
  private result(outcome: "updated"|"completed"|"permission-denied"|"stale-revision"|"missing") {
    if(outcome==="completed") throw new AssignmentCommandError("ASSIGNMENT_COMPLETED","Completed Assignment work execution is read-only. Revisit the Assignment before editing.");
    if(outcome==="permission-denied") throw new AssignmentCommandError("permission-denied","You no longer have permission to edit this Assignment.");
    if(outcome==="stale-revision") throw new AssignmentCommandError("stale-record","This work execution section changed. Refresh before saving again.");
    if(outcome==="missing") throw new AssignmentCommandError("assignment-not-found","Assignment was not found.");
  }
  async updateChecklist(id:string,input:AssignmentChecklistUpdate,actor:AssignmentExecutionActor){const found=await this.resolve(id,actor);this.result(await this.repo.updateChecklist(found.key,input,actor,jakartaParts(this.now()).datetime));return{assignmentId:id,revision:input.expectedRevision+1};}
  async updateWorkReport(id:string,input:AssignmentWorkReportUpdate,actor:AssignmentExecutionActor){const found=await this.resolve(id,actor);this.result(await this.repo.updateWorkReport(found.key,input,actor,jakartaParts(this.now()).datetime));return{assignmentId:id,revision:input.expectedRevision+1};}
}