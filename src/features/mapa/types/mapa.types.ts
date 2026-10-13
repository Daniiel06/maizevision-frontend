export type EstadoInspeccionPlanta =
  | "SIN_INSPECCION"
  | "PENDIENTE_DIAGNOSTICO"
  | "SALUDABLE"
  | "PROBLEMA_DETECTADO";

export interface PlantaMapa {
  idPlanta: string;
  numero: number;
  codigo: string;
  estado: string;

  estadoInspeccion: EstadoInspeccionPlanta;

  idInspeccion: string | null;
  idDiagnostico: string | null;

  ultimaInspeccion: string | null;

  codigoDiagnostico: string | null;
  ultimoDiagnostico: string | null;

  confianza: number | null;
}

export interface FilaMapa {
  idFila: string;
  numero: number;
  codigo: string;
  activo: boolean;
  plantas: PlantaMapa[];
}

export interface LoteMapa {
  estadoCampania: string;
  idLote: string;
  codigo: string;
  nombre: string;
  areaM2: number | null;
  estado: string;
  totalFilas: number;
  totalPlantas: number;
  filas: FilaMapa[];
}