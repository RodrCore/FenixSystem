import { Module } from '@nestjs/common';
import { BoletasService }    from './boletas.service';
import { BoletasController } from './boletas.controller';
import { PrismaModule } from '../../prisma/prisma.module';
 
@Module({
  imports:     [PrismaModule],
  controllers: [ BoletasController ],
  providers:   [ BoletasService ],
  exports:     [ BoletasService ],
})
export class BoletasModule {}
