import { SessionUser } from '../session/session.service';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export {};
