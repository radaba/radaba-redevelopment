import { TOWER_PREVIEW_MAX_BYTES, TowerTransferError, parseTransferCsv } from "@/features/tower/tower-transfer-contract";

const mimeTypes=new Set(["text/csv","application/vnd.ms-excel","application/csv",""]);
export async function readTowerPreviewFile(request:Request){
  const form=await request.formData().catch(()=>null),file=form?.get("file");
  if(!(file instanceof File))throw new TowerTransferError("invalid_file","A CSV file is required.");
  const name=file.name.toLowerCase();
  if(!name.endsWith(".csv"))throw new TowerTransferError("unsupported_extension","Only .csv files are supported.");
  if(!mimeTypes.has(file.type))throw new TowerTransferError("unsupported_mime","Unsupported CSV MIME type.");
  if(file.size===0)throw new TowerTransferError("empty_file","The CSV file is empty.");
  if(file.size>TOWER_PREVIEW_MAX_BYTES)throw new TowerTransferError("file_too_large","CSV exceeds the 1 MiB limit.");
  let text:string;
  try{text=new TextDecoder("utf-8",{fatal:true}).decode(await file.arrayBuffer())}
  catch{throw new TowerTransferError("invalid_encoding","CSV must be valid UTF-8.");}
  return {filename:file.name,parsed:parseTransferCsv(text)};
}
