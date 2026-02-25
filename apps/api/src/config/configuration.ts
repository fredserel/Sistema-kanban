const isProduction = process.env.NODE_ENV === 'production';

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value && isProduction) {
    throw new Error(`Environment variable ${key} is required in production`);
  }
  return value || fallback || '';
}

export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),

  database: {
    host: requireEnv('DB_HOST', 'localhost'),
    port: parseInt(requireEnv('DB_PORT', '3306'), 10),
    username: requireEnv('DB_USERNAME', isProduction ? undefined : 'kanban'),
    password: requireEnv('DB_PASSWORD', isProduction ? undefined : 'kanban123'),
    name: requireEnv('DB_NAME', 'kanban_db'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET', isProduction ? undefined : 'dev-jwt-secret-do-not-use-in-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: requireEnv('JWT_REFRESH_SECRET', process.env.JWT_SECRET || (isProduction ? undefined : 'dev-refresh-secret')),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cors: {
    origin: requireEnv('CORS_ORIGIN', isProduction ? undefined : 'http://localhost:3000'),
  },
});
