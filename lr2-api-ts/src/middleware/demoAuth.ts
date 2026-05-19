import type { Request, Response, NextFunction } from "express";
import { usersRepository } from "../repositories/users.repository.js";

/**
 * Middleware для демо-автентифікації через X-Demo-UserId заголовок.
 * Це спрощена версія для Lab 5 без повноцінної системи логіну.
 *
 * Вимоги:
 * - Клієнт передає X-Demo-UserId: <id>
 * - Якщо заголовка немає → 401 Unauthorized
 * - Якщо користувач не існує → 401 Unauthorized
 */
export function demoAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.header("X-Demo-UserId");

  if (!userId) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing X-Demo-UserId header", details: [] }
    });
    return;
  }

  // Валідація формату: userId мав бути числом
  const id = Number(userId);
  if (Number.isNaN(id)) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid X-Demo-UserId format", details: [] }
    });
    return;
  }

  // Перевірка, що такий користувач існує
  const user = usersRepository.getById(id);
  if (!user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "User not found", details: [] }
    });
    return;
  }

  // Збереження користувача в контекст запиту
  req.user = { id: user.id, role: "user" };
  next();
}

// Розширення типу Express Request для типізації currentUser
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role?: string };
    }
  }
}
