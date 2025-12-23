import { DataSource } from "typeorm";
import path from "path";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    synchronize: false, // TRÈS IMPORTANT : On passe à false pour laisser les migrations gérer le schéma
    logging: false,
    entities: [path.join(__dirname, "src/Entity/*.ts")],
    migrations: [path.join(__dirname, "src/Migration/*.ts")],
});