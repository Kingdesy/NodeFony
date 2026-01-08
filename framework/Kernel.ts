import express, { Application, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Router } from "./Routing/Router";
import { ControllerLoader } from "./Routing/ControllerLoader";
import path from "path";
import fs from "fs";

export class Kernel {
    private app: Application;

    constructor() {
        this.app = express();
        this.app.use(express.json()); 
        this.app.use(require("cookie-parser")()); 

        // 1. SERVICES STATIQUES (Indispensable pour React)
        // On permet l'accès au dossier public (où se trouve /dist)
        this.app.use(express.static(path.join(process.cwd(), "public")));
    }

    async boot(port: number) {
        try {
            console.log("⏳ Initialisation de la base de données...");
            await AppDataSource.initialize();
            console.log("✅ Base de données connectée.");

            console.log("⏳ Chargement des routes API...");
            await this.loadRoutes();

            // 2. SPA FALLBACK (REACT)
            // Doit être placé APRES loadRoutes() pour ne pas écraser les APIs
            this.setupReactFallback();

            this.app.listen(port, () => {
                console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
                console.log(`🌐 Interface Front-end disponible sur http://localhost:${port}`);
            });
        } catch (error) {
            console.error("❌ Erreur lors du démarrage :", error);
        }
    }

    private async loadRoutes() {
        const router = new Router();
        
        // On définit les chemins des contrôleurs
        const paths = [
            path.join(__dirname, "../src/Controllers"),
            path.join(__dirname, "../src/Controllers/Api"),
            path.join(__dirname, "../src/Controllers/Web"),
            path.join(__dirname, "../src/Controllers/Crud")
        ];

        for (const controllerPath of paths) {
            if (fs.existsSync(controllerPath)) {
                const controllers = await ControllerLoader.load(controllerPath);
                controllers.forEach(controller => {
                    router.register(this.app, controller);
                });
            }
        }
    }

/**
 * Gère le renvoi vers React si aucune route API ne correspond
 */
private setupReactFallback() {
    // Utilisation d'une RegExp native au lieu d'une string
    // Cela contourne les erreurs "Missing parameter name" de path-to-regexp
    this.app.get(/.*/, (req: Request, res: Response) => {
        
        // Sécurité : si on est sur une route /api inexistante, on reste en JSON
        if (req.path.startsWith("/api")) {
            return res.status(404).json({ error: "API Route not found" });
        }

        const indexPath = path.join(process.cwd(), "public/dist/index.html");

        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send(`
                <h1>Front-end non détecté</h1>
                <p>Le fichier <code>public/dist/index.html</code> est absent.</p>
                <p>Lancez <code>npm run build:front</code> à la racine du projet.</p>
            `);
        }
    });
}

}

