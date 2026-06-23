import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrackingGateway } from './tracking.gateway';
 
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_SECRET'),
      }),
    }),
  ],
  providers: [ TrackingGateway ],
  exports:   [ TrackingGateway ],
})
export class TrackingModule {}