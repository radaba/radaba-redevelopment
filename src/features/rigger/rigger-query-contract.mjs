export const RIGGER_PAGE_SIZES=[25,50,100];
export const RIGGER_SCAN_LIMIT=500;
const one=(value)=>Array.isArray(value)?value[0]:value;
const clean=(value,max=120)=>{const result=String(one(value)??"").trim();if(result.length>max)throw new Error("Invalid query.");return result};
export function parseRiggerQuery(input={}){
  const pageSize=Number(clean(input.pageSize)||25);if(!RIGGER_PAGE_SIZES.includes(pageSize))throw new Error("Invalid page size.");
  const cursor=clean(input.cursor,160);if(cursor&&!/^[A-Za-z0-9_-]+$/.test(cursor))throw new Error("Invalid cursor.");
  const status=clean(input.status);if(status&&!["Active","Not Active"].includes(status))throw new Error("Invalid status.");
  return {q:clean(input.q),status,company:clean(input.company),pageSize,cursor:cursor||null};
}

