import { ASSIGNMENT_IMPORT_MAX_BYTES, ASSIGNMENT_IMPORT_MIME_TYPES, AssignmentCsvError, parseAssignmentCsv } from "@/features/assignment/assignment-import-contract";
import { AssignmentCommandError } from "./assignment-command-errors";
export async function readAssignmentImport(request:Request){
  const form=await request.formData().catch(()=>null),file=form?.get("file");
  if(!(file instanceof File))throw new AssignmentCommandError("invalid-input","A CSV file is required.");
  if(!file.name.toLowerCase().endsWith(".csv"))throw new AssignmentCommandError("invalid-input","Only .csv files are supported.");
  if(!ASSIGNMENT_IMPORT_MIME_TYPES.includes(file.type))throw new AssignmentCommandError("invalid-input","Unsupported CSV MIME type.");
  if(file.size>ASSIGNMENT_IMPORT_MAX_BYTES)throw new AssignmentCommandError("import-file-too-large","CSV exceeds the 1 MiB limit.");
  let text:string;try{text=new TextDecoder("utf-8",{fatal:true}).decode(await file.arrayBuffer());}catch{throw new AssignmentCommandError("invalid-input","CSV must be valid UTF-8.");}
  try{return {filename:file.name,rows:parseAssignmentCsv(text)};}catch(error){if(error instanceof AssignmentCsvError)throw new AssignmentCommandError(error.code==="row-limit"?"import-file-too-large":"invalid-input",error.message);throw error;}
}
