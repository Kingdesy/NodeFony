import { Service } from '../../framework/Container/Decorators';
import { Product } from '../Entity/Product';
import { EntityManager, Repository } from 'typeorm';

@Service()
export class ProductRepository {
    private repository: Repository<Product>;

    constructor(private em: EntityManager) {
        this.repository = this.em.getRepository(Product);
    }

    async findAll(): Promise<Product[]> {
        return await this.repository.find();
    }
}