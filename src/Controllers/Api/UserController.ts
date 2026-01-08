import { Controller, Get, Post, Put, Delete } from '../../../framework/Routing/Decorators';
import { AbstractController } from '../../../framework/Controller/AbstractController';
import { UserRepo } from '../../Repository/UserRepository';
import { Request } from '../../../framework/Http/Request';

@Controller('/api/user')
export class UserController extends AbstractController {

    /**
     * Liste tous les éléments avec leurs relations : ['posts']
     */
    @Get('/')
    async index() {
        const data = await UserRepo.find({
            relations: ['posts']
        });
        return this.json(data);
    }

    /**
     * Affiche un élément spécifique par son ID
     */
    @Get('/{id}')
    async show(id: string) {
        const item = await UserRepo.findOne({
            where: { id: parseInt(id) } as any,
            relations: ['posts']
        });

        if (!item) {
            return this.json({ error: "User not found" }, 404);
        }

        return this.json(item);
    }

    /**
     * Crée un nouvel élément et retourne l'objet complet avec relations
     */
    @Post('/')
    async create(request: Request) {
        try {
            const newItem = UserRepo.create(request.getBody());
            const savedItem = await UserRepo.save(newItem);

            const fullItem = await UserRepo.findOne({
                where: { id: (savedItem as any).id },
                relations: ['posts']
            });

            return this.json(fullItem, 201);
        } catch (error: any) {
            return this.json({ 
                error: "Could not create User", 
                details: error.message 
            }, 400);
        }
    }

    /**
     * Met à jour un élément
     */
    @Put('/{id}')
    async update(id: string, request: Request) {
        try {
            let item = await UserRepo.findOneBy({ id: parseInt(id) } as any);
            
            if (!item) return this.json({ error: "Not found" }, 404);

            UserRepo.merge(item, request.getBody());
            const updatedItem = await UserRepo.save(item);

            return this.json(updatedItem);
        } catch (error: any) {
            return this.json({ error: "Update failed" }, 400);
        }
    }

    /**
     * Supprime un élément
     */
    @Delete('/{id}')
    async delete(id: string) {
        const result = await UserRepo.delete(id);
        
        if (result.affected === 0) {
            return this.json({ error: "Not found or already deleted" }, 404);
        }

        return this.json({ message: "User deleted successfully" });
    }
}