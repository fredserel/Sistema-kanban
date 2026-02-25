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
        host: configService.get('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),

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
