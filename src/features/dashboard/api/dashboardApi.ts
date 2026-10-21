import { apiClient } from "../../../shared/api/apiClient";
import type { DashboardResumen } from "../types/dashboard.types";
import type { DashboardPanel, DashboardFiltro } from "../types/dashboard.types";

export async function obtenerPanelDashboard(filtro: DashboardFiltro, signal: AbortSignal): Promise<DashboardPanel> {
  const params = { ...filtro, idFundo: filtro.idFundo || undefined, idCampania: filtro.idCampania || undefined, idLote: filtro.idLote || undefined };
  return (await apiClient.get<DashboardPanel>("/dashboard/panel", { params, signal, timeout: 60000 })).data;
}

export const obtenerResumenDashboard =
  async (): Promise<DashboardResumen> => {
    const response =
      await apiClient.get<DashboardResumen>(
        "/dashboard/resumen"
      );

    return response.data;
  };
