import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReabastecimientoController } from './reabastecimiento.controller';
import { ReabastecimientoService } from './reabastecimiento.service';
import { ReabastecimientoPdfService } from './reabastecimiento-pdf.service';
 
@Module({
  imports: [PrismaModule],
  controllers: [ReabastecimientoController],
  providers: [ReabastecimientoService, ReabastecimientoPdfService],
  exports: [ReabastecimientoService],
})
export class ReabastecimientoModule {}
