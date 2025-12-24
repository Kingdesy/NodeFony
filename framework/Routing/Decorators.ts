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