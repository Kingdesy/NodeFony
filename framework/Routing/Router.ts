import { ArgumentResolver } from "./../Http/ArgumentResolver";
import { container } from "../Container/Container";
import { RouteDefinition } from "./RouteDefinition";

export class Router {
  private controllers: any[] = [];

  register(app: any, controllerClass: any) {
    const instance = new controllerClass();
    const prefix = Reflect.getMetadata("prefix", controllerClass) || "";
    const routes: any[] = Reflect.getMetadata("routes", controllerClass) || [];

    routes.forEach((route) => {
      const expressPath = (prefix + route.path)
        .replace(/\/+/g, "/")
        .replace(/{(\w+)}/g, ":$1");

      app[route.method.toLowerCase()](
        expressPath,
        async (req: any, res: any) => {
          try {
            const args = ArgumentResolver.resolve(
              instance,
              route.methodName,
              req
            );
            const result = await instance[route.methodName](...args);

            // --- GESTION DU RETOUR TYPE SYMFONY ---

            // 1. Si le résultat est un objet de type "__isResponse" (AbstractController)
            if (result && result.__isResponse) {
              switch (result.type) {
                case "json":
                  return res.status(result.status || 200).json(result.data);

                case "render":
                  // Ici on appellera le moteur de template (ex: EJS)
                  return res.render(result.template, result.data);

                case "redirect":
                  return res.redirect(result.status || 302, result.url);
              }
            }

            // 2. Comportement par défaut (fallback)
            if (result && typeof result === "object") {
              return res.json(result);
            }

            return res.send(result);
          } catch (err) {
            console.error("Internal Error:", err);
            res.status(500).json({ error: "Internal Server Error" });
          }
        }
      );

      // console.log(`  Mapped [${route.method}] ${expressPath}`);
    });
  }

  match(path: string, method: string) {
    for (const controller of this.controllers) {
      const prefix = Reflect.getMetadata("prefix", controller) || "";
      const routes: any[] = Reflect.getMetadata("routes", controller) || [];

      for (const route of routes) {
        const fullPath = (prefix + route.path).replace(/\/+/g, "/");

        // 1. Transformer {id} en groupe de capture regex ([^/]+)
        const regexPath = new RegExp(
          "^" + fullPath.replace(/{[^/]+}/g, "([^/]+)") + "/?$"
        );
        const match = path.match(regexPath);
        // framework/Routing/Router.ts
        console.log(
          `Test matching: [${method}] ${path}  VS  [${route.method}] ${fullPath}`
        );

        if (match && route.method === method) {
          // Extraire les valeurs des paramètres (ex: l'id)
          const params = match.slice(1);
          return { controller, route, params };
        }
      }
    }
    return null;
  }

  public debugRoutes(): void {
    console.log("\n--- Routes Debug ---");
    console.table(
      this.controllers.flatMap((controller) => {
        const prefix = Reflect.getMetadata("prefix", controller) || "";
        const routes: any[] = Reflect.getMetadata("routes", controller) || [];

        return routes.map((route) => ({
          Method: route.method,
          Path: (prefix + route.path).replace(/\/+/g, "/"),
          Controller: controller.name,
          Action: route.action,
        }));
      })
    );
    console.log("------------------------------\n");
  }
}
