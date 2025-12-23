import 'reflect-metadata';
import { RouteDefinition } from './RouteDefinition';

export function Controller(prefix: string = ''): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('prefix', prefix, target);
    // On s'assure que la liste des routes existe
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target);
    }
  };
}

export function Get(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    // Dans les MethodDecorator, 'target' est le prototype de la classe
    const constructor = target.constructor;
    if (!Reflect.hasMetadata('routes', constructor)) {
      Reflect.defineMetadata('routes', [], constructor);
    }

    const routes = Reflect.getMetadata('routes', constructor) as RouteDefinition[];
    routes.push({
      path,
      method: 'GET',
      action: propertyKey.toString()
    });
    Reflect.defineMetadata('routes', routes, constructor);
  };

}

export function Post(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const constructor = target.constructor;
    if (!Reflect.hasMetadata('routes', constructor)) {
      Reflect.defineMetadata('routes', [], constructor);
    }

    const routes = Reflect.getMetadata('routes', constructor) as any[];
    routes.push({
      path,
      method: 'POST', // <-- On force le verbe POST
      action: propertyKey.toString()
    });
    Reflect.defineMetadata('routes', routes, constructor);
  };
}