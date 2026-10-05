import { apiClient } from "../../../shared/api/apiClient";
import type { LoteMapa } from "../types/mapa.types";

export async function obtenerMapaLote(
  idLote: string
): Promise<LoteMapa> {
  const response =
    await apiClient.get<LoteMapa>(
      `/lotes/${idLote}/mapa`
    );

  return response.data;
}

export interface HistorialImagen {
  idImagen: string;
  nombreOriginal: string;
  rutaStorage: string;
  urlImagen: string | null;
  mimeType: string | null;
  pesoBytes: number | null;
  fechaCaptura: string | null;
  fechaRegistro: string;
}

export interface HistorialDiagnostico {
  idDiagnostico: string;
  idImagen: string;
  idModelo: string;
  modelo: string;
  idClasePredicha: string;
  arquitectura: string;
  codigoClasePredicha: string;
  clasePredicha: string;
  codigoClaseReal: string | null;
  claseReal: string | null;
  confianza: number | null;
  tiempoInferenciaMs: number | null;
  tiempoTotalMs: number | null;
  validado: boolean;
  fechaDiagnostico: string;
  observaciones: string | null;
  nombreUsuario: string;
 correoUsuario: string;
}

export interface HistorialInspeccion {
  idInspeccion: string;
  idUsuario: string;

  nombreUsuario: string;
  correoUsuario: string;

  fechaInicio: string;
  fechaFin: string | null;
  estado: string;
  observaciones: string | null;

  imagenes: HistorialImagen[];
  diagnosticos: HistorialDiagnostico[];
}

export interface HistorialPlanta {
  idPlanta: string;
  totalInspecciones: number;
  inspecciones: HistorialInspeccion[];
}

export async function obtenerHistorialPlanta(
  idPlanta: string
): Promise<HistorialPlanta> {
  const response =
    await apiClient.get<HistorialPlanta>(
      `/plantas/${idPlanta}/historial`
    );

  return response.data;
}

export interface UltimaInspeccionPlanta {
  idInspeccion: string;
  idDiagnostico: string;
  idUsuario: string;

  nombreUsuario: string;
  correoUsuario: string;

  fechaInspeccion: string;
  fechaDiagnostico: string;

  codigoDiagnostico: string;
  diagnostico: string;

  confianza: number | null;

  modelo: string;
  arquitectura: string;

  tiempoInferenciaMs: number | null;
  tiempoTotalMs: number | null;

  idImagen: string;
  urlImagen: string | null;
  nombreImagen: string;
}

export async function obtenerUltimaInspeccionPlanta(
  idPlanta: string
): Promise<UltimaInspeccionPlanta | null> {
  try {
    const response =
      await apiClient.get(
        `/plantas/${idPlanta}/ultima-inspeccion`
      );

    return response.data;
  } catch (error: any) {
    if (
      error?.response?.status === 404
    ) {
      return null;
    }

    throw error;
  }
}