import { Request as ExpressRequest } from 'express';

export class Request {
    constructor(private req: ExpressRequest) {}

    // Récupère les données JSON envoyées (POST/PUT)
    getBody() {
        return this.req.body;
    }

    // Récupère un paramètre de l'URL

    getParams() {
        return this.req.params; // Récupère les params d'Express (:id)
    }

    get path() {
        return this.req.path;
    }

    getMethod() {
        return this.req.method;
    }
}