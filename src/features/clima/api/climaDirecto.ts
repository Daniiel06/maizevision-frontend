import type { Fundo } from "../../fundos/types/fundo.types";
import type { ClimaFundo } from "../types/clima.types";

type Registro = Record<string, unknown>;
const cache = new Map<string, { hasta: number; data: ClimaFundo }>();
let bloqueadoHasta = 0;
const objeto = (v: unknown): Registro => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Registro : {};
const numero = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) ? v : null;
const texto = (v: unknown): string | null => typeof v === "string" ? v : null;
const lista = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const descripcion = (codigo: number | null) => {
  if (codigo === 0) return "Despejado";
  if (codigo === 1 || codigo === 2) return "Parcialmente nublado";
  if (codigo === 3) return "Nublado";
  if (codigo === 45 || codigo === 48) return "Neblina";
  if ([51, 53, 55].includes(codigo ?? -1)) return "Llovizna";
  if ([56, 57].includes(codigo ?? -1)) return "Llovizna helada";
  if ([61, 63, 65].includes(codigo ?? -1)) return "Lluvia";
  if ([66, 67].includes(codigo ?? -1)) return "Lluvia helada";
  if ([71, 73, 75, 77].includes(codigo ?? -1)) return "Nieve";
  if ([80, 81, 82].includes(codigo ?? -1)) return "Chubascos";
  if ([85, 86].includes(codigo ?? -1)) return "Chubascos de nieve";
  if (codigo === 95) return "Tormenta";
  if (codigo === 96 || codigo === 99) return "Tormenta con granizo";
  return "Condición meteorológica";
};

// Solo se usa cuando el servidor informa el límite del proveedor.
// fetch independiente: nunca envía el JWT ni las cabeceras de apiClient.
export async function obtenerClimaDirecto(fundo: Fundo, dias: 7 | 14, signal?: AbortSignal): Promise<ClimaFundo> {
  signal?.throwIfAborted();
  const { latitud, longitud } = fundo;
  if (latitud === null || longitud === null || !Number.isFinite(latitud) || !Number.isFinite(longitud) ||
      Math.abs(latitud) > 90 || Math.abs(longitud) > 180) throw new Error("La ubicación del fundo no es válida.");
  const key = `${fundo.idFundo}:${latitud}:${longitud}:${dias}`;
  const anterior = cache.get(key);
  if (anterior && anterior.hasta > Date.now()) return anterior.data;
  if (Date.now() < bloqueadoHasta) throw new Error("El proveedor del clima mantiene un límite temporal. Espera unos minutos antes de volver a consultar.");
  const params = new URLSearchParams({
    latitude: String(latitud), longitude: String(longitud), forecast_days: String(dias), timezone: "auto",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    hourly: "relative_humidity_2m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
  });
  const timeout = AbortSignal.timeout(20000);
  let response: Response;
  try {
    response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout, credentials: "omit",
    });
  } catch {
    signal?.throwIfAborted();
    throw new Error("No se pudo consultar el clima desde esta conexión. Intenta nuevamente más tarde.");
  }
  if (response.status === 429) {
    const retry = response.headers.get("Retry-After");
    const seconds = retry === null ? NaN : Number(retry);
    const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retry ?? "") - Date.now();
    bloqueadoHasta = Date.now() + Math.max(60000, Number.isFinite(delay) ? delay : 60000);
    throw new Error("El proveedor del clima mantiene un límite temporal. Espera unos minutos antes de volver a consultar.");
  }
  if (!response.ok) throw new Error("El proveedor del clima no está disponible temporalmente.");
  let raw: unknown;
  try { raw = await response.json(); } catch {
    signal?.throwIfAborted();
    throw new Error("El proveedor devolvió información meteorológica inválida.");
  }
  signal?.throwIfAborted();
  const root = objeto(raw), current = objeto(root.current), daily = objeto(root.daily), hourly = objeto(root.hourly);
  const fechas = lista(daily.time);
  if (!texto(current.time) || !fechas.length || fechas.some(f => !/^\d{4}-\d{2}-\d{2}$/.test(texto(f) ?? ""))) {
    throw new Error("El proveedor devolvió información meteorológica incompleta.");
  }
  const humedad = new Map<string, number[]>();
  const valores = lista(hourly.relative_humidity_2m);
  lista(hourly.time).forEach((t, i) => {
    const fecha = texto(t)?.slice(0, 10), valor = numero(valores[i]);
    if (fecha && valor !== null) humedad.set(fecha, [...(humedad.get(fecha) ?? []), valor]);
  });
  const data: ClimaFundo = {
    idFundo: fundo.idFundo, fundo: fundo.nombre, ubicacion: fundo.ubicacionReferencia,
    latitud, longitud, fuente: "Open-Meteo", zonaHoraria: texto(root.timezone),
    actual: {
      fechaHora: texto(current.time), temperaturaC: numero(current.temperature_2m),
      sensacionTermicaC: numero(current.apparent_temperature), humedadRelativa: numero(current.relative_humidity_2m),
      precipitacionMm: numero(current.precipitation), velocidadVientoKmh: numero(current.wind_speed_10m),
      codigoClima: numero(current.weather_code), descripcionClima: descripcion(numero(current.weather_code)),
    },
    pronostico: fechas.map((f, i) => {
      const fecha = f as string, muestras = humedad.get(fecha);
      const valor = (campo: string) => numero(lista(daily[campo])[i]);
      return {
        fecha, temperaturaMaxC: valor("temperature_2m_max"), temperaturaMinC: valor("temperature_2m_min"),
        humedadPromedio: muestras?.length ? Math.round(muestras.reduce((a, b) => a + b, 0) / muestras.length * 10) / 10 : null,
        probabilidadPrecipitacion: valor("precipitation_probability_max"), precipitacionMm: valor("precipitation_sum"),
        vientoMaxKmh: valor("wind_speed_10m_max"), codigoClima: valor("weather_code"), descripcionClima: descripcion(valor("weather_code")),
      };
    }),
  };
  cache.set(key, { hasta: Date.now() + 10 * 60 * 1000, data });
  return data;
}
