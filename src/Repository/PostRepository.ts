import { Service } from '../../framework/Container/Decorators';
import { Post } from '../Entity/Post';
import { EntityManager, Repository } from 'typeorm';

@Service()
export class PostRepository {
    private repository: Repository<Post>;

    constructor(private em: EntityManager) {
        this.repository = this.em.getRepository(Post);
    }

    async findAll(): Promise<Post[]> {
        return await this.repository.find();
    }
}