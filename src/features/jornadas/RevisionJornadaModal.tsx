import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Eye, ZoomIn, ZoomOut, CheckCircle2, X } from "lucide-react";
import { obtenerHistorialPlanta } from "../mapa/api/mapaApi";
import { validarDiagnostico } from "../inspecciones/api/inspeccionesApi";
import type { ClaseDiagnosticoResponse } from "../inspecciones/api/inspeccionesApi";
import type { PlantaJornada } from "./jornadasApi";
import DescargarReporte from "../reportes/DescargarReporte";
import { obtenerRevisionJornada } from "./revisionJornada";
type Revision = ReturnType<typeof obtenerRevisionJornada>;
interface Props { planta: PlantaJornada; clases: ClaseDiagnosticoResponse[]; cerrar: () => void; guardada: () => Promise<void> }
const fecha = (valor: string) => new Date(valor).toLocaleString("es-PE", { timeZone: "America/Lima" });
export default function RevisionJornadaModal({ planta, clases, cerrar, guardada }: Props) {
    const [revision, setRevision] = useState<Revision | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [fotoLista, setFotoLista] = useState(false);
    const [fotoError, setFotoError] = useState(false);
    const [ampliada, setAmpliada] = useState(false);
    const [seleccion, setSeleccion] = useState<string | null>(null);
    const [observaciones, setObservaciones] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [recarga, setRecarga] = useState(0);
    const panel = useRef<HTMLElement>(null);
    useEffect(() => {
        const anterior = document.activeElement as HTMLElement | null;
        panel.current?.focus();
        return () => anterior?.focus();
    }, []);
    useEffect(() => {
        let vigente = true;
        obtenerHistorialPlanta(planta.idPlanta).then(historial => {
            if (vigente) setRevision(obtenerRevisionJornada(historial, planta.idDiagnostico!));
        }).catch(e => { if (vigente) setError(axios.isAxiosError(e) ? e.response?.data?.mensaje ?? "No se pudo cargar el diagnóstico. Intenta nuevamente." : e.message); })
          .finally(() => { if (vigente) setCargando(false); });
        return () => { vigente = false; };
    }, [planta.idPlanta, planta.idDiagnostico, recarga]);
    const claseReal = seleccion ?? clases.find(c => c.codigo === revision?.diagnostico.codigoClaseReal)?.idClase ?? "";
    const notas = observaciones ?? revision?.diagnostico.observaciones ?? "";
    const lista = !!revision && fotoLista && !fotoError && !cargando;
    async function guardar(idClaseReal: string) {
        if (!lista || !idClaseReal || guardando) return;
        setGuardando(true); setError("");
        try {
            await validarDiagnostico(planta.idDiagnostico!, { idClaseReal, observaciones: notas });
        } catch (e) {
            setError(axios.isAxiosError(e) ? e.response?.data?.mensaje ?? "No se pudo guardar la revisión." : "No se pudo guardar la revisión.");
            setGuardando(false); return;
        }
        // El guardado ya terminó. Un fallo al refrescar los indicadores no debe sugerir que se perdió.
        try { await guardada(); } finally { setGuardando(false); cerrar(); }
    }
    function reintentar() { setError(""); setRevision(null); setFotoLista(false); setFotoError(false); setCargando(true); setRecarga(r => r + 1); }
    return <div className="jornada-overlay">
        <section ref={panel} tabIndex={-1} className="jornada-modal jornada-revision-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-revision-jornada" onKeyDown={e => {
            if (e.key === "Escape" && !guardando) cerrar();
            if (e.key === "Tab") {
                const elementos = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]');
                if (!elementos?.length) return;
                const primero = elementos[0], ultimo = elementos[elementos.length - 1];
                if (e.shiftKey && (document.activeElement === primero || document.activeElement === panel.current)) { e.preventDefault(); ultimo.focus(); }
                else if (!e.shiftKey && (document.activeElement === ultimo || document.activeElement === panel.current)) { e.preventDefault(); primero.focus(); }
            }
        }}>
            <div className="jornada-card-title"><div><span className="jornada-eyebrow">REVISIÓN DEL ESPECIALISTA</span><h2 id="titulo-revision-jornada"><Eye size={20}/> {planta.codigo}</h2><p>Fila {planta.fila} · posición {planta.posicion}</p></div><button aria-label="Cerrar revisión" disabled={guardando} onClick={cerrar}><X size={19}/></button></div>
            {cargando && <p role="status">Cargando la fotografía y el diagnóstico de esta jornada…</p>}
            {error && <p className="jornada-error" role="alert">{error}</p>}
            {!cargando && !revision && <button onClick={reintentar}>Reintentar carga</button>}
            {revision && <>
                <div className="jornada-revision-contenido">
                    <div><div className="jornada-card-title"><h3>Foto de la hoja</h3><button disabled={!fotoLista || fotoError} onClick={() => setAmpliada(a => !a)}>{ampliada ? <ZoomOut size={17}/> : <ZoomIn size={17}/>} {ampliada ? "Ver completa" : "Ampliar"}</button></div>
                        {revision.imagen?.urlImagen ? <div className={"jornada-revision-foto" + (ampliada ? " ampliada" : "")}><img key={recarga} src={revision.imagen.urlImagen} alt={"Hoja utilizada para el diagnóstico de " + planta.codigo} onLoad={() => setFotoLista(true)} onError={() => { setFotoError(true); setFotoLista(false); }}/></div> : <p className="jornada-nota">No se pudo obtener la fotografía del diagnóstico.</p>}
                        {fotoError && <p role="alert" className="jornada-error">No se pudo cargar la foto. Renueva el acceso e intenta nuevamente.</p>}
                        {(!revision.imagen?.urlImagen || fotoError) && <button onClick={reintentar}>Volver a cargar foto</button>}
                        <small className="jornada-nota">{revision.imagen?.nombreOriginal ?? "Imagen no disponible"}. Esta foto corresponde al diagnóstico principal de la jornada.</small>
                    </div>
                    <div className="jornada-revision-datos"><h3>Resultado registrado</h3><DescargarReporte tipo="diagnostico" id={planta.idDiagnostico!}/><dl><dt>Diagnóstico del sistema</dt><dd>{revision.diagnostico.clasePredicha}</dd><dt>Confianza del modelo</dt><dd>{revision.diagnostico.confianza == null ? "No registrada" : (revision.diagnostico.confianza * 100).toFixed(1) + "%"}</dd><dt>Fecha del diagnóstico</dt><dd>{fecha(revision.diagnostico.fechaDiagnostico)}</dd><dt>Evaluado por</dt><dd>{revision.inspeccion.nombreUsuario || "No registrado"}</dd><dt>Tiempo real de diagnóstico</dt><dd>{planta.tiempoMs == null ? "Pendiente de registro" : (planta.tiempoMs / 1000).toFixed(1) + " s"}</dd><dt>Referencia actual del especialista</dt><dd>{revision.diagnostico.claseReal ?? "Pendiente de revisión"}</dd></dl><p className="jornada-nota">La confianza del modelo no reemplaza la revisión del especialista.</p></div>
                </div>
                <form className="jornada-revision-form" onSubmit={e => { e.preventDefault(); void guardar(claseReal); }}>
                    <h3>Tu revisión</h3><p>Examina la hoja. Si el resultado es correcto, confírmalo. Si es diferente, selecciona la clase real.</p>
                    <label>Diagnóstico real de la planta<select required disabled={guardando || !lista} value={claseReal} onChange={e => setSeleccion(e.target.value)}><option value="">Selecciona la clase del especialista</option>{clases.map(c => <option key={c.idClase} value={c.idClase}>{c.nombre}</option>)}</select></label>
                    <label>Observaciones de la revisión<textarea rows={3} maxLength={1000} disabled={guardando} value={notas} onChange={e => setObservaciones(e.target.value)} placeholder="Describe los signos observados o explica la corrección…"/></label>
                    {!fotoLista && <p className="jornada-nota">Carga la fotografía antes de guardar la revisión.</p>}
                    {clases.length === 0 && <p className="jornada-nota">Las clases de diagnóstico aún no están disponibles. Cierra la revisión y actualiza la jornada.</p>}
                    <div className="jornada-actions"><button type="button" disabled={guardando || !lista || !clases.some(c => c.idClase === revision.diagnostico.idClasePredicha)} onClick={() => { setSeleccion(revision.diagnostico.idClasePredicha); void guardar(revision.diagnostico.idClasePredicha); }}><CheckCircle2 size={17}/> Confirmar diagnóstico correcto</button><button className="jornada-primary" type="submit" disabled={guardando || !lista || !claseReal}>{guardando ? "Guardando…" : "Guardar revisión"}</button></div>
                </form>
            </>}
        </section>
    </div>;
}
