import "reflect-metadata";

export type Type<T> = new (...args: any[]) => T;

export class Container {
  private services = new Map<string, any>();

  /**
   * Résout une classe en instanciant ses dépendances récursivement
   */
  resolve<T>(target: Type<T>): T {
    // 1. Si le service est déjà instancié, on le retourne (Singleton par défaut comme Symfony)
    if (this.services.has(target.name)) {
      return this.services.get(target.name);
    }

    // 2. Récupérer les types des paramètres du constructeur via Reflect-metadata
    // 'design:paramtypes' est une clé spéciale gérée par TypeScript
    const tokens: any[] =
      Reflect.getMetadata("design:paramtypes", target) || [];

    // 3. Résoudre chaque dépendance (récursion)
    const injections = tokens.map((token: any) => {
      if (!token) {
        throw new Error(
          `Impossible de résoudre une dépendance pour ${target.name}. Vérifiez les imports circulaires.`
        );
      }
      return this.resolve(token);
    });

    // 4. Créer l'instance avec les dépendances injectées
    const instance = new target(...injections);

    // 5. Stocker pour les futurs appels
    this.services.set(target.name, instance);

    return instance;
  }
  setInstance(target: any, instance: any) {
    this.services.set(target.name, instance);
  }
}

// Instance unique du container pour toute l'application
export const container = new Container();
