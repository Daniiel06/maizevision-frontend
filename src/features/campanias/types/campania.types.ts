export interface Campania {
  idCampania: string;
  codigo: string;
  nombre: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: string;
}

export interface LoteResumen {
  idLote: string;
  codigo: string;
  nombre: string;
  areaM2: number | null;
  numeroFilasPlan: number | null;
  plantasFilaPlan: number | null;
  fechaSiembra: string | null;
  estado: string;
}

export interface Fundo {
  idFundo: string;
  nombre: string;
  descripcion: string | null;
  ubicacionReferencia: string | null;
}

export interface Variedad {
  idVariedad: string;
  idCultivo: string;
  nombre: string;
  descripcion: string | null;
}

export interface CrearCampaniaRequest {
  idFundo: string;
  idVariedad: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  observaciones: string | null;
}

export interface CrearLoteRequest {
  codigo: string;
  nombre: string;
  areaM2: number;
  numeroFilas: number;
  plantasPorFila: number;
  fechaSiembra: string | null;
  observaciones: string | null;
}

export interface CrearLoteResponse {
  idLote: string;
  idCampania: string;
  codigo: string;
  nombre: string;
  areaM2: number;
  numeroFilas: number;
  plantasPorFila: number;
  totalPlantas: number;
  fechaSiembra: string | null;
  estado: string;
}