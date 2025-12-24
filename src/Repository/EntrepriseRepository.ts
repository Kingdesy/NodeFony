import { AppDataSource } from "../../data-source";
import { Entreprise } from "../Entity/Entreprise";
import { Repository } from "typeorm";

export class EntrepriseRepository extends Repository<Entreprise> {
    constructor() {
        super(Entreprise, AppDataSource.manager);
    }

    /**
     * Exemple de méthode personnalisée style Symfony
     * @param id 
     */
    async findOneById(id: number): Promise<Entreprise | null> {
        return this.findOneBy({ id: id as any });
    }
}

export const EntrepriseRepo = new EntrepriseRepository();