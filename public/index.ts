import "reflect-metadata"; // Important pour TypeORM et les décorateurs
import { Kernel } from "../framework/Kernel";
import 'dotenv/config';

const kernel = new Kernel();
kernel.boot(3000);