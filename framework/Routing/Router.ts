import { container } from "../Container/Container";
import { RouteDefinition } from "./RouteDefinition";

export class Router {
  private controllers: any[] = [];

  register(controller: any) {
    this.controllers.push(controller);
  }

  match(path: string, method: string) {
    for (const controller of this.controllers) {
      const prefix = Reflect.getMetadata("prefix", controller) || "";
      const routes: any[] = Reflect.getMetadata("routes", controller) || [];

      for (const route of routes) {
        const fullPath = (prefix + route.path).replace(/\/+/g, "/");

        // 1. Transformer {id} en groupe de capture regex ([^/]+)
       const regexPath = new RegExp('^' + fullPath.replace(/{[^/]+}/g, '([^/]+)') + '/?$');
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
    console.log("\n--- SymfoNode Routes Debug ---");
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
