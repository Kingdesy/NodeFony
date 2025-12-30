// framework/Maker/Maker.ts
import fs from "fs";
import path from "path";

export class Maker {
static generate(templateName: string, targetPath: string, data: any) {
    const fullPath = path.join(process.cwd(), targetPath);
    const exists = fs.existsSync(fullPath);

    // 1. SI LE FICHIER EXISTE DÉJÀ (Cas de make:entity sur une entité existante)
    if (exists && templateName === 'entity') {
        // On n'utilise pas le template ! On appelle notre méthode de mise à jour
        return this.updateExistingEntity(data.name, data.fields, data.imports);
    }

    // 2. SI LE FICHIER N'EXISTE PAS (Création classique)
    const templatePath = path.join(__dirname, `templates/${templateName}.tpl.txt`);
    let content = fs.readFileSync(templatePath, 'utf8');

    // Remplacement des balises
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`{+${key}}+`, "g");
        content = content.replace(regex, data[key] || "");
    });

    // Création du dossier si nécessaire
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Écriture du nouveau fichier
    fs.writeFileSync(fullPath, content);
}

static updateExistingEntity(targetEntityName: string, newFieldCode: string, newImportCode: string) {
        const filePath = path.join(process.cwd(), `src/Entity/${targetEntityName}.ts`);
        
        if (!fs.existsSync(filePath)) return;

        let content = fs.readFileSync(filePath, 'utf8');

        // 1. Gestion intelligente de l'import
        // On vérifie si l'entité est déjà importée
        const importName = newImportCode.match(/{(.*)}/)?.[1]?.trim();
        if (importName && !content.includes(`import { ${importName} }`)) {
            // On insère l'import au tout début du fichier
            content = newImportCode + content;
        }

        // 2. Insertion du champ avant le dernier crochet fermant de la classe
        const lastCurlyBraceIndex = content.lastIndexOf('}');
        if (lastCurlyBraceIndex !== -1) {
            const beforeBrace = content.substring(0, lastCurlyBraceIndex);
            const afterBrace = content.substring(lastCurlyBraceIndex);
            
            // On assemble : contenu + nouveau champ + crochet final
            content = beforeBrace + newFieldCode + afterBrace;
        }

        fs.writeFileSync(filePath, content);
    }
}