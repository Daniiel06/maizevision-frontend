import { apiClient } from "../../../shared/api/apiClient";

import type {
  Fundo,
  GuardarFundoRequest,
  ResultadoUbicacion,
} from "../types/fundo.types";


export async function obtenerFundos(): Promise<Fundo[]> {
  const response =
    await apiClient.get<Fundo[]>(
      "/fundos/todos"
    );

  return response.data;
}


export async function crearFundo(
  datos: GuardarFundoRequest
): Promise<Fundo> {
  const response =
    await apiClient.post<Fundo>(
      "/fundos",
      datos
    );

  return response.data;
}


export async function actualizarFundo(
  idFundo: string,
  datos: GuardarFundoRequest
): Promise<Fundo> {
  const response =
    await apiClient.put<Fundo>(
      `/fundos/${idFundo}`,
      datos
    );

  return response.data;
}


export async function cambiarEstadoFundo(
  idFundo: string,
  activo: boolean
): Promise<void> {
  await apiClient.put(
    `/fundos/${idFundo}/estado`,
    {
      activo,
    }
  );
}


/*
 * BÚSQUEDA GEOGRÁFICA
 *
 * No guarda nada.
 * Solo convierte nombres de lugares
 * en posibles coordenadas.
 */
export async function buscarUbicaciones(
  termino: string
): Promise<ResultadoUbicacion[]> {
  const texto =
    termino.trim();

  if (texto.length < 2) {
    return [];
  }


  const params =
    new URLSearchParams({
      name: texto,
      count: "8",
      language: "es",
      format: "json",
      countryCode: "PE",
    });


  const response =
    await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`
    );


  if (!response.ok) {
    throw new Error(
      "No se pudo buscar la ubicación."
    );
  }


  const data =
    await response.json();


  const resultados =
    Array.isArray(data.results)
      ? data.results
      : [];


  return resultados.map(
    (item: any) => {
      const partes =
        [
          item.name,
          item.admin4,
          item.admin3,
          item.admin2,
          item.admin1,
          item.country,
        ]
          .filter(Boolean)
          .filter(
            (
              valor,
              indice,
              arreglo
            ) =>
              arreglo.indexOf(valor) ===
              indice
          );


      return {
        id:
          item.id,

        nombre:
          item.name,

        latitud:
          item.latitude,

        longitud:
          item.longitude,

        pais:
          item.country ?? "",

        departamento:
          item.admin1 ?? null,

        provincia:
          item.admin2 ?? null,

        distrito:
          item.admin3 ??
          item.admin4 ??
          null,

        textoCompleto:
          partes.join(", "),
      };
    }
  );
}