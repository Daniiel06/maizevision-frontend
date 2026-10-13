import { apiClient } from "../../shared/api/apiClient";
import type { ResumenJornada } from "../jornadas/jornadasApi";
export interface ReporteDiagnostico {
    idDiagnostico: string;
    fundo: string;
    campania: string;
    lote: string;
    planta: string;
    fila: number;
    posicion: number;
    evaluador: string;
    fechaDiagnostico: string;
    fechaJornada: string | null;
    esPrincipalJornada: boolean;
    diagnostico: string;
    referencia: string | null;
    correcto: boolean | null;
    confianza: number | null;
    tiempoMs: number | null;
    modelo: string;
    observaciones: string | null;
    generadoUtc: string;
    fotoUrl: string | null;
}
export interface ReportePlanta {
    planta: string;
    fila: number;
    posicion: number;
    idDiagnostico: string | null;
    diagnostico: string | null;
    referencia: string | null;
    correcto: boolean | null;
    tiempoMs: number | null;
    observaciones: string | null;
}
export interface ReporteJornada {
    idJornada: string;
    fundo: string;
    campania: string;
    lote: string;
    responsable: string;
    estadoCampania: string;
    resumen: ResumenJornada;
    fechaCierre: string | null;
    motivoCierre: string | null;
    plantas: ReportePlanta[];
    generadoUtc: string;
}
export const obtenerReporteDiagnostico = async (id: string) => (await apiClient.get<ReporteDiagnostico>("/reportes/diagnosticos/" + id)).data;
export const obtenerReporteJornada = async (id: string) => (await apiClient.get<ReporteJornada>("/reportes/jornadas/" + id)).data;
