export interface Usuario {
  id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  numero_empleado: string;
  telefono: string;
  avatar_url: string;
  rol: {
    id: number;
    nombre: string;
    descripcion: string;
    permisos: Record<string, any>;
  };
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: Record<string, any>;
}

export interface RolesEnum {
  SUPER_ADMIN: string;
  ADMIN: string;
  GERENTE: string;
  PREVENTISTA: string;
  ALMACEN: string;
  REPARTIDOR: string;
}

export const ROLES: RolesEnum = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  GERENTE: 'GERENTE',
  PREVENTISTA: 'PREVENTISTA',
  ALMACEN: 'ALMACEN',
  REPARTIDOR: 'REPARTIDOR',
};