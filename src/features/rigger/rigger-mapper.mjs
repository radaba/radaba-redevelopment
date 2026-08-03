const text=(value)=>value===null||value===undefined?null:["string","number","boolean"].includes(typeof value)?String(value):null;
export const isRiggerRecord=(raw)=>String(raw?.position??"").trim().toLowerCase()==="rigger";
export function mapRigger(firebaseKey,raw={}){
  return {firebaseKey:String(firebaseKey),uid:text(raw.uid),name:text(raw.name),email:text(raw.email)?.trim().toLowerCase()??null,
    phone:text(raw.phone),role:text(raw.role),position:text(raw.position),status:text(raw.status),company:text(raw.company),
    department:text(raw.department),region:text(raw.region),subRegion:text(raw.sub_region),officeLocation:text(raw.office_location),
    type:text(raw.type),joinDate:text(raw.join_date),createDate:text(raw.create_date??raw.created_date),
    createDateTime:text(raw.create_datetime)};
}
export const riggerInitials=(rigger)=>String(rigger.name??rigger.email??"?").trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()??"").join("")||"?";

