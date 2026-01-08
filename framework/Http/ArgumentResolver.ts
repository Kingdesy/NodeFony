import "reflect-metadata";
import { Request as MyRequest } from "./Request";
import type { Type } from "../Container/Container";

export class ArgumentResolver {
    
    private static getParamNames(func: Function): string[] {
        if (!func) return [];
        const fnStr = func.toString();
        const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
        return result === null ? [] : result;
    }

    static resolve(instance: any, methodName: string, req: any, res: any): any[] {
        const args: any[] = [];
        const method = instance[methodName];
        
        if (!method) {
            console.error(`❌ La méthode "${methodName}" est introuvable sur le contrôleur ${instance.constructor.name}`);
            return [];
        }
        
        const paramNames = this.getParamNames(method);
        const paramTypes = Reflect.getMetadata('design:paramtypes', instance, methodName) || [];

        paramNames.forEach((name, index) => {
            const type = paramTypes[index];

            // 1. Injection de la REQUEST (par type)
            if (type && type.name === 'Request') {
                const { Request } = require('../Http/Request');
                args.push(new Request(req));
            } 
            // 2. Injection de la RESPONSE (par nom : res ou response)
            // C'est ici qu'on corrige ton erreur !
            else if (name === 'res' || name === 'response') {
                args.push(res);
            }
            // 3. Injection par NOM (Params d'URL ex: /user/:id)
            else if (req.params && req.params[name] !== undefined) {
                const value = req.params[name];
                args.push(type === Number ? Number(value) : value);
            }
            // 4. Injection par QUERY (ex: ?page=1)
            else if (req.query && req.query[name] !== undefined) {
                args.push(req.query[name]);
            }
            else {
                args.push(null);
            }
        });

        return args;
    }
}