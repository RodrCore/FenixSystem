import { Module } from '@nestjs/common';
import { OsrmService }         from './osrm.service';
import { RoutingController }   from './routing.controller';
 
@Module({
  controllers: [RoutingController],
  providers:   [OsrmService],
  exports:     [OsrmService],
})
export class RoutingModule {}