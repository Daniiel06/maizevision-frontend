import { apiClient } from "../../shared/api/apiClient";
export interface ResumenJornada {
    idJornada: string;
    fecha: string;
    metaPlantas: number;
    estado: string;
    asignadas: number;
    evaluadas: number;
    revisadas: number;
    correctas: number;
    errores: number;
    conTiempo: number;
    exactitud: number | null;
    tiempoPromedioMs: number | null;
}
export interface PlantaJornada {
    idPlanta: string;
    codigo: string;
    fila: number;
    posicion: number;
    idDiagnostico: string | null;
    diagnostico: string | null;
    referencia: string | null;
    tiempoMs: number | null;
}
export interface ContextoJornada {
    idLote: string;
    nombre: string;
    estadoCampania: string;
    totalPlantas: number;
    metaSugerida: number;
}
export interface DetalleJornada {
    resumen: ResumenJornada;
    lote: string;
    estadoCampania: string;
    plantas: PlantaJornada[];
    pagina: number;
    totalPlantas: number;
    motivoCierre: string | null;
}
export interface CandidatasJornada {
    plantas: PlantaJornada[];
    pagina: number;
    total: number;
}
export const jornadasApi = {
    contexto: async (id: string) => (await apiClient.get<ContextoJornada>("/jornadas/lotes/" + id + "/contexto")).data,
    listar: async (idLote: string, pagina: number) => (await apiClient.get<ResumenJornada[]>("/jornadas", { params: { idLote, pagina } })).data,
    crear: async (idLote: string, fecha: string, metaPlantas: number) => (await apiClient.post<{
        idJornada: string;
    }>("/jornadas", { idLote, fecha, metaPlantas })).data,
    detalle: async (id: string, pagina: number) => (await apiClient.get<DetalleJornada>("/jornadas/" + id, { params: { pagina } })).data,
    candidatas: async (id: string, params: object) => (await apiClient.get<CandidatasJornada>("/jornadas/" + id + "/candidatas", { params })).data,
    asignar: async (id: string, idsPlantas: string[]) => apiClient.post("/jornadas/" + id + "/plantas", { idsPlantas }),
    quitar: async (id: string, idPlanta: string) => apiClient.delete("/jornadas/" + id + "/plantas/" + idPlanta),
    cerrar: async (id: string, permitirIncompleta: boolean, motivo: string) => apiClient.post("/jornadas/" + id + "/cerrar", { permitirIncompleta, motivo }),
};
