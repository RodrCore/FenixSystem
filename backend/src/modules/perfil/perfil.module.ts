import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname }     from 'path';
import { PerfilService }    from './perfil.service';
import { PerfilController } from './perfil.controller';
import { PrismaModule } from '../../prisma/prisma.module';
 
@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/avatars',                   // carpeta local
        filename: (req, file, cb) => {
          const userId = (req as any).user?.id ?? 'unknown';
          const ts     = Date.now();
          const ext    = extname(file.originalname);
          cb(null, `user-${userId}-${ts}${ext}`);            // ej: user-4-1748839923123.jpg
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!/\.(jpg|jpeg|png|webp)$/i.test(file.originalname)) {
          return cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },                 // 5 MB
    }),
  ],
  controllers: [PerfilController],
  providers:   [PerfilService],
})
export class PerfilModule {}