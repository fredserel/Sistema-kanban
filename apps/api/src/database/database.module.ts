import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'kanban_user'),
        password: configService.get('DB_PASSWORD', 'kanban_pass'),
        database: configService.get('DB_NAME', 'kanban_db'),

        // Entities
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],

        // Migrations
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,

        // Synchronize (ONLY in development)
        synchronize: configService.get('NODE_ENV') === 'development',

        // Logging
        logging: configService.get('NODE_ENV') === 'development',
        logger: 'advanced-console',

        // Connection pool
        extra: {
          connectionLimit: 10,
        },

        // Timezone
        timezone: '-03:00', // Brasília
      }),
    }),
  ],
})
export class DatabaseModule {}
