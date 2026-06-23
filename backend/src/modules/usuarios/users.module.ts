import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './user.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // ✅ Exportar para otros módulos
})
export class UsersModule {}