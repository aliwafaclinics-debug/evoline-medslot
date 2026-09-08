import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { ClinicsModule } from './modules/clinics/clinics.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { SlotsModule } from './modules/slots/slots.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    // Config — loads .env and makes it available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database — TypeORM with PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // Rate limiting — 100 req/min globally, 10/min on auth endpoints
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [{
          ttl: configService.get('THROTTLE_TTL', 60) * 1000,
          limit: configService.get('THROTTLE_LIMIT', 100),
        }],
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    ClinicsModule,
    DoctorsModule,
    SlotsModule,
    BookingsModule,
    InquiriesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
