import { Controller, Post } from "../../../framework/Routing/Decorators";
import { AbstractController } from "../../../framework/Controller/AbstractController";
import { UserRepo } from "../../Repository/UserRepository";
import { SecurityService } from "../../Services/SecurityService";
import { Request } from "../../../framework/Http/Request";

@Controller("/auth")
export class AuthController extends AbstractController {
  
  @Post("/login")
  async login(request: Request, res: any) {
    const { email, password } = request.getBody();
    
    // 1. Recherche de l'utilisateur
    const user = await UserRepo.findOneBy({ email } as any);

    if (
      !user ||
      !(await SecurityService.comparePassword(password, user.password))
    ) {
      return this.json({ error: "Invalid credentials" }, 401);
    }

    // 2. Génération du Token avec l'ID (très important pour le middleware)
    const token = SecurityService.generateToken({
      id: user.id,
      email: user.email,
    });

    // 3. Stockage dans le cookie httpOnly
    res.cookie("access_token", token, { 
        httpOnly: true,
        maxAge: 3600000 * 24, // 24 heures
        secure: process.env.NODE_ENV === 'production' // true seulement en HTTPS
    });

    return this.json({ message: "Connexion réussie", user: { email: user.email, name: user.name } });
  }

  @Post("/register")
  async register(request: Request) {
    const { email, password, name } = request.getBody();

    // Hachage du mot de passe
    const hashedPassword = await SecurityService.hashPassword(password);

    // Création de l'entité
    const user = UserRepo.create({
      email,
      password: hashedPassword,
      name,
    });

    // Sauvegarde en base de données
    await UserRepo.save(user);

    return this.json({ 
        message: "Compte créé avec succès",
        // userId: user.id 
    }, 201);
  }

  @Post("/logout")
  async logout(request: Request, res: any) {
    // Suppression du cookie
    res.clearCookie("access_token");
    return this.json({ message: "Déconnexion réussie" });
  }
}