// framework/Controller/AbstractController.ts
import { JsonResponse, Response } from '../Http/Response';

export abstract class AbstractController {
    protected json(data: object, status: number = 200): JsonResponse {
        return new JsonResponse(data, status);
    }

    protected render(content: string, status: number = 200): Response {
        // Désormais, les 3 arguments sont acceptés par le constructeur de Response
        return new Response(content, status, { 'Content-Type': 'text/html' });
    }
}