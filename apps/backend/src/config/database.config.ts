import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  database: configService.get('DB_NAME', 'evoline_medslot'),
  username: configService.get('DB_USER', 'postgres'),
  password: configService.get('DB_PASSWORD', ''),
  ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,

  // Auto-load all entities in the modules
  autoLoadEntities: true,

  // NEVER use synchronize in production — use migrations
  synchronize: configService.get('NODE_ENV') === 'development',

  // Logging — queries in dev only
  logging: configService.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],

  // Connection pool settings
  extra: {
    max: 20,          // Max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});

// Standalone DataSource for CLI migrations
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'evoline_medslot',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
} as DataSourceOptions);
