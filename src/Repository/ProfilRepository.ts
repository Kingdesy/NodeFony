import { Service } from '../../framework/Container/Decorators';
import { Profil } from '../Entity/Profil';
import { EntityManager, Repository } from 'typeorm';

@Service()
export class ProfilRepository {
    private repository: Repository<Profil>;

    constructor(private em: EntityManager) {
        this.repository = this.em.getRepository(Profil);
    }

    async findAll(): Promise<Profil[]> {
        return await this.repository.find();
    }
}