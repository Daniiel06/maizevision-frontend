import { apiClient } from '../../../shared/api/apiClient';
export type RolUsuario = 'ADMINISTRADOR' | 'SUPERVISOR' | 'EVALUADOR';
export interface Usuario {
    idUsuario: string;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: RolUsuario;
    activo: boolean;
    ultimoAcceso: string | null;
}
export interface CrearUsuario {
    nombres: string;
    apellidos: string;
    correo: string;
    password: string;
    rol: RolUsuario;
}
export const usuariosApi = {
    listar: async () => (await apiClient.get<Usuario[]>('/usuarios')).data,
    crear: async (r: CrearUsuario) => (await apiClient.post<Omit<Usuario, 'ultimoAcceso'>>('/usuarios', r)).data,
    estado: async (id: string, activo: boolean) => apiClient.patch('/usuarios/' + id + '/estado', { activo })
};
