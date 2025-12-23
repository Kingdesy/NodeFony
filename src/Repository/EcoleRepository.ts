import { Service } from '../../framework/Container/Decorators';
import { Ecole } from '../Entity/Ecole';
import { EntityManager, Repository } from 'typeorm';

@Service()
export class EcoleRepository {
    private repository: Repository<Ecole>;

    constructor(private em: EntityManager) {
        this.repository = this.em.getRepository(Ecole);
    }

    async findAll(): Promise<Ecole[]> {
        return await this.repository.find();
    }
}