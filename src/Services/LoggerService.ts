import { Service } from '../../framework/Container/Decorators';

@Service()
export class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${new Date().toISOString()} : ${message}`);
  }
}