import { apiClient } from '../../shared/api/apiClient';
export interface GrupoResumen {
    idGrupo: string;
    idLote: string;
    nombre: string;
    fechaPlanificada: string | null;
    idResponsable: string | null;
    responsable: string | null;
    origen: string;
    estado: string;
    metaPlantas: number;
    asignadas: number;
    evaluadas: number;
    revisadas: number;
    correctas: number;
    errores: number | null;
    conTiempo: number;
    exactitud: number | null;
    tiempoPromedioMs: number | null;
    desde: string | null;
    hasta: string | null;
}
export interface GrupoPlanta {
    idPlanta: string;
    codigo: string;
    fila: number;
    posicion: number;
    orden: number;
    idDiagnostico: string | null;
    diagnostico: string | null;
    referencia: string | null;
    tiempoMs: number | null;
    fechaDiagnostico: string | null;
    evaluador: string | null;
    foto: string | null;
    fotoRepetida: boolean;
}
export interface GrupoDetalle {
    resumen: GrupoResumen;
    estadoCampania: string;
    plantas: GrupoPlanta[];
    pagina: number;
    totalPlantas: number;
    motivoCierre: string | null;
}
export interface GrupoLote {
    idLote: string;
    nombre: string;
    campania: string;
}
export interface GrupoUsuario {
    idUsuario: string;
    nombre: string;
}
export interface AsociarGrupo {
    idLote: string;
    nombre: string;
    idsDiagnosticos: string[];
}
export const gruposApi = {
    lotes: async () => (await apiClient.get<GrupoLote[]>('/grupos/lotes')).data,
    responsables: async () => (await apiClient.get<GrupoUsuario[]>('/grupos/responsables')).data,
    listar: async (idLote: string, pagina: number) => (await apiClient.get<GrupoResumen[]>('/grupos', { params: { idLote, pagina } })).data,
    crear: async (r: {
        idLote: string;
        nombre: string;
        fecha: string;
        metaPlantas: number;
        idResponsable: string;
    }) => (await apiClient.post<{
        idGrupo: string;
    }>('/grupos', r)).data,
    detalle: async (id: string, pagina: number) => (await apiClient.get<GrupoDetalle>('/grupos/' + id, { params: { pagina } })).data,
    candidatas: async (id: string, params: object) => (await apiClient.get<GrupoPlanta[]>('/grupos/' + id + '/candidatas', { params })).data,
    asignar: async (id: string, idsPlantas: string[]) => apiClient.post('/grupos/' + id + '/plantas', { idsPlantas }),
    quitar: async (id: string, idPlanta: string) => apiClient.delete('/grupos/' + id + '/plantas/' + idPlanta),
    asociar: async (grupos: AsociarGrupo[]) => (await apiClient.post<{
        idsGrupos: string[];
    }>('/grupos/asociar-lote', grupos)).data,
    cerrar: async (id: string, permitirIncompleta: boolean, motivo: string) => apiClient.post('/grupos/' + id + '/cerrar', { permitirIncompleta, motivo })
};
