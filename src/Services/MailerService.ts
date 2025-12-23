import { Service } from '../../framework/Container/Decorators';
import { LoggerService } from './LoggerService';

@Service()
export class MailerService {
  // Autowiring : Le container verra que LoggerService est requis
  constructor(private logger: LoggerService) {}

  send(email: string) {
    this.logger.log(`Envoi d'un email à ${email}`);
  }
}