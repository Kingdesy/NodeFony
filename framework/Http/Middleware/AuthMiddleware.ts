import { AppDataSource } from "../../../data-source"; // Ajuste le chemin vers ton DataSource
import { User } from "../../../src/Entity/User";
import jwt from 'jsonwebtoken';

export class AuthMiddleware {
    static async handle(req: any, res: any, next: Function) {
        const token = req.cookies?.access_token;
        if (!token) return res.status(401).json({ error: "No token" });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key') as any;
            const userId = Number(decoded.id);

            // UTILISATION DIRECTE DU DATASOURCE POUR ÉVITER LE BUG DE REPOSITORY
            const userRepository = AppDataSource.getRepository(User);
            
            // On utilise findOne au lieu de findOneBy ou QueryBuilder
            const user = await userRepository.findOne({
                where: { id: userId }
            });

            if (!user) return res.status(401).json({ error: "User not found" });

            req.user = user;
            await next();
        } catch (err: any) {
            return res.status(403).json({ error: "Invalid session", details: err.message });
        }
    }
}