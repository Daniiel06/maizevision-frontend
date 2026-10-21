export interface DashboardResumen {
  campaniasActivas: number;
  lotesRegistrados: number;
  plantasRegistradas: number;
  diagnosticosRealizados: number;
}

export interface DashboardFiltro {
  idFundo: string; idCampania: string; idLote: string; desde: string; hasta: string;
  base: 'COMBINADA' | 'PREDICCION' | 'REFERENCIA';
}
export interface DashboardOpcion { id: string; nombre: string; padre: string | null; estado: string | null }
export interface DashboardClase { codigo: string; nombre: string; plantas: number }
export interface DashboardSector {
  fila: number; columna: number; filaDesde: number; filaHasta: number; posicionDesde: number; posicionHasta: number;
  registradas: number; evaluadas: number; clases: DashboardClase[];
}
export interface DashboardPanel {
  generadoUtc: string; desde: string; hasta: string; base: DashboardFiltro['base'];
  fundos: DashboardOpcion[]; campanias: DashboardOpcion[]; lotes: DashboardOpcion[];
  campaniasRegistradas: number; campaniasActivas: number; lotesRegistrados: number; plantasRegistradas: number;
  diagnosticosRealizados: number; plantasEvaluadas: number; plantasRevisadas: number; plantasEnBase: number; plantasConHallazgo: number;
  jornadasProgramadas: number; jornadasAbiertas: number; distribucion: DashboardClase[];
  actividad: { fecha: string; diagnosticos: number; plantas: number }[];
  comparacionLotes: { idLote: string; nombre: string; campania: string; registradas: number; evaluadas: number; enBase: number; conHallazgo: number; predominante: string | null; codigoPredominante: string | null }[];
  maxFila: number; maxPosicion: number; sectores: DashboardSector[];
}
