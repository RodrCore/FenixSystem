import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error(
        '❌ DATABASE_URL no está definida en .env. Verifica tu archivo .env',
      );
    }
    // Prisma 6: Configuración simple
    super({
      log:
        configService.get<string>('NODE_ENV') === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma conectado a PostgreSQL');
    } catch (error) {
      console.error('❌ Error conectando a Prisma:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  getClient(): PrismaClient {
    return this;
  }
}
