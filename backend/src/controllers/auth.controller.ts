import { Request, Response } from 'express';
import { login, register, getUserById } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
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
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const user = await register({ email, password, name, role }, req.user?.role);
    res.status(201).json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar usuário';
    res.status(400).json({ error: message });
  }
}

export async function meController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = await getUserById(req.user.userId);
    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar usuário';
    res.status(400).json({ error: message });
  }
}

export async function logoutController(req: Request, res: Response) {
  // JWT é stateless, então o logout é feito no frontend removendo o token
  res.json({ message: 'Logout realizado com sucesso' });
}
