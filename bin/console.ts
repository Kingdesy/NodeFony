import { Command } from "commander";
import inquirer from "inquirer";
import { AppDataSource } from "../data-source";
import { Router } from "../framework/Routing/Router";
import { ControllerLoader } from "../framework/Routing/ControllerLoader";
import path from "path";
import { Maker } from "../framework/Maker/Maker";

const program = new Command();

program
  .name("symfonode-console")
  .description("CLI pour le framework SymfoNode")
  .version("1.0.0");

program
  .command("make:migration")
  .alias("make:mig") // Optionnel
  .description("Génère une nouvelle migration")
  .action(() => {
    const timestamp = Date.now();
    console.log("⏳ Génération de la migration...");
    try {
        // Utilise execSync pour lancer la commande TypeORM réelle
        require('child_process').execSync(
            `npx typeorm-ts-node-commonjs migration:generate src/Migration/Migration${timestamp} -d data-source.ts`, 
            { stdio: 'inherit' }
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
  .command("make:controller <name>")
  .description("Génère un nouveau contrôleur")
  .action((name) => {
    try {
      const slug = name.toLowerCase();
      const fileName = `${name}Controller.ts`;
      const targetPath = `src/Controllers/${fileName}`;

      console.log(`✨ Génération de : ${targetPath}...`);

      Maker.generate("controller", targetPath, {
        name: name,
        slug: slug,
      });

      console.log(`✅ [OK] Le contrôleur ${name}Controller a été créé !`);
      console.log(
        `💡 N'oubliez pas de relancer le serveur pour voir la route /${slug}`
      );
    } catch (e: any) {
      console.error(`❌ Erreur : ${e.message}`);
    }
  });

program
  .command("make:entity <rawName>") // 1. On change 'name' en 'rawName' ici
  .description("Génère ou modifie une entité interactivement")
  .action(async (rawName) => {
    // 2. On formate le nom proprement (ex: user -> User)
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    
    // Styling façon Symfony
    const style = {
      cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
      yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
      green: (t: string) => `\x1b[32m${t}\x1b[0m`,
      bold: (t: string) => `\x1b[1m${t}\x1b[22m`,
    };

    console.log(`\n ${style.green(style.bold("Your entity already exists! So let's add some new fields!"))}`);
    console.log(`\n ${style.cyan(name)} entity, add your properties!`); // Utilise 'name' formaté ici

    const fields: any[] = [];
    let addMore = true;

    while (addMore) {
      const { fieldName } = await inquirer.prompt([{
          type: "input",
          name: "fieldName",
          message: style.yellow("New property name (press <return> to stop): \n"),
      }]);

      if (!fieldName) { addMore = false; break; }

      const { fieldType } = await inquirer.prompt([{
          type: "list",
          name: "fieldType",
          message: `Field type for ${style.cyan(fieldName)}:`,
          choices: ["string", "text", "integer", "boolean", "relation"],
      }]);

      let relationConfig: any = null;

      if (fieldType === "relation") {
        const { target } = await inquirer.prompt([{
            type: "input",
            name: "target",
            message: style.yellow("What entity should the relationship be with?"),
        }]);

        const { relType } = await inquirer.prompt([{
            type: "list",
            name: "relType",
            message: `Which type of relation is it?`,
            choices: [
              "ManyToOne (Each Post relates to one User)",
              "OneToMany (Each User relates to many Posts)",
              "ManyToMany (Many Posts relate to many Tags)",
              "OneToOne (Each User relates to one Profile)",
            ],
        }]);

        relationConfig = { target, type: relType.split(" ")[0] };

        const { addInverse } = await inquirer.prompt([{
            type: "confirm",
            name: "addInverse",
            message: `Do you want to add a new property to ${style.cyan(target)}?`,
            default: true,
        }]);

        if (addInverse) {
          const isOneToOne = relationConfig.type === "OneToOne";
          const isManyToMany = relationConfig.type === "ManyToMany"; // AJOUT ICI

          const defaultInversedName = isOneToOne
            ? name.toLowerCase()
            : name.toLowerCase() + "s";

          const { inversedBy } = await inquirer.prompt([{
              type: "input",
              name: "inversedBy",
              message: `New property name in ${style.cyan(target)}:`,
              default: defaultInversedName,
          }]);

          let inverseFieldCode = "";
          // --- LOGIQUE CORRIGÉE ICI ---
          if (isOneToOne) {
            inverseFieldCode = `\n    @OneToOne(() => ${name}, (${name.toLowerCase()}) => ${name.toLowerCase()}.${fieldName})\n    ${inversedBy}!: ${name};\n`;
          } else if (isManyToMany) {
            inverseFieldCode = `\n    @ManyToMany(() => ${name}, (${name.toLowerCase()}) => ${name.toLowerCase()}.${fieldName})\n    ${inversedBy}: ${name}[];\n`;
          } else {
            inverseFieldCode = `\n    @OneToMany(() => ${name}, (${name.toLowerCase()}) => ${name.toLowerCase()}.${fieldName})\n    ${inversedBy}: ${name}[];\n`;
          }

          const inverseImportCode = `import { ${name} } from './${name}';\n`;
          Maker.updateExistingEntity(target, inverseFieldCode, inverseImportCode);
        }
      }

      fields.push({ name: fieldName, type: fieldType, relation: relationConfig });
    }

    // --- LOGIQUE DE GÉNÉRATION ---
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
            fieldsCode += `\n    @OneToMany(() => ${target}, (target) => target.${name.toLowerCase()})\n    ${field.name}!: ${target}[];\n`;
            break;
          case "ManyToMany":
            fieldsCode += `\n    @ManyToMany(() => ${target})\n    @JoinTable()\n    ${field.name}!: ${target}[];\n`; 
            break;
          case "OneToOne":
            fieldsCode += `\n    @OneToOne(() => ${target})\n    @JoinColumn()\n    ${field.name}!: ${target};\n`;
            break;
        }
      } else {
        const tsType = field.type === "integer" ? "number" : "string";
        fieldsCode += `\n    @Column()\n    ${field.name}!: ${tsType};\n`;
      }
    }

    // --- GÉNÉRATION FINALE ---
    Maker.generate("entity", `src/Entity/${name}.ts`, { name, fields: fieldsCode, imports: importsCode });
    Maker.generate("repository", `src/Repository/${name}Repository.ts`, { name });

    console.log(`\n ${style.green("Success!")}`);
    console.log(` ${style.cyan('created/updated')}: src/Entity/${name}.ts`);
    console.log(` ${style.cyan('created')}: src/Repository/${name}Repository.ts`);
    console.log(`\n Next: Run ${style.yellow("npm run make:migration")}`);
  });

  program
  .command("make:crud <name>")
  .description("Génère un contrôleur CRUD complet")
  .action((name) => {
    const className = name.charAt(0).toUpperCase() + name.slice(1);
    const fileName = `${className}Controller.ts`;
    const nameLower = name.toLowerCase();

    Maker.generate("crud_controller", `src/Controllers/Crud/${fileName}`, {
      name: className,
      nameLower: nameLower
    });

    console.log(`\x1b[32m SUCCESS \x1b[0m CRUD Controller created at src/Controllers/Crud/${fileName}`);
  });
program.parse();



