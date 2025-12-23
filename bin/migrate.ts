import { AppDataSource } from "../data-source";

async function run() {
    console.log("⏳ Application des migrations...");
    
    try {
        await AppDataSource.initialize();
        const migrations = await AppDataSource.runMigrations();
        
        if (migrations.length === 0) {
            console.log("✅ La base de données est déjà à jour.");
        } else {
            migrations.forEach(m => console.log(`  └─ [OK] ${m.name} exécutée.`));
            console.log(`\n🚀 Succès : ${migrations.length} migration(s) appliquée(s).`);
        }
        
        await AppDataSource.destroy();
    } catch (error) {
        console.error("❌ Erreur lors de la migration :", error);
        process.exit(1);
    }
}

run();