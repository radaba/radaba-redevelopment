export const SYSTEM_SETTING_SECTIONS=Object.freeze(["general","assignment","security","uploads","notifications","reports","maintenance","integrations","history"]);
export const SYSTEM_SETTING_SECRET_KEYS=Object.freeze(["firebase_service_account","firebase_api_key","database_url","storage_download_token"]);
const setting=(key,section,label,value,classification,management,extra={})=>Object.freeze({key,section,label,value,classification,editable:false,management,requiresRestart:classification==="deployment",highRisk:Boolean(extra.highRisk),mobileCompatibility:extra.mobileCompatibility??"No mobile contract change.",description:extra.description??"",status:extra.status??null});
export function buildSystemSettingsCatalog(input={}){const environment=["development","test","production"].includes(input.environment)?input.environment:"unknown";return Object.freeze([
 setting("application_name","general","Application display name","Radaba","deployment","Requires code change.",{description:"Shared application and navigation label."}),
 setting("default_timezone","general","Operational timezone","Asia/Jakarta","deployment","Requires coordinated code deployment.",{description:"Assignment dates and export filenames use this zone. Historical timestamps are unchanged.",mobileCompatibility:"Coordinate with Android before changing display conventions."}),
 setting("date_formats","general","Date formatting","ISO dates with en-CA/en-GB displays","read_only","Current code behavior.",{description:"Formatting is currently distributed across features."}),
 setting("runtime_settings_storage","general","Runtime settings storage","Not configured","read_only","No approved RTDB settings root.",{status:"unavailable"}),
 setting("assignment_lifecycle","assignment","Assignment lifecycle policy","Code-enforced","read_only","Requires reviewed code change.",{highRisk:true,description:"Completion, revisit, state transition, and duplicate behavior remain protected.",mobileCompatibility:"Shared with Android operational behavior; do not change independently."}),
 setting("assignment_dashboard_limit","assignment","Dashboard bounded limit","5,000 records","deployment","Requires code deployment."),
 setting("assignment_export_limit","assignment","Assignment export limit","5,000 rows","deployment","Requires code deployment."),
 setting("session_duration","security","Web session duration","7 days","deployment","Requires code deployment.",{highRisk:true}),
 setting("inactive_login","security","Inactive-user login denial","Always enforced","read_only","Always enabled for security.",{highRisk:true}),
 setting("administrator_protection","security","Final-administrator protection","Always enforced","read_only","Always enabled for security.",{highRisk:true}),
 setting("firebase_password_policy","security","Password policy","Managed by Firebase","read_only","Managed outside this application.",{highRisk:true}),
 setting("profile_photo","uploads","Profile photos","5 MiB; JPEG, PNG, WebP","deployment","Requires coordinated code deployment.",{mobileCompatibility:"Web profile-photo contract; verify other clients before changing."}),
 setting("assignment_evidence","uploads","Assignment evidence photos","10 MiB each; 10 per batch; JPEG, PNG, WebP","deployment","Requires coordinated code deployment.",{mobileCompatibility:"Operational upload rules must remain compatible with Android."}),
 setting("assignment_import","uploads","Assignment CSV import","1 MiB; 200 rows","deployment","Requires code deployment."),
 setting("tower_import","uploads","Tower CSV preview","1 MiB; 200 rows","deployment","Requires code deployment."),
 setting("notification_channels","notifications","Delivery channels","In-app only","read_only","External email and push are not implemented."),
 setting("notification_events","notifications","Operational notification events","Available","read_only","Assignment, Tower, and administration producers are code-controlled.",{mobileCompatibility:"Does not alter mobile notification behavior."}),
 setting("notification_preferences","notifications","Per-user notification preferences","Not configured","read_only","Future personal preference feature.",{status:"unavailable"}),
 setting("reports_format","reports","Report export format","CSV with UTF-8 BOM","read_only","Current supported format."),
 setting("reports_preview_limit","reports","Reports Center preview limit","75 rows","deployment","Requires code deployment."),
 setting("reports_export_limit","reports","Reports Center export limit","500 rows","deployment","Requires code deployment."),
 setting("spreadsheet_protection","reports","Formula-injection protection","Always enabled","read_only","Always enabled for security.",{highRisk:true}),
 setting("report_redaction","reports","Sensitive-field redaction","Always enabled","read_only","Always enabled for security.",{highRisk:true}),
 setting("maintenance_mode","maintenance","Maintenance mode","Not configured","read_only","No approved lifecycle field or enforcement path.",{highRisk:true,status:"unavailable",mobileCompatibility:"A future design must include Android/mobile API behavior."}),
 setting("read_only_mode","maintenance","Application read-only mode","Not configured","read_only","No approved enforcement mechanism.",{status:"unavailable"}),
 setting("feature_global_search","integrations","Global Search","Available","read_only","Feature is deployed.",{status:"connected"}),
 setting("feature_notifications","integrations","Notification Center","Available","read_only","Feature is deployed.",{status:"connected"}),
 setting("feature_reports_center","integrations","Reports Center","Available","read_only","Feature is deployed.",{status:"connected"}),
 setting("feature_assignment_timeline","integrations","Assignment Timeline","Available","read_only","Feature is deployed.",{status:"connected"}),
 setting("feature_granular_privileges","integrations","Granular privileges","Available","read_only","Server authorization remains authoritative.",{status:"connected"}),
 setting("feature_tower_import","integrations","Tower import","Available to authorized administrators","read_only","Feature is deployed.",{status:"connected"}),
 setting("feature_assignment_maintenance","integrations","Assignment maintenance","Available to authorized administrators","read_only","Feature is deployed.",{status:"connected"}),
 setting("firebase_auth","integrations","Firebase Authentication",input.authConfigured?"Configured":"Not configured","read_only","Deployment configuration.",{status:input.authConfigured?"connected":"unavailable"}),
 setting("firebase_database","integrations","Realtime Database",input.databaseConfigured?"Configured":"Not configured","read_only","Deployment configuration; endpoint is never displayed.",{status:input.databaseConfigured?"connected":"unavailable"}),
 setting("firebase_storage","integrations","Firebase Storage",input.storageConfigured?"Configured":"Not configured","read_only","Deployment configuration; bucket is never displayed.",{status:input.storageConfigured?"connected":"unavailable"}),
 setting("environment","integrations","Environment",environment[0].toUpperCase()+environment.slice(1),"read_only","Deployment environment."),
 setting("application_version","integrations","Application version",String(input.version??"Unavailable"),"read_only","Build metadata."),
 setting("mobile_api_security","integrations","Mobile API security mode",String(input.mobileSecurityMode??"legacy-compatible"),"deployment","Requires deployment and separate production approval.",{highRisk:true,mobileCompatibility:"Directly affects Android/mobile API compatibility."}),
 setting("settings_history","history","Settings change history","No runtime settings changes","read_only","No settings writer exists; Administrator Audit Center remains available.")
]);}
export const visibleSystemSettings=catalog=>catalog.filter(item=>!SYSTEM_SETTING_SECRET_KEYS.includes(item.key));
export const groupSystemSettings=catalog=>SYSTEM_SETTING_SECTIONS.map(section=>({section,items:catalog.filter(item=>item.section===section)}));
export function validateSystemSettingChange(){return{ok:false,code:"setting_not_editable"}}
