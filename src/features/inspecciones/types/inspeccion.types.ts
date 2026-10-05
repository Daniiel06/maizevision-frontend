export interface IniciarInspeccionRequest {
  idPlanta: string;
  observaciones?: string;
}

export interface IniciarInspeccionResponse {
  idInspeccion: string;
  idPlanta: string;
  idUsuario: string;
  fechaInicio: string;
  estado: string;
}