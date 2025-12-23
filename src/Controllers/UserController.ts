import { Controller, Get, Post } from '../../framework/Routing/Decorators';
import { Request } from '../../framework/Http/Request';
import { AbstractController } from '../../framework/Controller/AbstractController';
import { UserRepository } from '../Repository/UserRepository';
import { Service } from '../../framework/Container/Decorators';
import { User } from '../Entity/User';
// ...

@Controller('/users')
@Service()
export class UserController extends AbstractController {
    
    constructor(private userRepository: UserRepository) { super(); }

    @Get('/')
    async list() {
        return this.json(await this.userRepository.findAll());
    }

    @Post('/') // Création via POST
    async create(request: Request) {
        const data = await request.getPayload(); // On récupère le JSON envoyé
        
        const user = new User();
        user.firstName = data.firstName;
        user.lastName = data.lastName;

        await this.userRepository.save(user);

        return this.json(user, 201); // 201 Created
    }
}