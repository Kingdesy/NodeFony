import "reflect-metadata";
import { Request } from "./Request";
import type { Type } from "../Container/Container";

export class ArgumentResolver {
  resolveArguments(
    target: any,
    methodName: string,
    request: Request,
    params: string[] = []
  ): any[] {
    const argTypes: any[] =
      Reflect.getMetadata("design:paramtypes", target, methodName) || [];
    let paramIndex = 0;

    return argTypes.map((type) => {
      if (type === Request) return request;

      // Si c'est un String et qu'il nous reste des paramètres d'URL
      if (type === String && params[paramIndex] !== undefined) {
        return params[paramIndex++];
      }

      return undefined;
    });
  }
}
