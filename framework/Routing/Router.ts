import "reflect-metadata";
import { ArgumentResolver } from "./../Http/ArgumentResolver";

export class Router {
  private controllers: any[] = [];

  /**
   * Enregistre un contrôleur et ses routes dans Express avec gestion des priorités
   */
  register(app: any, controllerClass: any) {
    const instance = new controllerClass();
    const prefix = Reflect.getMetadata("prefix", controllerClass) || "";
    let routes: any[] = Reflect.getMetadata("routes", controllerClass) || [];
    
    this.controllers.push(controllerClass);

    // --- LOGIQUE DE PRIORITÉ ---
    // On trie pour que les routes fixes (ex: /me) soient enregistrées 
    // AVANT les routes dynamiques (ex: /{id})
    routes.sort((a, b) => {
      const aHasParam = a.path.includes('{');
      const bHasParam = b.path.includes('{');
      if (aHasParam && !bHasParam) return 1;
      if (!aHasParam && bHasParam) return -1;
      return 0;
    });

    routes.forEach((route) => {
      // Transformation du format {id} en format Express :id
      const expressPath = (prefix + route.path)
        .replace(/\/+/g, "/")
        .replace(/{(\w+)}/g, ":$1");

      // Récupération des middlewares (Classe + Méthode)
      const controllerMiddlewares = Reflect.getMetadata('middlewares', controllerClass) || [];
      const methodMiddlewares = Reflect.getMetadata('middlewares', instance.constructor.prototype, route.methodName) || [];
      const allMiddlewares = [...controllerMiddlewares, ...methodMiddlewares];

      // Enregistrement de la route dans Express
      app[route.method.toLowerCase()](
        expressPath,
        async (req: any, res: any) => {
          try {
            let index = 0;

            // Chaîne d'exécution (Middleware -> Controller)
            const next = async () => {
              if (index < allMiddlewares.length) {
                const middleware = allMiddlewares[index++];
                await middleware.handle(req, res, next);
              } else {
                // Résolution des arguments (injecte Request, Response, params, etc.)
                const args = ArgumentResolver.resolve(
                  instance,
                  route.methodName,
                  req,
                  res
                );
                
                const result = await instance[route.methodName](...args);
                this.sendResponse(res, result);
              }
            };

            await next();

          } catch (err: any) {
            console.error("🔥 Router Error:", err);
            res.status(500).json({ 
                error: "Internal Server Error", 
                details: err.message 
            });
          }
        }
      );
    });
  }

  /**
   * Gère la réponse selon ce que le contrôleur renvoie
   */
  private sendResponse(res: any, result: any) {
    if (!result) return res.end();

    // Si c'est une réponse type AbstractController (this.json, this.render)
    if (result && result.__isResponse) {
      switch (result.type) {
        case "json":
          return res.status(result.status || 200).json(result.data);
        case "render":
          return res.render(result.template, result.data);
        case "redirect":
          return res.redirect(result.status || 302, result.url);
      }
    }

    // Si c'est un objet brut
    if (typeof result === "object") {
      return res.json(result);
    }

    // Sinon (string, html...)
    return res.send(result);
  }

  public debugRoutes() {
    console.log("\n--- 📍 Registered Routes ---");
    // On récupère les routes via les métadonnées des contrôleurs enregistrés
    this.controllers.forEach(controllerClass => {
        const prefix = Reflect.getMetadata("prefix", controllerClass) || "";
        const routes: any[] = Reflect.getMetadata("routes", controllerClass) || [];
        
        routes.forEach(route => {
            const fullPath = (prefix + route.path).replace(/\/+/g, "/");
            console.log(`[${route.method.toUpperCase()}]`.padEnd(8) + ` ${fullPath}`);
        });
    });
    console.log("---------------------------\n");
}


}