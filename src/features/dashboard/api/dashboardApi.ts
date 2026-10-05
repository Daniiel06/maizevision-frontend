import { apiClient } from "../../../shared/api/apiClient";
import type { DashboardResumen } from "../types/dashboard.types";

export const obtenerResumenDashboard =
  async (): Promise<DashboardResumen> => {
    const response =
      await apiClient.get<DashboardResumen>(
        "/dashboard/resumen"
      );

    return response.data;
  };