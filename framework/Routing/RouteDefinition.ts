export interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  action: string; // Nom de la méthode dans la classe
}