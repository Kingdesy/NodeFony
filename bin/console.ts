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
    };


program
  .name("nodefony-console")
  .description("CLI pour le framework nodefony") 
  .version("1.0.0");

  const handleExit = (error: any) => {
  if (error.name === "ExitPromptError" || error.message?.includes("SIGINT")) {
    console.log(`\n\n ${style.yellow("⚠")} ${style.dim("Operation cancelled by user.")}\n`);
    process.exit(0);
  }
  console.error(`\n❌ Erreur : ${error.message}`);
  process.exit(1);
};

program
  .command("make:migration")
  .alias("make:mig") // Optionnel
  .description("Génère une nouvelle migration")
  .action(() => {
    const timestamp = Date.now();
    console.log("⏳ Génération de la migration...");
    try {
      // Utilise execSync pour lancer la commande TypeORM réelle
      require("child_process").execSync(
        `npx typeorm-ts-node-commonjs migration:generate src/Migration/Migration${timestamp} -d data-source.ts`,
        { stdio: "inherit" }
      );
    } catch (e) {
      console.error("❌ Erreur lors de la génération. Vérifiez vos entités.");
    }
  });

// --- Commande 1 : debug:router ---
program
  .command("debug:router")
  .description("Liste toutes les routes enregistrées")
  .action(async () => {
    const router = new Router();
    const controllerPath = path.join(__dirname, "../src/Controllers");
    const controllers = await ControllerLoader.load(controllerPath);

    // On simule l'enregistrement pour le debug
    controllers.forEach((c) => {
      // Logique minimale pour peupler le router
      const prefix = Reflect.getMetadata("prefix", c);
      if (prefix !== undefined) (router as any).controllers.push(c);
    });

    router.debugRoutes();
  });

// --- Commande 2 : doctrine:migrations:migrate ---
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
      console.log(
        `\n🚀 Succès : ${migrations.length} migration(s) appliquée(s).`
      );
    }
    await AppDataSource.destroy();
  } catch (e) {
    handleExit(e);
  }
  });

// --- Commande 3 : app:create-user (Exemple de commande métier) ---
program
  .command("app:create-user <firstName> <lastName>")
  .description("Crée un utilisateur manuellement")
  .action(async (firstName, lastName) => {
    // Ici on pourrait importer l'entité User et sauvegarder
    console.log(`👤 Création de l'utilisateur : ${firstName} ${lastName}...`);
    // ... logique de sauvegarde via AppDataSource
  });
program
  .command("make:controller [name]")
  .description("Génère un contrôleur (API CRUD, Web CRUD, API Custom, Web Custom)")
  .action(async (rawName) => {
    const style = {
      cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
      green: (t: string) => `\x1b[32m${t}\x1b[0m`,
      yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
      red: (t: string) => `\x1b[31m${t}\x1b[0m`,
      bold: (t: string) => `\x1b[1m${t}\x1b[22m`,
      dim: (t: string) => `\x1b[2m${t}\x1b[22m`,
    };

    console.log(`\n ${style.bold(style.cyan("NodeFony"))} ${style.dim("│")} ${style.green("Controller Generator")}`);

    // --- 1. RÉCUPÉRATION DES ENTITÉS (Sécurité) ---
    try {
    const entityDir = path.join(process.cwd(), "src/Entity");
    if (!fs.existsSync(entityDir)) {
      console.log(style.red("❌ Directory src/Entity not found."));
      return;
    }

    const entities = fs.readdirSync(entityDir)
      .filter((f) => f.endsWith(".ts"))
      .map((f) => f.replace(".ts", ""));

    if (entities.length === 0) {
      console.log(style.red("❌ No entities found. Please create an entity first using make:entity."));
      return;
    }

    // --- 2. SÉLECTION DU TYPE ---
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

    // --- 3. SÉLECTION DE L'ENTITÉ (Espace) ---
    let entityName = "";
    const entityResponse = await inquirer.prompt([{
      type: "checkbox",
      name: "selectedEntities",
      message: `Which entity is this controller for?`,
      choices: entities,
      validate: (a) => a.length === 1 || "Please select exactly ONE entity using Space.",
    }]);
    
    entityName = entityResponse.selectedEntities[0];
    const name = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    const slug = name.toLowerCase();

    // --- 4. GESTION DES MÉTHODES ---
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

    // --- 5. GÉNÉRATION ---
    const subFolder = isApi ? "Api" : "Web";
    const targetPath = `src/Controllers/${subFolder}/${name}Controller.ts`;

    Maker.generate(type, targetPath, {
      name: name,
      slug: slug,
      methodsCode: methodsCode,
      withRepo: true // Toujours vrai maintenant puisqu'on force la sélection d'une entité
    });

    console.log(`\n ${style.green("✔")} ${style.bold(name + "Controller")} generated in ${style.cyan("src/Controllers/" + subFolder + "/")}`);

    if (!isApi) {
      console.log(` ${style.yellow("!")} Create your views in ${style.bold("views/" + slug + "/")}`);
    }
  } catch (e) {
    handleExit(e);
  }
  });

  
program
  .command("make:crud [name]")
  .description(
    "Génère un contrôleur CRUD (API par défaut, --vue pour les templates)"
  )
  .option("-v, --vue", "Génère un CRUD avec rendu de vues HTML") // Ajout de l'option
  .action(async (rawName, options) => {
    const style = {
      cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
      green: (t: string) => `\x1b[32m${t}\x1b[0m`,
      bold: (t: string) => `\x1b[1m${t}\x1b[22m`,
      red: (t: string) => `\x1b[31m${t}\x1b[0m`,
      magenta: (t: string) => `\x1b[35m${t}\x1b[0m`,
    };

    // 1. Récupération des entités existantes
    try {
    const entities = fs
      .readdirSync(path.join(process.cwd(), "src/Entity"))
      .filter((f) => f.endsWith(".ts"))
      .map((f) => f.replace(".ts", ""));

    if (entities.length === 0) {
      console.log(style.red("❌ No entities found. Create an entity first."));
      return;
    }

    // 2. Sélection de l'entité avec ESPACE
    const response = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedEntities",
        message: `Select the entity for the ${
          options.vue ? "View" : "API"
        } CRUD:`,
        choices: entities,
        validate: (a) =>
          a.length === 1 || "Please select exactly ONE entity using Space.",
      },
    ]);

    const entityName = response.selectedEntities[0];
    const className = entityName.charAt(0).toUpperCase() + entityName.slice(1);

    // 3. Définition du template et du dossier cible
    // Si --vue est présent, on utilise un template de contrôleur "classique"
    const templateName = options.vue
      ? "crud_view_controller"
      : "crud_api_controller";
    const subFolder = options.vue ? "Web" : "Api";
    const targetPath = `src/Controllers/${subFolder}/${className}Controller.ts`;
    const slug = className.toLowerCase();

    console.log(
      `\n 🚀 Generating ${style.bold(
        options.vue ? "View-based" : "API-based"
      )} CRUD...`
    );

    Maker.generate(templateName, targetPath, {
      name: className,
      nameLower: className.toLowerCase(),
      slug: slug,
    });

    // 4. Si c'est un CRUD de Vues, on pourrait aussi générer les fichiers Twig/HTML
    if (options.vue) {
      console.log(
        ` ${style.magenta(
          "index.html, edit.html, etc."
        )} will be expected in views/${className.toLowerCase()}/`
      );
    }

    console.log(
      `\n ${style.green("SUCCESS")} CRUD created at ${style.cyan(targetPath)}`
    );
  } catch (e) {
    handleExit(e);
  }
  });

program
  .command("make:entity <rawName>")
  .description("Génère ou modifie une entité interactivement")
  .action(async (rawName) => {
    // 1. Formatage et définition des noms
    try {
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const entityPath = path.join(process.cwd(), `src/Entity/${name}.ts`);
    const exists = fs.existsSync(entityPath);

    const style = {
      cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
      yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
      green: (t: string) => `\x1b[32m${t}\x1b[0m`,
      red: (t: string) => `\x1b[31m${t}\x1b[0m`,
      bold: (t: string) => `\x1b[1m${t}\x1b[22m`,
      dim: (t: string) => `\x1b[2m${t}\x1b[22m`,
    };

    console.log(
      `\n ${style.bold(style.cyan("NodeFony CLI"))} - ${style.green(
        "Entity Generator"
      )}`
    );

    if (exists) {
      console.log(
        ` ${style.yellow("!")} Entity ${style.bold(
          name
        )} already exists. Adding new properties...`
      );
    } else {
      console.log(
        ` ${style.green("✔")} Creating new entity: ${style.bold(name)}`
      );
    }

    const fields: any[] = [];
    let addMore = true;
    const existingContent = exists ? fs.readFileSync(entityPath, "utf8") : "";

    while (addMore) {
      const { fieldName } = await inquirer.prompt([
        {
          type: "input",
          name: "fieldName",
          message: style.yellow(
            `${style.bold("Property name")} (empty to stop):`
          ),
          validate: (input) => {
            if (!input) return true;
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input))
              return "Invalid camelCase format.";
            const regex = new RegExp(`\\s${input}[:!]`, "g");
            if (existingContent.match(regex))
              return `Property "${input}" already exists!`;
            return true;
          },
        },
      ]);

      if (!fieldName) {
        addMore = false;
        break;
      }

      // --- CHOIX TYPE (FONCTIONNALITÉ ESPACE POUR SÉLECTIONNER) ---
      const typeResponse = await inquirer.prompt([
        {
          type: "checkbox",
          name: "types",
          message: `Select type for ${style.cyan(
            fieldName
          )} (Press <space> to select, <enter> to validate):`,
          choices: [
            { name: "string   (Short text)", value: "string" },
            { name: "integer  (Numbers)", value: "integer" },
            { name: "boolean  (True/False)", value: "boolean" },
            { name: "text     (Long descriptions)", value: "text" },
            { name: "datetime (Dates)", value: "datetime" },
            { name: "relation (Link with another entity)", value: "relation" },
          ],
          validate: (answer) => {
            if (answer.length !== 1)
              return "Please select exactly ONE type using Space.";
            return true;
          },
        },
      ]);

      // On extrait la valeur du tableau pour la suite du script
      const fieldType = typeResponse.types[0];

      let relationConfig: any = null;

      if (fieldType === "relation") {
        const entityFiles = fs
          .readdirSync(path.join(process.cwd(), "src/Entity"))
          .filter((f) => f.endsWith(".ts"))
          .map((f) => f.replace(".ts", ""));

        if (entityFiles.length === 0) {
          console.log(
            style.red("\n ❌ No other entities found. Create the target first.")
          );
          continue;
        }

        // --- SÉLECTION DE L'ENTITÉ CIBLE (Navigation Flèches + Espace + Entrée) ---
        const targetResponse = await inquirer.prompt([
          {
            type: "checkbox",
            name: "targets",
            message: `Link ${style.bold(
              name
            )} to which entity? (Space to select, Enter to validate):`,
            choices: entityFiles.map((file) => ({ name: file, value: file })),
            validate: (answer) => {
              if (answer.length !== 1)
                return "Please select exactly ONE target entity using Space.";
              return true;
            },
          },
        ]);

        const target = targetResponse.targets[0];

        // --- SÉLECTION DU TYPE DE RELATION (Navigation Flèches + Espace + Entrée) ---
        const relResponse = await inquirer.prompt([
          {
            type: "checkbox",
            name: "relTypes",
            message: `Relation type between ${style.bold(
              name
            )} and ${style.bold(target)} (Space to select, Enter to validate):`,
            choices: [
              {
                name: `${style.bold("ManyToOne")}  ${style.dim(
                  `(Many ${name}s -> One ${target})`
                )}`,
                value: "ManyToOne",
              },
              {
                name: `${style.bold("OneToMany")}  ${style.dim(
                  `(One ${name} -> Many ${target}s)`
                )}`,
                value: "OneToMany",
              },
              {
                name: `${style.bold("ManyToMany")} ${style.dim(
                  `(Many ${name}s <-> Many ${target}s)`
                )}`,
                value: "ManyToMany",
              },
              {
                name: `${style.bold("OneToOne")}   ${style.dim(
                  `(One ${name} <-> One ${target})`
                )}`,
                value: "OneToOne",
              },
            ],
            validate: (answer) => {
              if (answer.length !== 1)
                return "Please select exactly ONE relation type using Space.";
              return true;
            },
          },
        ]);

        const relType = relResponse.relTypes[0];
        relationConfig = { target, type: relType };

        // Récapitulatif visuel
        console.log(
          `\n ${style.cyan("ℹ")} ${style.bold("Summary of changes:")}`
        );
        if (relType === "ManyToOne")
          console.log(
            `   - A foreign key will be added to ${style.bold(name + ".ts")}.`
          );
        if (relType === "OneToMany")
          console.log(
            `   - Relation mapped from the ${style.bold(target + ".ts")} side.`
          );
        if (relType === "ManyToMany")
          console.log(`   - A join table will be created.`);
        if (relType === "OneToOne")
          console.log(
            `   - Unique foreign key added to ${style.bold(name + ".ts")}.`
          );
        console.log("");

        const { addInverse } = await inquirer.prompt([
          {
            type: "confirm",
            name: "addInverse",
            message: `Add inverse property in ${style.cyan(target)}?`,
            default: true,
          },
        ]);

        if (addInverse) {
          const isOneToOne = relationConfig.type === "OneToOne";
          const defaultInversedName = isOneToOne
            ? name.toLowerCase()
            : name.toLowerCase() + "s";

          const { inversedBy } = await inquirer.prompt([
            {
              type: "input",
              name: "inversedBy",
              message: `Property name in ${style.cyan(target)}:`,
              default: defaultInversedName,
            },
          ]);

          let inverseFieldCode = "";
          const targetProp = name.toLowerCase();

          if (isOneToOne) {
            inverseFieldCode = `\n    @OneToOne(() => ${name}, (${targetProp}) => ${targetProp}.${fieldName})\n    ${inversedBy}!: ${name};\n`;
          } else if (relType === "ManyToMany") {
            inverseFieldCode = `\n    @ManyToMany(() => ${name}, (${targetProp}) => ${targetProp}.${fieldName})\n    ${inversedBy}: ${name}[];\n`;
          } else if (relType === "ManyToOne") {
            inverseFieldCode = `\n    @OneToMany(() => ${name}, (${targetProp}) => ${targetProp}.${fieldName})\n    ${inversedBy}: ${name}[];\n`;
          } else {
            inverseFieldCode = `\n    @ManyToOne(() => ${name}, (${targetProp}) => ${targetProp}.${fieldName})\n    ${inversedBy}!: ${name};\n`;
          }

          Maker.updateExistingEntity(
            target,
            inverseFieldCode,
            `import { ${name} } from './${name}';\n`
          );
        }
      }

      fields.push({
        name: fieldName,
        type: fieldType,
        relation: relationConfig,
      });
      console.log(
        ` ${style.green("✔")} Field ${style.bold(fieldName)} added.\n`
      );
    }

    // --- GÉNÉRATION DU CODE ---
    let fieldsCode = "";
    let importsCode = "";

    for (const field of fields) {
      if (field.relation) {
        const { target, type } = field.relation;
        importsCode += `import { ${target} } from './${target}';\n`;
        switch (type) {
          case "ManyToOne":
            fieldsCode += `\n    @ManyToOne(() => ${target})\n    ${field.name}!: ${target};\n`;
            break;
          case "OneToMany":
            fieldsCode += `\n    @OneToMany(() => ${target}, (target) => target.${name.toLowerCase()})\n    ${
              field.name
            }!: ${target}[];\n`;
            break;
          case "ManyToMany":
            fieldsCode += `\n    @ManyToMany(() => ${target})\n    @JoinTable()\n    ${field.name}!: ${target}[];\n`;
            break;
          case "OneToOne":
            fieldsCode += `\n    @OneToOne(() => ${target})\n    @JoinColumn()\n    ${field.name}!: ${target};\n`;
            break;
        }
      } else {
        const tsType =
          field.type === "integer"
            ? "number"
            : field.type === "boolean"
            ? "boolean"
            : field.type === "datetime"
            ? "Date"
            : "string";
        fieldsCode += `\n    @Column()\n    ${field.name}!: ${tsType};\n`;
      }
    }

    Maker.generate("entity", `src/Entity/${name}.ts`, {
      name,
      fields: fieldsCode,
      imports: importsCode,
    });
    if (!fs.existsSync(`src/Repository/${name}Repository.ts`)) {
      Maker.generate("repository", `src/Repository/${name}Repository.ts`, {
        name,
      });
    }

    console.log(`\n ${style.green("Success!")}`);
    console.log(` ${style.cyan("created/updated")}: src/Entity/${name}.ts`);
    console.log(`\n Next: Run ${style.yellow("npm run make:migration")}`);
  } catch (e) {
    handleExit(e);
  }
  });

// program
//   .command("make:crud <name>")
//   .description("Génère un contrôleur CRUD complet")
//   .action((name) => {
//     const className = name.charAt(0).toUpperCase() + name.slice(1);
//     const fileName = `${className}Controller.ts`;
//     const nameLower = name.toLowerCase();

//     Maker.generate("crud_controller", `src/Controllers/Crud/${fileName}`, {
//       name: className,
//       nameLower: nameLower,
//     });

//     console.log(
//       `\x1b[32m SUCCESS \x1b[0m CRUD Controller created at src/Controllers/Crud/${fileName}`
//     );
//   });
program.parse();