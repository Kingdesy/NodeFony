import fs from 'fs';
import path from 'path';

export class ControllerLoader {
  /**
   * Scanne un dossier et retourne toutes les classes exportées
   */
  static async load(directory: string): Promise<any[]> {
    const controllers: any[] = [];
    
    // Lire tous les fichiers du dossier
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      
      // On ne prend que les fichiers .ts ou .js (on évite les dossiers)
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        // Importation dynamique du fichier (le "require" de JS)
        const module = await import(fullPath);
        
        // On récupère toutes les classes exportées dans le fichier
        for (const exportName in module) {
            const exported = module[exportName];
            // Vérifie si c'est une classe avec le décorateur @Controller
            if (Reflect.hasMetadata('prefix', exported)) {
                controllers.push(exported);
            }
        }
      }
    }
    
    return controllers;
  }
}