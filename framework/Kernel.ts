// import http from 'http';
// import { Request } from './Http/Request';
// import { Response } from './Http/Response';
// import { container } from './Container/Container';

// export class Kernel {
//   async handle(nodeReq: http.IncomingMessage, nodeRes: http.ServerResponse) {
//     // 1. Transformer la requête brute en objet Request "Framework"
//     const request = Request.createFromGlobals(nodeReq);

//     try {
//       // Pour l'instant, on fait un routage manuel très simple
//       // On l'automatisera avec le Router en Phase 3
//       console.log(`[Kernel] Requête reçue : ${request.getMethod()} ${request.path}`);

//       const response = new Response({ message: "Bienvenue sur SymfoNode !" });
//       response.send(nodeRes);

//     } catch (e) {
//       const errorResponse = new Response({ error: "Internal Server Error" }, 500);
//       errorResponse.send(nodeRes);
//     }
//   }

//   listen(port: number, callback?: () => void) {
//     const server = http.createServer((req, res) => this.handle(req, res));
//     server.listen(port, callback);
//   }
// }

import http from "http";
import { Request } from "./Http/Request";
import { Response, JsonResponse } from "./Http/Response";
import { container } from "./Container/Container";
import { Router } from "./Routing/Router";
import { ArgumentResolver } from "./Http/ArgumentResolver";
import { DataSource, EntityManager } from "typeorm";
import path from 'path';
import { ControllerLoader } from './Routing/ControllerLoader';
import { ServiceLoader } from "./Container/ServiceLoader";

export class Kernel {
  private router = new Router();
  private argumentResolver = new ArgumentResolver(); // Nouveau !

  // On simule l'enregistrement automatique des bundles
  registerControllers(controllers: any[]) {
    controllers.forEach((c) => this.router.register(c));
  }

   async handle(nodeReq: http.IncomingMessage, nodeRes: http.ServerResponse) {
    const request = Request.createFromGlobals(nodeReq);
    
    try {
        const match = this.router.match(request.path, request.getMethod());

        if (!match) {
            return new JsonResponse({ 
                title: "Not Found", 
                status: 404, 
                detail: `No route found for "${request.getMethod()} ${request.path}"` 
            }, 404).send(nodeRes);
        }

        const { controller, route, params } = match;
        const controllerInstance = container.resolve(controller);
        
        
        const args = this.argumentResolver.resolveArguments(
            controller.prototype, 
            route.action, 
            request,
            params
        );
        
        // Exécution de l'action du contrôleur (on utilise await au cas où l'action est async)
        const result = await (controllerInstance as any)[route.action](...args);
        
        if (result instanceof Response) {
            result.send(nodeRes);
        } else {
            new JsonResponse(result).send(nodeRes);
        }
        

    } catch (e: any) {
        console.error(`[Kernel Error] ${e.message}`);
        
        // Simulation du "Debug Mode" de Symfony
        new JsonResponse({
            title: "Internal Server Error",
            status: 500,
            detail: e.message,
            trace: e.stack?.split('\n').slice(0, 3) // On n'affiche que le début de la trace
        }, 500).send(nodeRes);
    }
}
  public db!: DataSource;

async boot() {
    // 1. Initialisation DB
    await this.db.initialize();
    container.setInstance(EntityManager, this.db.manager);

    // 2. Auto-chargement des Services et Repositories (Nouveau !)
    // On scanne les dossiers importants
    const repositoryPath = path.join(__dirname, '../src/Repository');
    const servicePath = path.join(__dirname, '../src/Service');
    
    await ServiceLoader.load(repositoryPath);
    await ServiceLoader.load(servicePath);

    // 3. Chargement des Contrôleurs
    const controllerPath = path.join(__dirname, '../src/Controller');
    const controllers = await ControllerLoader.load(controllerPath);
    this.registerControllers(controllers);

    console.log("[Kernel] Services et Repositories chargés automatiquement.");
}
  public showRoutes() {
    this.router.debugRoutes();
  }

  async listen(port: number, cb?: () => void) {
    await this.boot();
    
    // On affiche les routes juste avant de lancer le serveur
    this.showRoutes();

    http.createServer((req, res) => this.handle(req, res)).listen(port, cb);
  }
  
}

// framework/Kernel.ts

// export class Kernel {
//   private router = new Router();
//   private argumentResolver = new ArgumentResolver(); // Nouveau !

//   // On simule l'enregistrement automatique des bundles
//   registerControllers(controllers: any[]) {
//     controllers.forEach((c) => this.router.register(c));
//   }
//   async handle(nodeReq: http.IncomingMessage, nodeRes: http.ServerResponse) {
//     const request = Request.createFromGlobals(nodeReq);
    
//     try {
//         const match = this.router.match(request.path, request.getMethod());

//         if (!match) {
//             return new JsonResponse({ 
//                 title: "Not Found", 
//                 status: 404, 
//                 detail: `No route found for "${request.getMethod()} ${request.path}"` 
//             }, 404).send(nodeRes);
//         }

//         const { controller, route, params } = match;
//         const controllerInstance = container.resolve(controller);
        
//         const args = this.argumentResolver.resolveArguments(
//             controller.prototype, 
//             route.action, 
//             request,
//             params
//         );
        
//         // Exécution de l'action du contrôleur (on utilise await au cas où l'action est async)
//         const result = await (controllerInstance as any)[route.action](...args);
        
//         if (result instanceof Response) {
//             result.send(nodeRes);
//         } else {
//             new JsonResponse(result).send(nodeRes);
//         }

//     } catch (e: any) {
//         console.error(`[Kernel Error] ${e.message}`);
        
//         // Simulation du "Debug Mode" de Symfony
//         new JsonResponse({
//             title: "Internal Server Error",
//             status: 500,
//             detail: e.message,
//             trace: e.stack?.split('\n').slice(0, 3) // On n'affiche que le début de la trace
//         }, 500).send(nodeRes);
//     }
// }
// }
