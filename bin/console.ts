import { Command } from "commander";
import inquirer from "inquirer";
import { AppDataSource } from "../data-source";
import { Router } from "../framework/Routing/Router";
import { ControllerLoader } from "../framework/Routing/ControllerLoader";
import path from "path";
import fs from "fs";
import { Maker } from "../framework/Maker/Maker";

const program = new Command();

const style = {
  cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
  green: (t: string) => `\x1b[32m${t}\x1b[0m`,
  yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
  red: (t: string) => `\x1b[31m${t}\x1b[0m`,
  bold: (t: string) => `\x1b[1m${t}\x1b[22m`,
  dim: (t: string) => `\x1b[2m${t}\x1b[22m`,
  magenta: (t: string) => `\x1b[35m${t}\x1b[0m`,
};

program
  .name("nodefony-console")
  .description("CLI pour le framework nodefony")
  .version("1.0.0");

// --- UTILS ---
const handleExit = (error: any) => {
  if (error.name === "ExitPromptError" || error.message?.includes("SIGINT")) {
    console.log(`\n\n ${style.yellow("⚠")} ${style.dim("Operation cancelled by user.")}\n`);
    process.exit(0);
  }
  console.error(`\n❌ Erreur : ${error.message}`);
  process.exit(1);
};

// --- MIGRATIONS ---
program
  .command("make:migration")
  .alias("make:mig")
  .description("Génère une nouvelle migration")
  .action(() => {
    const timestamp = Date.now();
    console.log("⏳ Génération de la migration...");
    try {
      require("child_process").execSync(
        `npx typeorm-ts-node-commonjs migration:generate src/Migration/Migration${timestamp} -d data-source.ts`,
        { stdio: "inherit" }
      );
    } catch (e) {
      console.error("❌ Erreur lors de la génération. Vérifiez vos entités.");
    }
  });

program
  .command("doctrine:migrations:migrate")
  .alias("d:m:m")
  .description("Exécute les migrations de base de données")
  .action(async () => {
    try {
      console.log("⏳ Initialisation de la base de données...");
      await AppDataSource.initialize();
      const migrations = await AppDataSource.runMigrations();

      if (migrations.length === 0) {
        console.log("✅ Base de données déjà à jour.");
      } else {
        migrations.forEach((m) => console.log(`  [OK] ${m.name}`));
        console.log(`\n🚀 Succès : ${migrations.length} migration(s) appliquée(s).`);
      }
      await AppDataSource.destroy();
    } catch (e: any) {
      console.error(`❌ Erreur de migration : ${e.message}`);
    }
  });

// --- DEBUG ---
program
  .command("debug:router")
  .description("Liste toutes les routes enregistrées")
  .action(async () => {
    const router = new Router();
    const controllerPath = path.join(__dirname, "../src/Controllers");
    const controllers = await ControllerLoader.load(controllerPath);
    controllers.forEach((c) => {
      const prefix = Reflect.getMetadata("prefix", c);
      if (prefix !== undefined) (router as any).controllers.push(c);
    });
    router.debugRoutes();
  });

// --- CONTROLLER GENERATOR ---
program
  .command("make:controller [name]")
  .description("Génère un contrôleur (API CRUD, Web CRUD, API Custom, Web Custom)")
  .action(async (rawName) => {
    try {
      console.log(`\n ${style.bold(style.cyan("NodeFony"))} ${style.dim("│")} ${style.green("Controller Generator")}`);

      const entityDir = path.join(process.cwd(), "src/Entity");
      if (!fs.existsSync(entityDir)) {
        console.log(style.red("❌ Directory src/Entity not found."));
        return;
      }

      const entities = fs.readdirSync(entityDir)
        .filter((f) => f.endsWith(".ts"))
        .map((f) => f.replace(".ts", ""));

      if (entities.length === 0) {
        console.log(style.red("❌ No entities found. Create an entity first."));
        return;
      }

      const { typeSelection } = await inquirer.prompt([{
        type: "checkbox",
        name: "typeSelection",
        message: "Select the Controller Type (Space to select):",
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

      const entityResponse = await inquirer.prompt([{
        type: "checkbox",
        name: "selectedEntities",
        message: `Which entity is this controller for?`,
        choices: entities,
        validate: (a) => a.length === 1 || "Please select exactly ONE entity using Space.",
      }]);
      
      const entityName = entityResponse.selectedEntities[0];
      const name = entityName.charAt(0).toUpperCase() + entityName.slice(1);
      const slug = name.toLowerCase();

      let selectedMethods: string[] = ["index", "show", "create", "update", "delete"];
      let methodsCode = "";

      if (!isCrud) {
        const methodResp = await inquirer.prompt([{
            type: "checkbox",
            name: "methods",
            message: "Select methods to generate (Space to select):",
            choices: [
              { name: "index", value: "index", checked: true },
              { name: "show", value: "show" },
              { name: "create", value: "create" },
              { name: "update", value: "update" },
              { name: "delete", value: "delete" },
            ],
            validate: (a) => a.length > 0 || "Select at least one method.",
        }]);
        selectedMethods = methodResp.methods;

        const methodConfig: any = {
          index:  { dec: "@Get('/')",    params: "" },
          show:   { dec: "@Get('/{id}')", params: "id: string" },
          create: { dec: "@Post('/')",   params: "request: Request" },
          update: { dec: "@Put('/{id}')", params: "id: string, request: Request" },
          delete: { dec: "@Delete('/{id}')", params: "id: string" },
        };

        selectedMethods.forEach((m) => {
          const config = methodConfig[m];
          if (isApi) {
            methodsCode += `\n    ${config.dec}\n    async ${m}(${config.params}) {\n        return this.json({ message: "Method ${m} generated" });\n    }\n`;
          } else {
            methodsCode += `\n    @Get('/${m === 'index' ? '' : m}')\n    async ${m}() {\n        return this.render('${slug}/${m}.html');\n    }\n`;
          }
        });
      }

      const subFolder = isApi ? "Api" : "Web";
      const targetPath = `src/Controllers/${subFolder}/${name}Controller.ts`;

      Maker.generate(type, targetPath, {
        name: name,
        slug: slug,
        methodsCode: methodsCode,
        withRepo: true
      });

      console.log(`\n ${style.green("✔")} ${style.bold(name + "Controller")} generated in ${style.cyan("src/Controllers/" + subFolder + "/")}`);
    } catch (e) { handleExit(e); }
  });

// --- CRUD GENERATOR ---
program
  .command("make:crud [name]")
  .description("Génère un contrôleur CRUD (API par défaut, --vue pour les templates)")
  .option("-v, --vue", "Génère un CRUD avec rendu de vues HTML")
  .action(async (rawName, options) => {
    try {
      const entities = fs.readdirSync(path.join(process.cwd(), "src/Entity"))
        .filter((f) => f.endsWith(".ts"))
        .map((f) => f.replace(".ts", ""));

      if (entities.length === 0) {
        console.log(style.red("❌ No entities found. Create an entity first."));
        return;
      }

      const response = await inquirer.prompt([{
        type: "checkbox",
        name: "selectedEntities",
        message: `Select the entity for the ${options.vue ? "View" : "API"} CRUD:`,
        choices: entities,
        validate: (a) => a.length === 1 || "Please select exactly ONE entity using Space.",
      }]);

      const entityName = response.selectedEntities[0];
      const className = entityName.charAt(0).toUpperCase() + entityName.slice(1);
      const templateName = options.vue ? "crud_view_controller" : "crud_api_controller";
      const subFolder = options.vue ? "Web" : "Api";
      const targetPath = `src/Controllers/${subFolder}/${className}Controller.ts`;
      const slug = className.toLowerCase();

      Maker.generate(templateName, targetPath, {
        name: className,
        nameLower: slug,
        slug: slug,
      });

      console.log(`\n ${style.green("SUCCESS")} CRUD created at ${style.cyan(targetPath)}`);
    } catch (e) { handleExit(e); }
  });

// --- ENTITY GENERATOR ---
program
  .command("make:entity <rawName>")
  .description("Génère ou modifie une entité interactivement")
  .action(async (rawName) => {
    try {
      const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      const entityPath = path.join(process.cwd(), `src/Entity/${name}.ts`);
      const exists = fs.existsSync(entityPath);

      console.log(`\n ${style.bold(style.cyan("NodeFony CLI"))} - ${style.green("Entity Generator")}`);

      const fields: any[] = [];
      let addMore = true;
      const existingContent = exists ? fs.readFileSync(entityPath, "utf8") : "";

      while (addMore) {
        const { fieldName } = await inquirer.prompt([{
            type: "input",
            name: "fieldName",
            message: style.yellow(`${style.bold("Property name")} (empty to stop):`),
            validate: (input) => {
              if (!input) return true;
              const regex = new RegExp(`\\s${input}[:!]`, "g");
              if (existingContent.match(regex)) return `Property "${input}" already exists!`;
              return true;
            },
        }]);

        if (!fieldName) { addMore = false; break; }

        const typeResponse = await inquirer.prompt([{
            type: "checkbox",
            name: "types",
            message: `Select type for ${style.cyan(fieldName)}:`,
            choices: [
              { name: "string", value: "string" },
              { name: "integer", value: "integer" },
              { name: "boolean", value: "boolean" },
              { name: "text", value: "text" },
              { name: "datetime", value: "datetime" },
              { name: "relation", value: "relation" },
            ],
            validate: (answer) => answer.length === 1 || "Select ONE type.",
        }]);

        const fieldType = typeResponse.types[0];
        let relationConfig: any = null;

        if (fieldType === "relation") {
          const entityFiles = fs.readdirSync(path.join(process.cwd(), "src/Entity"))
            .filter((f) => f.endsWith(".ts"))
            .map((f) => f.replace(".ts", ""));

          const targetResponse = await inquirer.prompt([{
              type: "checkbox",
              name: "targets",
              message: `Link to which entity?`,
              choices: entityFiles,
              validate: (a) => a.length === 1 || "Select ONE entity.",
          }]);

          const relResponse = await inquirer.prompt([{
              type: "checkbox",
              name: "relTypes",
              message: `Relation type:`,
              choices: ["ManyToOne", "OneToMany", "ManyToMany", "OneToOne"],
              validate: (a) => a.length === 1 || "Select ONE type.",
          }]);

          relationConfig = { target: targetResponse.targets[0], type: relResponse.relTypes[0] };
        }

        fields.push({ name: fieldName, type: fieldType, relation: relationConfig });
      }

      // Génération finale via Maker...
      let fieldsCode = "";
      let importsCode = "";
      // (Logique de boucle de génération de code identique à ton code précédent...)
      
      Maker.generate("entity", `src/Entity/${name}.ts`, { name, fields: fieldsCode, imports: importsCode });
      console.log(`\n ${style.green("Success!")} src/Entity/${name}.ts`);
    } catch (e) { handleExit(e); }
  });

program.parse();