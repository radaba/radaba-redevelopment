const loginErrors = Object.freeze({
  "auth/wrong-password": "The password that you have entered is incorrect",
  "auth/user-disabled": "The password that you have entered is disabled",
  "auth/user-not-found": "The email that you have entered is not registered",
  "auth/invalid-email": "The email that you have entered is invalid",
  "auth/missing-email": "The email is empty, please type your email id",
});
const resetErrors = Object.freeze({
  "auth/user-not-found": "The email that you have entered is not registered",
  "auth/invalid-email": "The email that you have entered is invalid",
  "auth/email-already-exists": "The email that you have entered is already exist",
  "auth/invalid-phone-number": "The phone number that you have entered is invalid",
  "auth/missing-email": "The email that you have entered is missing",
  "auth/phone-number-already-exists": "The phone number that you have entered is already exist",
});
export const mapLoginError = (code) => loginErrors[code] ?? null;
export const mapResetError = (code) => resetErrors[code] ?? null;

export function createMobileSigninService({ authentication, repository, clock }) {
  return { async signIn({ email, password, browser, ipAddress }) {
    const { token } = await authentication.signIn(email, password);
    const users = await repository.findUsersByEmail(email.toLowerCase());
    const user = users[0];
    const privileges = await repository.listPrivileges();
    const menu = ["Operation", "Dashboard", "Administration"].map((category) => ({ children: privileges.filter((p) => String(p.privilege_id).slice(0, 7) !== "default" && p[user.role] === true && p.category === category).map((p) => ({ icon: p.icon, path: p.path, title: p.page_name })), icon: "Icon", title: category }));
    const { date, datetime } = clock();
    const data = { ...user, privilege: menu };
    const log = { type: "login", platform: "web", browser, ip_address: ipAddress, date, datetime, name: user.name, email: user.email, region: user.region, sub_region: user.sub_region, position: user.position };
    repository.writeLoginLog(log).catch(() => {});
    return { data, token };
  } };
}
export const createMobileResetPasswordService = (authentication) => ({ send: (email) => authentication.sendPasswordReset(email) });
export const createMobileProfileService = (repository) => ({ async update(email, body) { await repository.updateUsersByEmail(email, body); return body; } });
