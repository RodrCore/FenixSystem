import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { VehiculosController } from './vehiculos.controller';
import { VehiculosService } from './vehiculos.service';

@Module({
  imports:     [PrismaModule],
  controllers: [VehiculosController],
  providers:   [VehiculosService],
  exports:     [VehiculosService],
})
export class VehiculosModule {}
