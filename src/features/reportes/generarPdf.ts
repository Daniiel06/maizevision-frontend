import { crearDocumentoPdf } from "./pdfDocumento";
import type { ReporteDiagnostico, ReporteJornada } from "./reportesApi";
const fecha = (valor: string) => new Date(valor).toLocaleString("es-PE", { timeZone: "America/Lima" });
const tiempo = (ms: number | null) => ms == null ? "No registrado" : (ms / 1000).toFixed(1) + " s";
const texto = (valor: string | null | undefined) => valor?.trim() || "No registrado";
const resultado = (correcto: boolean | null) => correcto == null ? "Pendiente" : correcto ? "Correcto" : "Error confirmado";
const limpio = (valor: string) => valor.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
interface FotoPdf {
    datos: string;
    ancho: number;
    alto: number;
}
const documento = crearDocumentoPdf;
export function crearPdfDiagnostico(r: ReporteDiagnostico, foto: FotoPdf | null = null) {
    const pdf = documento("Informe de diagnóstico", r.idDiagnostico, r.generadoUtc, r.referencia == null || r.tiempoMs == null || foto == null);
    pdf.seccion("Identificación de la evaluación");
    pdf.tabla([], [["Fundo", texto(r.fundo)], ["Campaña", texto(r.campania)], ["Lote", texto(r.lote)], ["Planta / ubicación", r.planta + " / fila " + r.fila + ", posición " + r.posicion], ["Evaluador", texto(r.evaluador)], ["Fecha del diagnóstico", fecha(r.fechaDiagnostico)], ["Jornada", r.fechaJornada ? (r.fechaJornada + " / " + (r.esPrincipalJornada ? "Evaluación principal" : "Reanálisis")) : "Sin jornada asociada"]], [43, 137]);
    pdf.seccion("Resultado y revisión del especialista");
    pdf.tabla([], [["Diagnóstico del sistema", r.diagnostico], ["Referencia del especialista", r.referencia ?? "Pendiente de revisión"], ["Resultado de la revisión", resultado(r.correcto)], ["Confianza del modelo", r.confianza == null ? "No registrada" : (r.confianza * 100).toFixed(1) + "%"], ["Tiempo real de diagnóstico", tiempo(r.tiempoMs)], ["Modelo utilizado", texto(r.modelo)]], [55, 125]);
    pdf.imagen(foto);
    pdf.seccion("Observaciones");
    pdf.tabla([], [[texto(r.observaciones)]]);
    pdf.tabla([], [["El tiempo real corresponde al inicio de la evaluación de la planta hasta la presentación del resultado. La revisión del especialista se realiza posteriormente. La confianza del modelo no equivale a exactitud."]]);
    return pdf.finalizar();
}
export function crearPdfJornada(r: ReporteJornada) {
    const s = r.resumen;
    const completo = s.estado === "CERRADA" && s.evaluadas >= s.metaPlantas && s.evaluadas > 0 && s.revisadas === s.evaluadas && s.conTiempo === s.evaluadas;
    const pdf = documento("Informe diario de diagnósticos", r.idJornada, r.generadoUtc, !completo);
    pdf.seccion("Datos de la jornada");
    pdf.tabla([], [["Fundo", texto(r.fundo)], ["Campaña / estado", r.campania + " / " + r.estadoCampania], ["Lote", r.lote], ["Fecha de evaluación", s.fecha + " (Perú)"], ["Responsable", r.responsable], ["Método", "Sistema MaizeVision"], ["Estado de captura", s.estado === "CERRADA" ? "Cerrada" : "Abierta"], ["Meta / asignadas / evaluadas", s.metaPlantas + " / " + s.asignadas + " / " + s.evaluadas]], [50, 130]);
    pdf.seccion("Indicadores de la jornada");
    pdf.tabla(["Indicador", "Resultado", "Datos utilizados"], [
        ["Exactitud del diagnóstico", s.exactitud == null ? "Sin revisiones" : s.exactitud.toFixed(1) + "%", s.correctas + " correctos de " + s.revisadas + " revisados"],
        ["Tiempo promedio de diagnóstico", tiempo(s.tiempoPromedioMs), s.conTiempo + " tiempos reales registrados"],
        ["Número de errores", s.revisadas === 0 ? "Sin revisiones" : s.errores, s.revisadas + " diagnósticos revisados"]
    ], [65, 40, 75]);
    pdf.tabla([], [["Pendientes: " + Math.max(0, s.metaPlantas - s.evaluadas) + " plantas para la meta; " + (s.evaluadas - s.revisadas) + " revisiones; " + (s.evaluadas - s.conTiempo) + " tiempos reales."]]);
    if (r.plantas.length) {
    pdf.seccion("Detalle de plantas asignadas");
    pdf.tabla(["Planta", "Fila / pos.", "Diagnóstico del sistema", "Referencia del especialista", "Revisión", "Tiempo real"], r.plantas.map(p => [p.planta, p.fila + " / " + p.posicion, p.diagnostico ?? "Sin diagnóstico", p.referencia ?? (p.idDiagnostico ? "Pendiente" : "Sin evaluación"), p.idDiagnostico ? resultado(p.correcto) : "Sin evaluar", p.idDiagnostico ? tiempo(p.tiempoMs) : "-"]), [26, 19, 43, 43, 27, 22]);
    }
    const observaciones = r.plantas.filter(p => p.observaciones?.trim());
    if (observaciones.length) {
        pdf.seccion("Observaciones de las evaluaciones");
        pdf.tabla(["Planta", "Observación"], observaciones.map(p => [p.planta, p.observaciones!]), [35, 145]);
    }
    if (r.motivoCierre) {
        pdf.seccion("Motivo de cierre incompleto");
        pdf.tabla([], [[r.motivoCierre]]);
    }
    pdf.tabla([], [["Se utiliza el primer diagnóstico guardado de cada planta en esta jornada. Los reanálisis no aumentan el avance ni sustituyen ese resultado. La exactitud y los errores solo usan diagnósticos revisados; el promedio solo usa tiempos reales registrados."]]);
    return pdf.finalizar();
}
async function cargarFoto(url: string | null): Promise<FotoPdf | null> {
    if (!url)
        return null;
    let objeto: string | undefined;
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!response.ok)
            return null;
        objeto = URL.createObjectURL(await response.blob());
        const img = new Image();
        img.src = objeto;
        await img.decode();
        const escala = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * escala);
        canvas.height = Math.round(img.naturalHeight * escala);
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return null;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return { datos: canvas.toDataURL("image/jpeg", .9), ancho: canvas.width, alto: canvas.height };
    }
    catch {
        return null;
    }
    finally {
        if (objeto)
            URL.revokeObjectURL(objeto);
    }
}
export async function descargarDiagnostico(r: ReporteDiagnostico) { const foto = await cargarFoto(r.fotoUrl); crearPdfDiagnostico(r, foto).save("Diagnostico_" + limpio(r.planta) + "_" + r.idDiagnostico.slice(0, 8) + ".pdf"); return foto != null; }
export function descargarJornada(r: ReporteJornada) { crearPdfJornada(r).save("Jornada_" + r.resumen.fecha + "_" + r.idJornada.slice(0, 8) + ".pdf"); }
