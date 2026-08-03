const requiredText=new Set(["sitename","region","new_cluster_name"]);
const textFields=["sitename","region","new_cluster_name","site_id","site_type","sub_region","province","kabupaten","kecamatan","roh_cluster","bts_type","enodeb_id","ne_name","antenna_type","antenna_system","txrxmode"];
const numberFields={latitude:[-90,90,true],longitude:[-180,180,true],g900:[0,999,false],g1800:[0,999,false],u850:[0,999,false],u900:[0,999,false],u2100:[0,999,false],l850:[0,999,false],l900:[0,999,false],l1800:[0,999,false],l2100:[0,999,false],l2300:[0,999,false]};
const integerFields=new Set(["g900","g1800","u850","u900","u2100","l850","l900","l1800","l2100","l2300"]);
export const TOWER_EDIT_FIELDS=[...textFields,...Object.keys(numberFields)];
const label=key=>({sitename:"Site Name",site_id:"Site ID",new_cluster_name:"Cluster",latitude:"Latitude",longitude:"Longitude"}[key]??key.replaceAll("_"," "));
export function prepareTowerEdit(current,input){
 if(!current||typeof current!=="object"||Array.isArray(current))throw new Error("Stored Tower record is invalid.");
 if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Tower payload is required.");
 if(Object.hasOwn(input,"tower_id"))throw new Error("Tower ID is immutable.");
 for(const key of Object.keys(input))if(!TOWER_EDIT_FIELDS.includes(key))throw new Error("Unknown Tower field.");
 const next={...current},updates={};
 for(const [key,raw] of Object.entries(input)){
  let value;
  if(textFields.includes(key)){value=String(raw??"").trim();if(value.length>200)throw new Error(`${label(key)} is too long.`);if(!value&&requiredText.has(key))throw new Error(`${label(key)} is required.`);value=value||null}
  else {const [min,max,required]=numberFields[key];if(raw===""||raw===null||raw===undefined){if(required)throw new Error(`${label(key)} is required.`);value=null}else{value=Number(raw);if(!Number.isFinite(value)||value<min||value>max||(integerFields.has(key)&&!Number.isInteger(value)))throw new Error(`${label(key)} is invalid.`)}}
  const old=Object.hasOwn(current,key)?current[key]:null;if(old!==value){updates[key]=value;if(value===null)delete next[key];else next[key]=value}
 }
 for(const key of requiredText)if(!String(next[key]??"").trim())throw new Error(`${label(key)} is required.`);
 for(const key of ["latitude","longitude"]){const [min,max]=numberFields[key],value=Number(next[key]);if(next[key]===null||next[key]===undefined||next[key]===""||!Number.isFinite(value)||value<min||value>max)throw new Error(`${label(key)} is invalid.`)}
 return{updates,record:next};
}
