import { sincronizarTiemposPendientes } from "../../inspecciones/api/inspeccionesApi";
import { apiClient } from "../../../shared/api/apiClient";

import type {
  IndicadoresResumen,
} from "../types/indicadores.types";


export async function obtenerResumenIndicadores():
  Promise<IndicadoresResumen> {

  await sincronizarTiemposPendientes();
  const response =
    await apiClient.get<IndicadoresResumen>(
      "/indicadores/resumen"
    );

  return response.data;
}
export async function obtenerDetalleExactitud(
  filtros: { idCampania?: string; idLote?: string; desde?: string; hasta?: string },
  signal?: AbortSignal,
): Promise<import('../types/indicadores.types').ExactitudDetalle> {
  const response = await apiClient.get('/indicadores/exactitud', { params: filtros, signal });
  return response.data;
}

export async function obtenerDetalleTiempo(
  filtros: { idCampania?: string; idLote?: string; desde?: string; hasta?: string },
  signal?: AbortSignal,
): Promise<import('../types/indicadores.types').TiempoDetalle> {
  const response = await apiClient.get('/indicadores/tiempo', { params: filtros, signal });
  return response.data;
}

export async function obtenerDetalleErrores(
  filtros: { idCampania?: string; idLote?: string; desde?: string; hasta?: string; pagina?: number },
  signal?: AbortSignal,
): Promise<import('../types/indicadores.types').ErroresDetalle> {
  const response = await apiClient.get('/indicadores/errores', { params: filtros, signal });
  return response.data;
}
