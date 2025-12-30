import { DataSource } from "typeorm";
import path from "path";
import * as dotenv from "dotenv";

// Chargement du fichier .env
dotenv.config({quiet: true});

const isSqlite = process.env.DB_TYPE === "sqlite";

export const AppDataSource = new DataSource({
    // @ts-ignore - Le type est lu depuis le .env (mysql, postgres, sqlite, etc.)
    type: process.env.DB_TYPE || "sqlite",
    
    // Configuration spécifique pour les serveurs (MySQL/Postgres)
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    
    // Chemin de la base (ou nom de la DB)
    database: process.env.DB_DATABASE || "database.sqlite",
    
    synchronize: false,
    logging: process.env.NODE_ENV === "development",
    
    // Utilisation de process.cwd() pour garantir les chemins absolus
    entities: [path.join(process.cwd(), "src/Entity/*.ts")],
    migrations: [path.join(process.cwd(), "src/Migration/*.ts")],
    subscribers: [],
});