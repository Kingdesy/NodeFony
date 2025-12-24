import { AppDataSource } from "../../data-source";
import { User } from "../Entity/User";
import { Repository } from "typeorm";

export class UserRepository extends Repository<User> {
    constructor() {
        super(User, AppDataSource.manager);
    }

    /**
     * Exemple de méthode personnalisée style Symfony
     * @param id 
     */
    async findOneById(id: number): Promise<User | null> {
        return this.findOneBy({ id: id as any });
    }
}

export const UserRepo = new UserRepository();