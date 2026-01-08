import { AppDataSource } from "../../data-source";
import { User } from "../Entity/User";

const getRepo = () => AppDataSource.getRepository(User);

export const UserRepo: any = new Proxy({}, {
    get(target, prop) {
        return (getRepo() as any)[prop];
    }
});