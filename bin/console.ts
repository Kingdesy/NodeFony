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
  .command("make:entity <name>")
  .description("Génère ou modifie une entité interactivement")
  .action(async (name) => {
    // Styling façon Symfony
    const style = {
      cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
      yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
      green: (t: string) => `\x1b[32m${t}\x1b[0m`,
      bold: (t: string) => `\x1b[1m${t}\x1b[22m`,
    };

    console.log(
      `\n ${style.green(
        style.bold("Your entity already exists! So let's add some new fields!")
      )}`
    );
    console.log(`\n ${style.cyan("Post")} entity, add your properties!`);
    console.log(` (press <return> to stop adding fields)`);

    const fields: {
      name: string;
      type: string;
      targetEntity?: string;
      relation?: any;
    }[] = [];
    let addMore = true;

    while (addMore) {
      console.log("");
      const { fieldName } = await inquirer.prompt([
        {
          type: "input",
          name: "fieldName",
          message: style.yellow(
            "New property name (press <return> to stop adding fields):"
          ),
        },
      ]);

      if (!fieldName) {
        addMore = false;
        break;
      }

      const { fieldType } = await inquirer.prompt([
        {
          type: "list",
          name: "fieldType",
          message: `Field type for ${style.cyan(fieldName)}:`,
          choices: ["string", "text", "integer", "boolean", "relation"],
        },
      ]);

      let targetEntity = "";
      let relationConfig: any = null;

      if (fieldType === "relation") {
        const { target } = await inquirer.prompt([
          {
            type: "input",
            name: "target",
            message: style.yellow(
              "What entity should the relationship be with?"
            ),
          },
        ]);

        const { relType } = await inquirer.prompt([
          {
            type: "list",
            name: "relType",
            message: `Which type of relation is it?`,
            choices: [
              "ManyToOne (Each Post relates to one User)",
              "OneToMany (Each User relates to many Posts)",
              "ManyToMany (Many Posts relate to many Tags)",
              "OneToOne (Each User relates to one Profile)",
            ],
          },
        ]);

        relationConfig = {
          target: target,
          type: relType.split(" ")[0], // On récupère juste "ManyToOne", etc.
        };

        console.log(
          `\n ${style.green("OK!")} Setting up a ${style.bold(
            relationConfig.type
          )} relation.\n`
        );

        const { addInverse } = await inquirer.prompt([
          {
            type: "confirm",
            name: "addInverse",
            message: `Do you want to add a new property to ${style.cyan(
              target
            )} so that you can access/update ${style.cyan(
              name
            )} objects from it?`,
            default: true,
          },
        ]);

        if (addInverse) {
          const isOneToOne = relationConfig.type === "OneToOne";

          // Si c'est OneToOne, le nom inversé est au singulier (ex: user)
          // Sinon c'est au pluriel (ex: posts)
          const defaultInversedName = isOneToOne
            ? name.toLowerCase()
            : name.toLowerCase() + "s";

          const { inversedBy } = await inquirer.prompt([
            {
              type: "input",
              name: "inversedBy",
              message: `New property name in ${style.cyan(target)}:`,
              default: defaultInversedName,
            },
          ]);

          // LOGIQUE DE GÉNÉRATION DYNAMIQUE
          let inverseFieldCode = "";
          if (isOneToOne) {
            // Côté inverse d'un OneToOne (sans @JoinColumn car il est déjà sur l'autre entité)
            inverseFieldCode = `\n    @OneToOne(() => ${name}, (${name.toLowerCase()}) => ${name.toLowerCase()}.${fieldName})\n    ${inversedBy}!: ${name};\n`;
          } else {
            // Cas classique : ManyToOne devient OneToMany
            inverseFieldCode = `\n    @OneToMany(() => ${name}, (${name.toLowerCase()}) => ${name.toLowerCase()}.${fieldName})\n    ${inversedBy}!: ${name}[];\n`;
          }

          const inverseImportCode = `import { ${name} } from './${name}';\n`;
          Maker.updateExistingEntity(
            target,
            inverseFieldCode,
            inverseImportCode
          );

          console.log(
            `\n ${style.green("updated")}: ${style.cyan(
              "src/Entity/" + target + ".ts"
            )} has been modified.`
          );
        }
      }

      fields.push({
        name: fieldName,
        type: fieldType,
        relation: relationConfig,
      });

      console.log(
        `\n ${style.green(
          "updated"
        )}: add another property or press <return> to save and generate`
      );
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
            // Attention: OneToMany nécessite une propriété inverse dans l'autre classe
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
        // ... (logique standard pour string/integer)
        const tsType = field.type === "integer" ? "number" : "string";
        fieldsCode += `\n    @Column()\n    ${field.name}!: ${tsType};\n`;
      }
    }

    // Appel au Maker
    Maker.generate("entity", `src/Entity/${name}.ts`, {
      name: name,
      fields: fieldsCode,
      imports: importsCode,
    });

    Maker.generate("repository", `src/Repository/${name}Repository.ts`, {
      name,
    });

    console.log(`\n ${style.green("Success!")}`);
    console.log(
      ` Next: When you're ready, run ${style.yellow(
        "npm run make:migration"
      )} to create the migration.`
    );
  });

program.parse();
