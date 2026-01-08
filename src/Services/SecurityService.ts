import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class SecurityService {
    private static SALT_ROUNDS = 10;
    private static SECRET = process.env.JWT_SECRET || 'fallback_secret';

    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    static generateToken(payload: any): string {
    // Vérification de sécurité pour le développeur
    if (!payload.id) {
        console.error("❌ ERREUR : Tentative de générer un token sans ID utilisateur !");
    }
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', {
        expiresIn: '24h'
    });
}
}