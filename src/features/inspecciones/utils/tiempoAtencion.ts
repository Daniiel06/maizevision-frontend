export interface InicioAtencion {
  inicioUtc: string;
  inicioMonotono: number;
}
export interface MedicionAtencion {
  tiempoAtencionMs: number;
  inicioAtencionUtc: string;
  resultadoVisibleUtc: string;
}

export function iniciarAtencion(): InicioAtencion {
  return { inicioUtc: new Date().toISOString(), inicioMonotono: performance.timeOrigin + performance.now() };
}

export function finalizarAtencion(inicio: InicioAtencion): MedicionAtencion {
  // El reloj monotónico evita alterar la duración si cambia la hora del dispositivo.
  const tiempoAtencionMs = Math.max(1, Math.round(performance.timeOrigin + performance.now() - inicio.inicioMonotono));
  return { tiempoAtencionMs, inicioAtencionUtc: inicio.inicioUtc,
    resultadoVisibleUtc: new Date(Date.parse(inicio.inicioUtc) + tiempoAtencionMs).toISOString() };
}

function usuarioActual(): string {
  try { return JSON.parse(localStorage.getItem("maizevision_usuario") ?? "null")?.idUsuario ?? "sin-sesion"; }
  catch { return "sin-sesion"; }
}
const clave = (usuarioId = usuarioActual()) => "maizevision.tiempos-atencion-pendientes.v1." + usuarioId;
export const usuarioMedicion = usuarioActual;
export interface TiempoPendiente extends MedicionAtencion { idDiagnostico: string; usuarioId: string }
export function tiemposPendientes(usuarioId = usuarioActual()): TiempoPendiente[] {
  try {
    const datos: unknown = JSON.parse(localStorage.getItem(clave(usuarioId)) ?? "[]");
    if (!Array.isArray(datos)) return [];
    return datos.filter((x): x is TiempoPendiente => x && typeof x.idDiagnostico === "string" &&
      x.usuarioId === usuarioId && Number.isSafeInteger(x.tiempoAtencionMs) && x.tiempoAtencionMs > 0 &&
      typeof x.inicioAtencionUtc === "string" && typeof x.resultadoVisibleUtc === "string");
  }
  catch { return []; }
}
export function conservarTiempo(medicion: TiempoPendiente) {
  try { localStorage.setItem(clave(medicion.usuarioId), JSON.stringify([...tiemposPendientes(medicion.usuarioId).filter(x => x.idDiagnostico !== medicion.idDiagnostico), medicion])); }
  catch { /* La vista permite reintentar aunque el navegador no admita almacenamiento local. */ }
}
export function quitarTiempoPendiente(idDiagnostico: string, usuarioId = usuarioActual()) {
  try { localStorage.setItem(clave(usuarioId), JSON.stringify(tiemposPendientes(usuarioId).filter(x => x.idDiagnostico !== idDiagnostico))); }
  catch { /* Sin almacenamiento disponible. */ }
}
