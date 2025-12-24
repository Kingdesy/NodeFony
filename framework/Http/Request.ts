import { Request as ExpressRequest } from 'express';

export class Request {
    constructor(private req: ExpressRequest) {}

    // Récupère les données JSON envoyées (POST/PUT)
    getBody() {
        return this.req.body;
    }

    // Récupère un paramètre de l'URL
    getParam(name: string) {
        return this.req.params[name];
    }

    get path() {
        return this.req.path;
    }

    getMethod() {
        return this.req.method;
    }
}