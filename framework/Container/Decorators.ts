import 'reflect-metadata';

/**
 * Décorateur @Service
 * Il permet de marquer une classe comme étant injectable.
 * En Symfony, cela équivaut à déclarer un service dans services.yaml ou avec #[AsService]
 */
export function Service(): ClassDecorator {
  return (target: Function) => {
    // On peut stocker une métadonnée pour confirmer que c'est un service géré par notre framework
    Reflect.defineMetadata('custom:service', true, target);
    
    // Log optionnel pour le debug du framework
    // console.log(`[Framework] Service enregistré : ${target.name}`);
  };
}