import { Service } from '../../framework/Container/Decorators';
import { ecole } from '../Entity/ecole';
import { EntityManager, Repository } from 'typeorm';

@Service()
export class ecoleRepository {
    private repository: Repository<ecole>;

    constructor(private em: EntityManager) {
        this.repository = this.em.getRepository(ecole);
    }

    async findAll(): Promise<ecole[]> {
        return await this.repository.find();
    }
}