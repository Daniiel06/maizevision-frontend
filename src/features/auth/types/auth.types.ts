export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  idUsuario: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
}