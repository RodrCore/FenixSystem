import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig {
  constructor(private configService: ConfigService) {}

  getDatabaseUrl(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  getPrismaOptions() {
    const env = this.configService.get<string>('NODE_ENV') || 'development';
    
    return {
      log: env === 'development' 
        ? ['query', 'error', 'warn']
        : ['error'],
    };
  }
}