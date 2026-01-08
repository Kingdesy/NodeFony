import 'reflect-metadata';

function createRouteDecorator(method: string) {
    return function (path: string) {
        return function (target: any, propertyKey: string) {
            // On récupère les routes déjà enregistrées sur la CLASSE (target.constructor)
            const routes = Reflect.getMetadata('routes', target.constructor) || [];
            
            routes.push({
                method: method,
                path: path,
                methodName: propertyKey // <--- C'est ici que le nom "create", "index", etc. est stocké
            });
            
            Reflect.defineMetadata('routes', routes, target.constructor);
        };
    };
}

export const Get = createRouteDecorator('GET');
export const Post = createRouteDecorator('POST');
export const Put = createRouteDecorator('PUT');
export const Delete = createRouteDecorator('DELETE');

export function Controller(prefix: string) {
    return function (target: any) {
        Reflect.defineMetadata('prefix', prefix, target);
    };
}

export function UseMiddleware(middleware: any) {
    return function (target: any, propertyKey?: string) {
        if (propertyKey) {
            // Appliqué sur une méthode
            const middlewares = Reflect.getMetadata('middlewares', target, propertyKey) || [];
            middlewares.push(middleware);
            Reflect.defineMetadata('middlewares', middlewares, target, propertyKey);
        } else {
            // Appliqué sur une classe (Contrôleur)
            const middlewares = Reflect.getMetadata('middlewares', target) || [];
            middlewares.push(middleware);
            Reflect.defineMetadata('middlewares', middlewares, target);
        }
    };
}