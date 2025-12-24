import { AppDataSource } from "../../data-source";
import { Post } from "../Entity/Post";
import { Repository } from "typeorm";

export class PostRepository extends Repository<Post> {
    constructor() {
        super(Post, AppDataSource.manager);
    }

    /**
     * Exemple de méthode personnalisée style Symfony
     * @param id 
     */
    async findOneById(id: number): Promise<Post | null> {
        return this.findOneBy({ id: id as any });
    }
}

export const PostRepo = new PostRepository();