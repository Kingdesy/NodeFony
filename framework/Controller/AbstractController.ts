
// On pourrait automatiser l'accès aux Repos ici

export abstract class AbstractController {
    /**
     * Retourne une réponse JSON standardisée
     */
    protected json(data: any, statusCode: number = 200) {
        return {
            __isResponse: true,
            type: 'json',
            status: statusCode,
            data: data
        };
    }

    /**
     * Simulation du render de Symfony
     */
    protected render(template: string, parameters: any = {}) {
        return {
            __isResponse: true,
            type: 'render',
            template: template,
            data: parameters
        };
    }
}