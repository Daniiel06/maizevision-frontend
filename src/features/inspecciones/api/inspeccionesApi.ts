import { apiClient } from "../../../shared/api/apiClient";

import type {
  IniciarInspeccionRequest,
  IniciarInspeccionResponse,
} from "../types/inspeccion.types";


export async function iniciarInspeccion(
  request: IniciarInspeccionRequest
): Promise<IniciarInspeccionResponse> {
  const response =
    await apiClient.post<IniciarInspeccionResponse>(
      "/inspecciones",
      request
    );

  return response.data;
}


export interface SubirImagenResponse {
  idImagen: string;
  idInspeccion: string;
  nombreOriginal: string;
  rutaStorage: string;
  mimeType: string;
  pesoBytes: number;
}


export async function subirImagenInspeccion(
  idInspeccion: string,
  archivo: File
): Promise<SubirImagenResponse> {
  const formData = new FormData();

  formData.append(
    "archivo",
    archivo
  );

  const response =
    await apiClient.post<SubirImagenResponse>(
      `/inspecciones/${idInspeccion}/imagenes`,
      formData
    );

  return response.data;
}


export interface AnalizarImagenResponse {
  idDiagnostico: string;
  idInspeccion: string;
  idImagen: string;
  codigoClase: string;
  nombreClase: string;
  confianza: number;
  tiempoInferenciaMs: number;
  tiempoTotalMs: number;
}



export async function analizarImagen(
  idInspeccion: string,
  idImagen: string,
  archivo: File
): Promise<AnalizarImagenResponse> {
  const formData = new FormData();

  formData.append(
    "idInspeccion",
    idInspeccion
  );

  formData.append(
    "idImagen",
    idImagen
  );

  formData.append(
    "archivo",
    archivo
  );

  const response =
    await apiClient.post<AnalizarImagenResponse>(
      "/diagnosticos/analizar",
      formData
    );

  return response.data;


  
}


export interface ValidarDiagnosticoRequest {
  idClaseReal: string;
  observaciones?: string;
}

export interface ValidarDiagnosticoResponse {
  mensaje: string;
}

export async function validarDiagnostico(
  idDiagnostico: string,
  request: ValidarDiagnosticoRequest
): Promise<ValidarDiagnosticoResponse> {
  const response =
    await apiClient.put<ValidarDiagnosticoResponse>(
      `/diagnosticos/${idDiagnostico}/validar`,
      request
    );

  return response.data;
}

export interface ClaseDiagnosticoResponse {
  idClase: string;
  codigo: string;
  nombre: string;
  tipo: string;
}

export async function obtenerClasesDiagnostico():
  Promise<ClaseDiagnosticoResponse[]> {
  const response =
    await apiClient.get<ClaseDiagnosticoResponse[]>(
      "/diagnosticos/clases"
    );

  return response.data;
}