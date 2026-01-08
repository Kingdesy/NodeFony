import { Controller, Get, Post, Put, Delete, UseMiddleware } from '../../../framework/Routing/Decorators';
import { AbstractController } from '../../../framework/Controller/AbstractController';
import { PostRepo } from '../../Repository/PostRepository';
import { Request } from '../../../framework/Http/Request';
import { AuthMiddleware } from '../../../framework/Http/Middleware/AuthMiddleware';
import { UserRepo } from '../../Repository/UserRepository';
import { User } from '../../Entity/User';
import { Post as PostEntity} from '../../Entity/Post';

@UseMiddleware(AuthMiddleware)
@Controller('/post')
export class PostController extends AbstractController {

    /**
     * Liste tous les posts avec leurs auteurs
     */
    @Get('/')
    async index() {
        const data = await PostRepo.find({
            relations: ['author']
        });
        return this.json(data);
    }

    /**
     * Affiche l'utilisateur connecté (Route fixe prioritaire)
     */
    @Get('/me')
    async getMe(request: Request) {
        const user = (request as any).req.user as User;
        return this.json({
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles
        });
    }

    /**
     * Affiche un post spécifique par son ID (Route dynamique)
     */
    @Get('/{id}')
    async show(request: Request) {
        const params = request.getParams();
        const id = parseInt(params.id);

        if (isNaN(id)) return this.json({ error: "Invalid ID" }, 400);

        const item = await PostRepo.findOne({
            where: { id: id },
            relations: ['author']
        });

        return item ? this.json(item) : this.json({ error: "Post not found" }, 404);
    }
/**
     * Crée un post en liant l'utilisateur connecté comme auteur
     */
    @Post('/')
    async create(request: Request) {
        try {
            // 1. Récupération de l'utilisateur (via le middleware)
            const currentUser = (request as any).req.user as User;

            // 2. Création de l'entité avec typage explicite <Post>
            // On utilise le body de la requête
            const newItem = PostRepo.create(request.getBody() as object) as PostEntity;
            
            // 3. LIAISON DE L'AUTEUR (Maintenant TypeScript ne râlera plus)
            newItem.author = currentUser;

            // 4. Sauvegarde
            const savedItem = await PostRepo.save(newItem);

            return this.json(savedItem, 201);
        } catch (error: any) {
            console.error("Erreur création post:", error);
            return this.json({ error: "Creation failed", details: error.message }, 400);
        }
    }

    /**
     * Met à jour un post
     */
    @Put('/{id}')
    async update(request: Request) {
        try {
            const id = parseInt(request.getParams().id);
            if (isNaN(id)) return this.json({ error: "Invalid ID" }, 400);

            let item = await PostRepo.findOneBy({ id });
            if (!item) return this.json({ error: "Not found" }, 404);

            PostRepo.merge(item, request.getBody());
            const updatedItem = await PostRepo.save(item);

            return this.json(updatedItem);
        } catch (error: any) {
            return this.json({ error: "Update failed" }, 400);
        }
    }

    /**
     * Supprime un post
     */
    @Delete('/{id}')
    async delete(request: Request) {
        const id = request.getParams().id;
        const result = await PostRepo.delete(id);
        
        return result.affected !== 0 
            ? this.json({ message: "Post deleted" }) 
            : this.json({ error: "Not found" }, 404);
    }
}