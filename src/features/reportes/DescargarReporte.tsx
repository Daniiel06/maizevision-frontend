import "./Reportes.css";
import { useState } from "react";
import axios from "axios";
import { Download } from "lucide-react";
import { obtenerReporteDiagnostico, obtenerReporteJornada } from "./reportesApi";
export default function DescargarReporte({ tipo, id }: {
    tipo: "diagnostico" | "jornada";
    id: string;
}) {
    const [ocupado, setOcupado] = useState(false);
    const [mensaje, setMensaje] = useState("");
    async function descargar() {
        setOcupado(true);
        setMensaje("");
        try {
            const pdf = await import("./generarPdf");
            if (tipo === "jornada")
                pdf.descargarJornada(await obtenerReporteJornada(id));
            else {
                const foto = await pdf.descargarDiagnostico(await obtenerReporteDiagnostico(id));
                if (!foto)
                    setMensaje("PDF descargado sin foto: la imagen no estuvo disponible. Puedes volver a intentarlo.");
            }
        }
        catch (e) {
            setMensaje(axios.isAxiosError(e) ? e.response?.data?.mensaje ?? (e.response?.status === 404 ? "Reinicia el backend actualizado para habilitar los reportes." : "No se pudo descargar el reporte. Intenta nuevamente.") : "No se pudo generar el PDF. Intenta nuevamente.");
        }
        finally {
            setOcupado(false);
        }
    }
    return <div className="reporte-descarga">
    <button title="Descarga los datos guardados. Los cambios sin guardar no se incluyen." type="button" disabled={ocupado} onClick={() => void descargar()}>
    <Download size={16}/>{ocupado ? "Preparando PDF…" : tipo === "jornada" ? "Descargar reporte diario" : "Descargar diagnóstico PDF"}</button>{mensaje && <p role="status" className="reporte-aviso">{mensaje}</p>}</div>;
}
