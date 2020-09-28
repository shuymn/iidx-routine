export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class CookieNotFoundError extends ApplicationError {
  constructor() {
    super("cookie does not found");
  }
}

export class CookieExpiredError extends ApplicationError {
  constructor() {
    super("cookie already has been expred");
  }
}
