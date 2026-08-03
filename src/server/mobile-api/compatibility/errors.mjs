export class MobileCompatibilityError extends Error {
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
  }
}

export class MobileCompatibilityFirebaseError extends MobileCompatibilityError {}
export class MobileCompatibilityAuthenticationError extends MobileCompatibilityError {}
