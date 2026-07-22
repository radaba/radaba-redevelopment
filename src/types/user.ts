import type { Menu } from "./menu";
import type { Session } from "./session";

export interface User extends Session {
  company?: string;
  create_date?: string;
  department?: string;
  disabled?: boolean;
  email: string;
  email_huawei?: string;
  email_partner?: string;
  email_verified?: boolean;
  ic_number?: number;
  join_date?: string;
  latitude?: string;
  level_po?: string;
  longitude?: string;
  mateline_id?: string;
  name: string;
  office_location?: string;
  phone?: string;
  position?: string;
  region?: string;
  role: string;
  sam_ows?: string;
  status?: string;
  sub_region?: string;
  supervisor_l1?: string;
  supervisor_l2?: string;
  supervisor_l3?: string;
  type?: string;
  uid: string;
  uniportal_account?: string;
  wah_rigger?: string;
  privilege?: Menu[];
  session_id?: string;
}
