import { apiClient } from "../../../shared/api/apiClient";

import type {
  IndicadoresResumen,
} from "../types/indicadores.types";


export async function obtenerResumenIndicadores():
  Promise<IndicadoresResumen> {

  const response =
    await apiClient.get<IndicadoresResumen>(
      "/indicadores/resumen"
    );

  return response.data;
}