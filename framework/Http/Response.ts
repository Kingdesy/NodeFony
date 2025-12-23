export class Response {
  constructor(
    public content: string | object,
    public statusCode: number = 200,
    // On ajoute le 3ème argument ici :
    public headers: Record<string, string> = { 'Content-Type': 'text/html' }
  ) {}

  send(res: any) {
    // On écrit les en-têtes avant d'envoyer le contenu
    res.writeHead(this.statusCode, this.headers);
    
    const body = typeof this.content === 'object' 
      ? JSON.stringify(this.content) 
      : this.content;
      
    res.end(body);
  }
}

export class JsonResponse extends Response {
  constructor(data: object, status = 200) {
    // Ici, on force le header en JSON
    super(data, status, { 'Content-Type': 'application/json' });
  }
}