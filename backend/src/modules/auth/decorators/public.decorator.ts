import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador para marcar una ruta como pública
 * No requiere autenticación
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);