import { Controller, Get } from '../../framework/Routing/Decorators';
import { Service } from '../../framework/Container/Decorators';
import { AbstractController } from '../../framework/Controller/AbstractController';

@Controller('/product')
@Service()
export class ProductController extends AbstractController {
    
    @Get('/')
    async index() {
        return this.json({
            message: 'Welcome to your new controller!',
            path: 'src/Controller/ProductController.ts',
        });
    }
}