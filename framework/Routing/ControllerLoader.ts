import fs from 'fs';
import path from 'path';
import 'reflect-metadata';

export class ControllerLoader {
  /**
   * Scanne un dossier récursivement et retourne toutes les classes avec @Controller
   */
  static async load(directory: string): Promise<any[]> {
    const controllers: any[] = [];

    // --- SÉCURITÉ : Utilise "directory" et non "controllerPath" ---
    if (!fs.existsSync(directory)) {
        // console.warn(`⚠️  Attention: Le dossier ${directory} n'existe pas.`);
        return [];
    }
    
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      // 1. Si c'est un dossier, on scanne l'intérieur (récursivité)
      if (stat.isDirectory()) {
        const subControllers = await this.load(fullPath);
        controllers.push(...subControllers);
      } 
      // 2. Si c'est un fichier TypeScript ou JavaScript
      else if (file.endsWith('.ts') || file.endsWith('.js')) {
        // Importation dynamique
        const module = await import(fullPath);
        
        for (const exportName in module) {
            const exported = module[exportName];
            // On vérifie si c'est une classe qui a le décorateur @Controller
            if (exported && typeof exported === 'function' && Reflect.hasMetadata('prefix', exported)) {
                controllers.push(exported);
            }
        }
      }
    }
    
    return controllers;
  }
}