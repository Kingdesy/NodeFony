import fs from "fs";
import path from "path";

export class Maker {
    static generate(templateName: string, targetPath: string, data: any) {
        const fullPath = path.join(process.cwd(), targetPath);
        const exists = fs.existsSync(fullPath);

        // 1. Mise à jour d'entité existante
        if (exists && templateName === 'entity') {
            return this.updateExistingEntity(data.name, data.fields, data.imports);
        }

        // 2. Création automatique du Repository si on fait un contrôleur
        if (templateName === 'controller') {
            this.ensureRepositoryExists(data.name);
        }

        // 3. Lecture du template (.tpl.txt)
        const templatePath = path.join(__dirname, `templates/${templateName}.tpl.txt`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template manquant: ${templatePath}`);
        }

        let content = fs.readFileSync(templatePath, 'utf8');

        // 4. Remplacement des balises (ex: {{name}}, {{slug}})
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, "g");
            content = content.replace(regex, data[key] || "");
        });

        // 5. Écriture du fichier
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(fullPath, content);
        console.log(`\x1b[32m[Maker]\x1b[0m ${targetPath} généré.`);
    }

    private static ensureRepositoryExists(name: string) {
        const repoPath = `src/Repository/${name}Repository.ts`;
        const fullRepoPath = path.join(process.cwd(), repoPath);

        if (!fs.existsSync(fullRepoPath)) {
            const repoContent = `import { AppDataSource } from "../../data-source";
import { ${name} } from "../Entity/${name}";

const getRepo = () => AppDataSource.getRepository(${name});

export const ${name}Repo: any = new Proxy({}, {
    get(target, prop) {
        return (getRepo() as any)[prop];
    }
});`;
            const dir = path.dirname(fullRepoPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(fullRepoPath, repoContent);
            console.log(`\x1b[33m[Maker]\x1b[0m ${repoPath} créé automatiquement.`);
        }
    }

    static updateExistingEntity(targetEntityName: string, newFieldCode: string, newImportCode: string) {
        const filePath = path.join(process.cwd(), `src/Entity/${targetEntityName}.ts`);
        if (!fs.existsSync(filePath)) return;

        let content = fs.readFileSync(filePath, 'utf8');

        if (newImportCode && !content.includes(newImportCode)) {
            content = newImportCode + "\n" + content;
        }

        const lastBrace = content.lastIndexOf('}');
        if (lastBrace !== -1) {
            content = content.substring(0, lastBrace) + "\n" + newFieldCode + "\n" + "}";
        }

        fs.writeFileSync(filePath, content);
        console.log(`\x1b[34m[Maker]\x1b[0m Entity ${targetEntityName} mise à jour.`);
    }
}