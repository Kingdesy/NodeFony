import { Service } from '../../framework/Container/Decorators';
import { User } from '../Entity/User';
import { EntityManager, Repository } from 'typeorm';

@Service()
export class UserRepository {
    private repository: Repository<User>;

    constructor(private em: EntityManager) {
        // L'EntityManager nous donne accès au repository spécifique
        this.repository = this.em.getRepository(User);
    }

    async findAll(): Promise<User[]> {
        return await this.repository.find();
    }

    async findOneById(id: number): Promise<User | null> {
        return await this.repository.findOneBy({ id });
    }

    async save(user: User): Promise<User> {
        return await this.repository.save(user);
    }
}