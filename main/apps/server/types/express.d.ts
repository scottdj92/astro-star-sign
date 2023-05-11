import { Db } from "mongodb";

declare module Express {
    export interface Request {
        db?: Db
    }
}
