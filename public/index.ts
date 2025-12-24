// import { MailerService } from './../src/Services/MailerService';
// import { container } from '../framework/Container/Container';

// // On demande le MailerService au container
// const mailer = container.resolve(MailerService);

// mailer.send('test@symfony-js.com');

// import { Kernel } from '../framework/Kernel';

// const kernel = new Kernel();
// const port = 3000;

// kernel.listen(port, () => {
//   console.log(`🚀 Serveur SymfoNode démarré sur http://localhost:${port}`);
// });

// import { Kernel } from '../framework/Kernel';
// import { HelloController } from '../src/Controllers/HelloController';

// const kernel = new Kernel();
// // En vrai, on ferait un auto-scanner de fichiers, mais restons simple :
// kernel.registerControllers([HelloController]);

// kernel.listen(3000, () => console.log('🚀 SymfoNode sur http://localhost:3000'));

import "reflect-metadata"; // Important pour TypeORM et les décorateurs
import { Kernel } from "../framework/Kernel";
import 'dotenv/config';

const kernel = new Kernel();
kernel.boot(3000);