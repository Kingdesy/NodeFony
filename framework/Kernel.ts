import express, { Application } from "express";
import { AppDataSource } from "../data-source";
import { Router } from "./Routing/Router";
import { ControllerLoader } from "./Routing/ControllerLoader";
import path from "path";

export class Kernel {
    private app: Application;

    constructor() {
        this.app = express();
        this.app.use(express.json()); // Pour lire le JSON dans les requêtes
    }

    async boot(port: number) {
        try {
            console.log("⏳ Initialisation de la base de données...");
            await AppDataSource.initialize();
            console.log("✅ Base de données connectée.");

            console.log("⏳ Chargement des routes...");
            await this.loadRoutes();

            this.app.listen(port, () => {
                console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
            });
        } catch (error) {
            console.error("❌ Erreur lors du démarrage :", error);
        }
    }

    private async loadRoutes() {
        const router = new Router();
        const controllerPath = path.join(__dirname, "../src/Controllers");
        const controllerCrudPath = path.join(__dirname, "../src/Controllers/Crud");
        
        // On charge les contrôleurs
        const controllers = await ControllerLoader.load(controllerPath);
        const crudControllers = await ControllerLoader.load(controllerCrudPath);
        
        // On enregistre chaque contrôleur dans Express via notre Router
        controllers.forEach(controller => {
            router.register(this.app, controller);
        });
        crudControllers.forEach(controller => {
            router.register(this.app, controller);
        });
    }
}