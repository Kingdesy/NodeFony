import { Service } from '../../framework/Container/Decorators';
import { messages } from '../Entity/messages';
import { EntityManager, Repository } from 'typeorm';

@Service()
export class messagesRepository {
    private repository: Repository<messages>;

    constructor(private em: EntityManager) {
        this.repository = this.em.getRepository(messages);
    }

    async findAll(): Promise<messages[]> {
        return await this.repository.find();
    }
}