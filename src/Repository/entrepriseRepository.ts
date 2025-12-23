import { Service } from '../../framework/Container/Decorators';
import { entreprise } from '../Entity/entreprise';
import { EntityManager, Repository } from 'typeorm';

@Service()
export class entrepriseRepository {
    private repository: Repository<entreprise>;

    constructor(private em: EntityManager) {
        this.repository = this.em.getRepository(entreprise);
    }

    async findAll(): Promise<entreprise[]> {
        return await this.repository.find();
    }
}