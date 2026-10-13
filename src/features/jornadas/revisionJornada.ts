import type { HistorialPlanta } from "../mapa/api/mapaApi";
// La revisión corresponde al diagnóstico principal, nunca al más reciente de la planta.
export function obtenerRevisionJornada(historial: HistorialPlanta, idDiagnostico: string) {
    for (const inspeccion of historial.inspecciones) {
        const diagnostico = inspeccion.diagnosticos.find(d => d.idDiagnostico === idDiagnostico);
        if (diagnostico) {
            const imagen = inspeccion.imagenes.find(i => i.idImagen === diagnostico.idImagen) ?? null;
            return { diagnostico, imagen, inspeccion };
        }
    }
    throw new Error("No se encontró el diagnóstico principal de esta jornada en el historial de la planta.");
}
