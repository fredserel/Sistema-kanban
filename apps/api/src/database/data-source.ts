import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

export const AppDataSource = new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'app_user',
  password: process.env.DB_PASSWORD || 'app_pass',
  database: process.env.DB_NAME || 'kanban_db',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
