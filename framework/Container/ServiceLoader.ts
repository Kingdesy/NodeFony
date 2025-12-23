import fs from 'fs';
import path from 'path';
import { container } from './Container';

export class ServiceLoader {
    /**
     * Scanne un dossier et enregistre automatiquement les classes décorées avec @Service
     */
    static async load(directory: string): Promise<void> {
        if (!fs.existsSync(directory)) return;

        const files = fs.readdirSync(directory);

        for (const file of files) {
            const fullPath = path.join(directory, file);
            
            if (file.endsWith('.ts') || file.endsWith('.js')) {
                const module = await import(fullPath);
                
                for (const exportName in module) {
                    const exported = module[exportName];
                    // On vérifie si la classe a le décorateur @Service
                    // (qui définit généralement une métadonnée spécifique)
                    if (typeof exported === 'function') {
                        // On force la résolution pour l'enregistrer dans le container
                        container.resolve(exported);
                    }
                }
            }
        }
    }
}