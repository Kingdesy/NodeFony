import { Controller, Get } from '../../framework/Routing/Decorators';
import { Service } from '../../framework/Container/Decorators';
import { Request } from '../../framework/Http/Request'; // Import de notre classe

@Controller('/hello')
@Service()
export class HelloController {
  
  @Get('/test-request')
  test(request: Request) { // L'ArgumentResolver va injecter l'objet ici !
    return {
      message: "L'injection de Request fonctionne !",
      yourPath: request.path,
      method: request.getMethod()
    };
  }
  @Get('/user/{name}')
profile(name: string) {
    return { hello: name };
}
}