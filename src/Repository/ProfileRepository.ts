import { AppDataSource } from "../../data-source";
import { Profile } from "../Entity/Profile";
import { Repository } from "typeorm";

export class ProfileRepository extends Repository<Profile> {
    constructor() {
        super(Profile, AppDataSource.manager);
    }

    /**
     * Exemple de méthode personnalisée style Symfony
     * @param id 
     */
    async findOneById(id: number): Promise<Profile | null> {
        return this.findOneBy({ id: id as any });
    }
}

export const ProfileRepo = new ProfileRepository();