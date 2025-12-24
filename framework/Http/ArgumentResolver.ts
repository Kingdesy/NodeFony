import "reflect-metadata";
import { Request } from "./Request";
import type { Type } from "../Container/Container";


export class ArgumentResolver {
    
private static getParamNames(func: Function): string[] {
        if (!func) return []; // Sécurité : si la fonction n'existe pas, on renvoie vide
        
        const fnStr = func.toString();
        const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
        return result === null ? [] : result;
    }

    static resolve(instance: any, methodName: string, req: any): any[] {
        const args: any[] = [];
        const method = instance[methodName];
        
        if (!method) {
            console.error(`❌ La méthode "${methodName}" est introuvable sur le contrôleur ${instance.constructor.name}`);
            return [];
        }
        
        // On récupère les noms (ex: ["id", "request"])
        const paramNames = this.getParamNames(method);
        
        // On récupère les types (ex: [Number, Request])
        const paramTypes = Reflect.getMetadata('design:paramtypes', instance, methodName) || [];


        paramNames.forEach((name, index) => {
            const type = paramTypes[index];

            // 1. Injection par TYPE (ex: ton objet Request)
            if (type && type.name === 'Request') {
                // On importe ton MyRequest personnalisé ici
                const { Request } = require('../Http/Request');
                args.push(new Request(req));
            } 
            // 2. Injection par NOM (ex: {id} dans l'URL)
            else if (req.params[name] !== undefined) {
                const value = req.params[name];
                // Petit bonus : conversion auto si le type est Number
                args.push(type === Number ? Number(value) : value);
            }
            // 3. Injection par QUERY (ex: ?page=1)
            else if (req.query[name] !== undefined) {
                args.push(req.query[name]);
            }
            else {
                args.push(null);
            }
        });

        return args;
    }
}