import { apiClient } from "../../../shared/api/apiClient";

import type {
  ClimaFundo,
} from "../types/clima.types";


export async function obtenerClimaFundo(
  idFundo: string,
  dias: 7 | 14,
  signal?: AbortSignal
): Promise<ClimaFundo> {
  const response =
    await apiClient.get<ClimaFundo>(
      `/clima/fundos/${idFundo}`,
      {
        signal,
        timeout: 45000,
        params: {
          dias,
        },
      }
    );

  return response.data;
}
