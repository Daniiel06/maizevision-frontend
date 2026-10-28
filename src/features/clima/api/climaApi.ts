import { apiClient } from "../../../shared/api/apiClient";
import axios from "axios";
import type { Fundo } from "../../fundos/types/fundo.types";
import { obtenerClimaDirecto } from "./climaDirecto";

import type {
  ClimaFundo,
} from "../types/clima.types";


export async function obtenerClimaFundo(
  idFundo: string,
  dias: 7 | 14,
  signal?: AbortSignal,
  fundo?: Fundo
): Promise<ClimaFundo> {
  try {
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
  } catch (error) {
    if (signal?.aborted) throw error;
    if (fundo?.idFundo === idFundo && axios.isAxiosError(error) &&
        error.response?.status === 503 && error.response.data?.codigo === "CLIMA_LIMITE_PROVEEDOR") {
      return obtenerClimaDirecto(fundo, dias, signal);
    }
    throw error;
  }
}
