import { Response } from 'express';
import { getAllUsers } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export async function getUsersController(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar usuários';
    res.status(400).json({ error: message });
  }
}
