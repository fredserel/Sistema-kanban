export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'app_user',
    password: process.env.DB_PASSWORD || 'app_pass',
    name: process.env.DB_NAME || 'kanban_db',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});
