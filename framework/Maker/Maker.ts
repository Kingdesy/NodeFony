// framework/Maker/Maker.ts
import fs from "fs";
import path from "path";

export class Maker {
static generate(templateName: string, targetPath: string, data: any) {
    // 1. Définition du chemin du template (.tpl.txt)
    const templatePath = path.join(__dirname, "templates", `${templateName}.tpl.txt`);
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template introuvable : ${templatePath}`);
    }

    let content = fs.readFileSync(templatePath, 'utf8');

    // 2. Remplacement dynamique de toutes les clés présentes dans "data"
    // Cette boucle remplace {{name}}, {{fields}}, {{imports}}, etc.
    Object.keys(data).forEach(key => {
        // La Regex /{+key}+/g gère {key} et {{key}}
        const regex = new RegExp(`{+${key}}+`, "g");
        const value = data[key] || ""; // Sécurité si la valeur est null/undefined
        content = content.replace(regex, value);
    });

    // 3. Gestion du dossier de destination
    const fullPath = path.join(process.cwd(), targetPath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // 4. Écriture du fichier final
    fs.writeFileSync(fullPath, content);
    
    return fullPath;
}

  static updateExistingEntity(entityName: string, newFieldCode: string, newImportCode: string) {
    const filePath = path.join(process.cwd(), `src/Entity/${entityName}.ts`);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, "utf8");

    // 1. GESTION DE L'IMPORT DE L'ENTITÉ (ex: import { Profile } ...)
    const classNameMatch = newImportCode.match(/{\s*(\w+)\s*}/);
    if (classNameMatch) {
      const className = classNameMatch[1];
      // On vérifie si le nom de la classe est déjà présent dans un import
      const isAlreadyImported = new RegExp(`import.*{.*\\b${className}\\b.*}.*`).test(content);
      
      if (!isAlreadyImported && newImportCode.trim() !== "") {
        content = newImportCode.trim() + "\n" + content;
      }
    }

    // 2. GESTION DES DÉCORATEURS TYPEORM (Multi-lignes supporté)
    const decorators = newFieldCode.match(/@(\w+)/g) || [];
    decorators.forEach(rawDeco => {
      const deco = rawDeco.replace('@', '');
      const typeormRegex = /import\s+{([\s\S]*?)}\s+from\s+['"]typeorm['"]/;
      const match = content.match(typeormRegex);

      if (match) {
        const currentImports = match[1].split(',').map(i => i.trim()).filter(i => i !== "");
        if (!currentImports.includes(deco)) {
          currentImports.push(deco);
          const newImportLine = `import { ${currentImports.sort().join(', ')} } from 'typeorm'`;
          content = content.replace(typeormRegex, newImportLine);
        }
      }
    });

    // 3. INSERTION DU CHAMP AVANT LA DERNIÈRE ACCOLADE
    const lastBraceIndex = content.lastIndexOf("}");
    if (lastBraceIndex !== -1) {
      content = content.substring(0, lastBraceIndex) + newFieldCode + "\n" + content.substring(lastBraceIndex);
    }

    fs.writeFileSync(filePath, content);
  }
}