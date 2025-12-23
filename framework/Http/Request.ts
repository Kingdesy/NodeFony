import { IncomingMessage } from 'http';
import { URL } from 'url';

export class Request {
  public query: URLSearchParams;
  public path: string;
  private body: any = null;

  // Un seul constructeur qui initialise tout
  constructor(private rawRequest: IncomingMessage) {
    const host = rawRequest.headers.host || 'localhost';
    const baseUrl = `http://${host}`;
    const parsedUrl = new URL(rawRequest.url || '/', baseUrl);
    
    this.path = parsedUrl.pathname;
    this.query = parsedUrl.searchParams;
  }

  getMethod(): string {
    return this.rawRequest.method || 'GET';
  }

  /**
   * Lit le corps de la requête (flux Stream) et le transforme en JSON.
   * C'est l'équivalent du $request->getContent() ou $request->toArray() de Symfony.
   */
  async getPayload(): Promise<any> {
    if (this.body) return this.body;

    return new Promise((resolve, reject) => {
      let accumateur = '';

      this.rawRequest.on('data', (chunk) => {
        accumateur += chunk;
      });

      this.rawRequest.on('end', () => {
        try {
          // Si le body est vide, on retourne un objet vide
          this.body = accumateur ? JSON.parse(accumateur) : {};
          resolve(this.body);
        } catch (err) {
          // En cas de JSON mal formé
          resolve({});
        }
      });

      this.rawRequest.on('error', (err) => {
        reject(err);
      });
    });
  }

  static createFromGlobals(req: IncomingMessage): Request {
    return new Request(req);
  }
}