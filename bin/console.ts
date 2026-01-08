#!/usr/bin/env ts-node
import { Command } from "commander";
import inquirer from "inquirer";
import { AppDataSource } from "../data-source";
import { Router } from "../framework/Routing/Router";
import { ControllerLoader } from "../framework/Routing/ControllerLoader";
import path from "path";
import fs from "fs";
import { Maker } from "../framework/Maker/Maker";
import ora from "ora";
import chalk from "chalk";

const program = new Command();

const style = {
  cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
  green: (t: string) => `\x1b[32m${t}\x1b[0m`,
  yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
  red: (t: string) => `\x1b[31m${t}\x1b[0m`,
  bold: (t: string) => `\x1b[1m${t}\x1b[22m`,
  dim: (t: string) => `\x1b[2m${t}\x1b[22m`,
};

const checkProjectRoot = () => {
  const pkgPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(pkgPath)) {
    console.log(chalk.red("\n ❌ Error: You must run this command at the root of a NodeFony project."));
    process.exit(1);
  }
};

const logger = {
  info: (msg: string) => console.log(chalk.cyan(` ℹ ${msg}`)),
  success: (msg: string) => console.log(chalk.green(`\n ✔ ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellow(` ⚠ ${msg}`)),
  error: (msg: string) => console.log(chalk.red(` ✖ ${msg}`)),
  header: () => {
    console.log(chalk.bold.magenta("\n ╔════════════════════════════════════╗"));
    console.log(chalk.bold.magenta(" ║      NODEPHONY FRAMEWORK CLI       ║"));
    console.log(chalk.bold.magenta(" ╚════════════════════════════════════╝\n"));
  },
};

const handleExit = (error: any) => {
  if (error.name === "ExitPromptError" || error.message?.includes("SIGINT")) {
    console.log(`\n\n ${style.yellow("⚠")} ${style.dim("Operation cancelled by user.")}\n`);
    process.exit(0);
  }
  console.error(`\n❌ Erreur : ${error.message}`);
  process.exit(1);
};

program
  .name("nodefony-console")
  .description("CLI pour le framework nodefony")
  .version("1.0.0");

checkProjectRoot();
logger.header();

// --- COMMANDE MAKE:CONTROLLER (DYNAMIQUE ET COMPLÈTE) ---
program
  .command("make:controller [name]")
  .description("Génère un contrôleur (API CRUD, Web CRUD, API Custom, Web Custom)")
  .action(async (rawName) => {
    checkProjectRoot();
    try {
      const entityDir = path.join(process.cwd(), "src/Entity");
      const entities = fs.readdirSync(entityDir).filter((f) => f.endsWith(".ts")).map((f) => f.replace(".ts", ""));

      // 1. Sélection du Type
      const { typeSelection } = await inquirer.prompt([{
        type: "checkbox",
        name: "typeSelection",
        message: "Select the Controller Type:",
        choices: [
          { name: "API CRUD   (Full JSON REST)", value: "api_crud" },
          { name: "Web CRUD   (Full HTML Views)", value: "web_crud" },
          { name: "API Custom (Specific JSON methods)", value: "api_custom" },
          { name: "Web Custom (Specific Web pages)", value: "web_custom" },
        ],
        validate: (a) => a.length === 1 || "Select exactly one type.",
      }]);

      const type = typeSelection[0];
      const isCrud = type.includes("crud");
      const isApi = type.includes("api");

      // 2. Sélection de l'Entité
      const entityResponse = await inquirer.prompt([{
        type: "checkbox",
        name: "selectedEntities",
        message: `Which entity is this controller for?`,
        choices: entities,
        validate: (a) => a.length === 1 || "Please select exactly ONE entity.",
      }]);

      const entityName = entityResponse.selectedEntities[0];
      const name = entityName.charAt(0).toUpperCase() + entityName.slice(1);
      
      // Slug dynamique (BlogPost -> blog-post)
      const slug = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

      // 3. Analyse des Relations
      const entityFilePath = path.join(process.cwd(), "src/Entity", `${name}.ts`);
      const entityContent = fs.readFileSync(entityFilePath, "utf8");
      
      let relationsArray: string[] = [];
      let relationImports = "";
      let relationFetch = "";

      const relationRegex = /@(ManyToOne|OneToMany|ManyToMany|OneToOne)\s*\([\s\S]+?\)\s+([a-zA-Z0-9_]+)\s*[!:]/g;
      let match;
      while ((match = relationRegex.exec(entityContent)) !== null) {
        if (!relationsArray.includes(`'${match[2]}'`)) {
          relationsArray.push(`'${match[2]}'`);
        }
      }

      const classRegex = /@(?:ManyToOne|OneToMany|ManyToMany|OneToOne)\s*\(\s*\(\s*\)\s*=>\s*([a-zA-Z0-9_]+)/g;
      let classMatch;
      const detectedClasses = new Set<string>();
      while ((classMatch = classRegex.exec(entityContent)) !== null) {
        detectedClasses.add(classMatch[1]);
      }

      detectedClasses.forEach(className => {
        relationImports += `import { ${className}Repo } from '../../Repository/${className}Repository';\n`;
        relationFetch += `${className.toLowerCase()}List: await ${className}Repo.find(),\n            `;
      });

      // 4. Gestion des méthodes (pour Custom)
      let methodsCode = "";
      if (!isCrud) {
        const methodResp = await inquirer.prompt([{
          type: "checkbox",
          name: "methods",
          message: "Select methods to generate:",
          choices: ["index", "show", "create", "update", "delete"],
        }]);
        
        const methodConfig: any = {
          index:  { dec: "@Get('/')",    params: "" },
          show:   { dec: "@Get('/{id}')", params: "id: string" },
          create: { dec: "@Post('/')",   params: "request: Request" },
          update: { dec: "@Put('/{id}')", params: "id: string, request: Request" },
          delete: { dec: "@Delete('/{id}')", params: "id: string" },
        };

        methodResp.methods.forEach((m: string) => {
          const config = methodConfig[m];
          if (isApi) {
            methodsCode += `\n    ${config.dec}\n    async ${m}(${config.params}) {\n        return this.json({ message: "Method ${m} generated" });\n    }\n`;
          } else {
            methodsCode += `\n    @Get('/${m === 'index' ? '' : m}')\n    async ${m}() {\n        return this.render('${slug}/${m}.html');\n    }\n`;
          }
        });
      }

      // 5. Génération finale
      const spinner = ora(chalk.cyan(`Generating ${name}Controller...`)).start();
      const subFolder = isApi ? "Api" : "Web";
      const targetPath = `src/Controllers/${subFolder}/${name}Controller.ts`;
      
      Maker.generate('controller', targetPath, {
        name,
        slug,
        methodsCode,
        relations: relationsArray.join(', '),
        relationImports,
        relationFetch,
        withRepo: true
      });

      spinner.succeed(chalk.green(`${name}Controller generated at ${targetPath}`));

    } catch (e) {
      handleExit(e);
    }
  });

// --- RESTE DES COMMANDES (MIGRATION, ENTITY, ETC.) ---
program.command("make:migration").action(() => { /* ... idem code précédent ... */ });
program.command("make:entity <rawName>").action(async (rawName) => { /* ... ton code entity complet ... */ });

program.parse();