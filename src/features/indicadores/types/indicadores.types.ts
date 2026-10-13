export interface PrecisionClase {
  codigo: string;
  nombre: string;
  totalValidados: number;
  correctos: number;
  incorrectos: number;
  precision: number;
}

export interface IndicadoresResumen {
  totalDiagnosticos: number;
  diagnosticosValidados: number;
  diagnosticosPendientes: number;

  correctos: number;
  incorrectos: number;

  porcentajeExactitud: number;
  porcentajeError: number;
  numeroErrores: number;

  diagnosticosConTiempo: number;
  tiempoPromedioMinutos: number;
  tiempoPromedioSegundos: number;

  porcentajeValidacion: number;

  precisionPorClase: PrecisionClase[];
}
export interface ExactitudDia {
  fecha: string;
  totalDiagnosticos: number;
  plantasEvaluadas: number;
  validados: number;
  correctos: number;
  incorrectos: number;
  pendientes: number;
  porcentajeExactitud: number | null;
}
export interface ExactitudDetalle {
  dias: ExactitudDia[];
  campanias: { id: string; nombre: string }[];
  lotes: { id: string; idCampania: string; nombre: string }[];
  plantasEvaluadas: number;
  totalDiagnosticos: number;
  validados: number;
  correctos: number;
  incorrectos: number;
  pendientes: number;
  porcentajeExactitud: number | null;
}

export interface TiempoMedicion {
  totalDiagnosticos: number; conTiempo: number; sinTiempo: number;
  promedioSegundos: number | null; minimoSegundos: number | null; maximoSegundos: number | null;
}
export interface TiempoDetalle extends TiempoMedicion {
  dias: (TiempoMedicion & { fecha: string })[];
  campanias: ExactitudDetalle["campanias"]; lotes: ExactitudDetalle["lotes"];
}

export interface ErrorConfusion {
  idClasePredicha: string; clasePredicha: string; codigoPredicha: string;
  idClaseReal: string; claseReal: string; codigoReal: string; errores: number;
}
export interface ErrorLote {
  idLote: string; lote: string; campania: string; revisados: number; errores: number; erroresPor100: number | null;
}
export interface ErrorCaso {
  idDiagnostico: string; fechaDiagnostico: string; planta: string; fila: number; numeroPlanta: number;
  idLote: string; lote: string; campania: string; clasePredicha: string; claseReal: string; observaciones: string | null;
}
export interface ErroresDetalle {
  dias: ExactitudDia[]; campanias: ExactitudDetalle["campanias"]; lotes: ExactitudDetalle["lotes"];
  confusiones: ErrorConfusion[]; porLote: ErrorLote[]; casos: ErrorCaso[];
  plantasConErrores: number; pagina: number; tamanoPagina: number; paginas: number;
  totalDiagnosticos: number; revisados: number; pendientes: number; numeroErrores: number;
  erroresPor100: number | null; noDetectados: number; falsasAlertas: number; confusionesEntreAfecciones: number;
}
