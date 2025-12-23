import { Service } from '../../framework/Container/Decorators';
import { Profile } from '../Entity/Profile';
import { EntityManager, Repository } from 'typeorm';

@Service()
export class ProfileRepository {
    private repository: Repository<Profile>;

    constructor(private em: EntityManager) {
        this.repository = this.em.getRepository(Profile);
    }

    async findAll(): Promise<Profile[]> {
        return await this.repository.find();
    }
}