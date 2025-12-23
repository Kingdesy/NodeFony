import { Service } from '../../framework/Container/Decorators';
import { Posts } from '../Entity/Posts';
import { EntityManager, Repository } from 'typeorm';

@Service()
export class PostsRepository {
    private repository: Repository<Posts>;

    constructor(private em: EntityManager) {
        this.repository = this.em.getRepository(Posts);
    }

    async findAll(): Promise<Posts[]> {
        return await this.repository.find();
    }

}