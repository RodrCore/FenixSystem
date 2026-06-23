import { inject }            from '@angular/core';
import { CanActivateFn }     from '@angular/router';
import { NavController, ToastController } from '@ionic/angular/standalone';
import { AuthService }       from '../services/auth.service';
 
/**
 * Guard que valida que el usuario tenga al menos uno de los roles permitidos.
 * Uso: canActivate: [authGuard, roleGuard(['SUPER_ADMIN','ADMIN','PREVENTISTA'])]
 */
export const roleGuard = (rolesPermitidos: string[]): CanActivateFn => {
  return async () => {
    const auth  = inject(AuthService);
    const nav   = inject(NavController);
    const toast = inject(ToastController);
 
    if (!auth.isAuthenticated()) {
      nav.navigateRoot('/login');
      return false;
    }
 
    if (!auth.hasRole(...rolesPermitidos)) {
      // Mensaje al usuario y redirección al dashboard
      const t = await toast.create({
        message:  'No tienes permiso para acceder a esta sección',
        duration: 2200, position: 'top', color: 'warning',
      });
      await t.present();
      nav.navigateRoot('/dashboard');
      return false;
    }
 
    return true;
  };
};