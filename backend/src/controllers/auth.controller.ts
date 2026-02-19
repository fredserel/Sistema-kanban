import { Request, Response } from 'express';
import { login, register, getUserById } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
    }

    const result = await login({ email, password });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao fazer login';
    res.status(401).json({ error: message });
  }
}

export async function registerController(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password, name, roleId } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome sao obrigatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const user = await register({ email, password, name, roleId }, req.user?.permissions);
    res.status(201).json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar usuario';
    res.status(400).json({ error: message });
  }
}

export async function meController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const user = await getUserById(req.user.userId);
    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar usuario';
    res.status(400).json({ error: message });
  }
}

export async function logoutController(req: Request, res: Response) {
  // JWT e stateless, entao o logout e feito no frontend removendo o token
  res.json({ message: 'Logout realizado com sucesso' });
}
