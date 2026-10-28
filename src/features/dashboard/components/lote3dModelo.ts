import type { DashboardSector } from '../types/dashboard.types';

export const coloresLote: Record<string, string> = {
  HEALTHY: '#55d6a3', FALL_ARMYWORM: '#b997ff', GRAY_LEAF_SPOT: '#45cddd',
  COMMON_RUST: '#ffad76', LEAF_BLIGHT: '#829aff', LETHAL_NECROSIS: '#ef88c0', TAR_SPOT: '#b5c29a',
};
export const coloresLoteClaro: Record<string, string> = {
  HEALTHY: '#23805b', FALL_ARMYWORM: '#7d54bd', GRAY_LEAF_SPOT: '#087e93',
  COMMON_RUST: '#b15b28', LEAF_BLIGHT: '#4f65ba', LETHAL_NECROSIS: '#b44482', TAR_SPOT: '#627745',
};
export interface SectorVisual {
  id: string; u0: number; v0: number; u1: number; v1: number;
  total: number; seleccionadas: number; datos: DashboardSector;
  categorias: { codigo: string; plantas: number; proporcion: number }[];
}

// Los límites proceden de los rangos de filas/posiciones del servidor, no de una
// división visual uniforme. Se conservan cantidades y denominadores originales.
export function construirSectores3D(sectores: DashboardSector[], maxFila: number, maxPosicion: number, clase: string): SectorVisual[] {
  if (maxFila <= 0 || maxPosicion <= 0) return [];
  return sectores.map(s => {
    const total = s.clases.reduce((n, c) => n + c.plantas, 0);
    const categorias = s.clases.filter(c => c.plantas > 0 && (!clase || c.codigo === clase))
      .map(c => ({ codigo: c.codigo, plantas: c.plantas, proporcion: total ? c.plantas / total : 0 }));
    return { id: `${s.fila}:${s.columna}`, u0: (s.posicionDesde - 1) / maxPosicion,
      u1: s.posicionHasta / maxPosicion, v0: (s.filaDesde - 1) / maxFila, v1: s.filaHasta / maxFila,
      total, seleccionadas: categorias.reduce((n, c) => n + c.plantas, 0), datos: s, categorias };
  });
}

export function sectorEnPunto(sectores: SectorVisual[], u: number, v: number): string | null {
  if (u < 0 || v < 0 || u > 1 || v > 1) return null;
  return sectores.find(s => u >= s.u0 && (u < s.u1 || (u === 1 && s.u1 === 1)) &&
    v >= s.v0 && (v < s.v1 || (v === 1 && s.v1 === 1)))?.id ?? null;
}
