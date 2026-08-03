const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=(value,limit)=>typeof value==="string"?value.trim().slice(0,limit):"";
export function validateUserInvitation(input,roles){
 const value={name:clean(input?.name,120),email:clean(input?.email,254).toLowerCase(),role:clean(input?.role,100),company:clean(input?.company,120),department:clean(input?.department,120),region:clean(input?.region,120),phone:clean(input?.phone,40)};
 const errors={};
 if(!value.name)errors.name="Name is required.";
 if(!value.email)errors.email="Email is required.";else if(!EMAIL.test(value.email))errors.email="Enter a valid email address.";
 if(!value.role)errors.role="Initial role is required.";else if(!roles.includes(value.role))errors.role="Select a supported role.";
 if(!value.company)errors.company="Company is required.";
 if(!value.department)errors.department="Department is required.";
 if(!value.region)errors.region="Region is required.";
 return Object.keys(errors).length?{success:false,errors}:{success:true,value};
}
