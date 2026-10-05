import { apiClient } from "../../../shared/api/apiClient";

import type {
  Campania,
  CrearCampaniaRequest,
  CrearLoteRequest,
  CrearLoteResponse,
  Fundo,
  LoteResumen,
  Variedad,
} from "../types/campania.types";


export async function obtenerCampanias(): Promise<Campania[]> {
  const response =
    await apiClient.get<Campania[]>(
      "/campanias"
    );

  return response.data;
}


export async function obtenerLotesPorCampania(
  idCampania: string
): Promise<LoteResumen[]> {
  const response =
    await apiClient.get<LoteResumen[]>(
      `/campanias/${idCampania}/lotes`
    );

  return response.data;
}


export async function obtenerFundos(): Promise<Fundo[]> {
  const response =
    await apiClient.get<Fundo[]>(
      "/fundos"
    );

  return response.data;
}


export async function obtenerVariedades(): Promise<Variedad[]> {
  const response =
    await apiClient.get<Variedad[]>(
      "/variedades"
    );

  return response.data;
}


export async function crearCampania(
  datos: CrearCampaniaRequest
): Promise<void> {
  await apiClient.post(
    "/campanias",
    datos
  );
}


export async function finalizarCampania(
  idCampania: string
): Promise<void> {
  await apiClient.put(
    `/campanias/${idCampania}/finalizar`
  );
}


export async function crearLote(
  idCampania: string,
  datos: CrearLoteRequest
): Promise<CrearLoteResponse> {
  const response =
    await apiClient.post<CrearLoteResponse>(
      `/campanias/${idCampania}/lotes`,
      datos
    );

  return response.data;
}