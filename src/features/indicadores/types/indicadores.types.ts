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

  porcentajePrecision: number;
  porcentajeError: number;

  tiempoPromedioMinutos: number;
  tiempoPromedioSegundos: number;

  porcentajeValidacion: number;

  precisionPorClase: PrecisionClase[];
}