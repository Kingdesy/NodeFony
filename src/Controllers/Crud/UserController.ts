import { Controller, Get, Post, Put, Delete } from '../../../framework/Routing/Decorators';
import { AbstractController } from '../../../framework/Controller/AbstractController';
import { UserRepo } from '../../Repository/UserRepository';
import { Request } from '../../../framework/Http/Request';

@Controller('/user')
export class UserController extends AbstractController {

    @Get('/')
    async index() {
        const data = await UserRepo.find();
        return this.json(data);
    }

    @Get('/{id}')
    async show(id: string) {
        const item = await UserRepo.findOneBy({ id: parseInt(id) } as any);
        return item ? this.json(item) : this.json({ error: "Not found" }, 404);
    }

    @Post('/')
    async create(request: Request) {
        const newItem = UserRepo.create(request.getBody());
        await UserRepo.save(newItem);
        return this.json(newItem, 201);
    }

    @Put('/{id}')
    async update(id: string, request: Request) {
        const item = await UserRepo.findOneBy({ id: parseInt(id) } as any);
        if (!item) return this.json({ error: "Not found" }, 404);
        
        UserRepo.merge(item, request.getBody());
        await UserRepo.save(item);
        return this.json(item);
    }

    @Delete('/{id}')
    async delete(id: string) {
        const item = await UserRepo.findOneBy({ id: parseInt(id) } as any);
        if (!item) return this.json({ error: "Not found" }, 404);
        
        await UserRepo.remove(item);
        return this.json({ message: "Deleted successfully" });
    }
}