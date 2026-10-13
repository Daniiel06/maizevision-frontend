import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Flag, RefreshCw } from "lucide-react";
import { obtenerResumenCierre } from "../api/campaniasApi";
import type { Campania, ResumenCierreCampania } from "../types/campania.types";

const numero = (n: number | null, decimales = 2) => n === null ? "—" : n.toLocaleString("es-PE", { maximumFractionDigits: decimales });
export default function ResumenCierreModal({ campania, finalizando, errorCierre, cancelar, finalizar }: {
  campania: Campania; finalizando: boolean; errorCierre: string; cancelar: () => void; finalizar: () => void;
}) {
  const [datos, setDatos] = useState<ResumenCierreCampania | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [reconozcoPendientes, setReconozcoPendientes] = useState(false);
  const botonCancelar = useRef<HTMLButtonElement | null>(null);
  const finalizada = campania.estado.toUpperCase() === "FINALIZADA";
  useEffect(() => {
    const controller = new AbortController();
    obtenerResumenCierre(campania.idCampania, controller.signal).then(data => {
      if (!controller.signal.aborted) { setDatos(data); setError(""); }
    }).catch(() => {
      if (!controller.signal.aborted) setError("No se pudo consultar el resumen. Actualiza antes de finalizar.");
    }).finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [campania.idCampania, revision]);
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    botonCancelar.current?.focus();
    return () => previo?.focus();
  }, []);
  const requiereReconocer = !!datos && (datos.tieneDatosPendientes || datos.diagnosticosRealizados === 0);
  return <div className="modal-overlay"><div className="modal-card cierre-campania-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-cierre-campania" onKeyDown={e => {
    if (e.key === "Escape" && !finalizando) cancelar();
    if (e.key === "Tab") {
      const controles = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]')];
      const primero = controles[0], ultimo = controles[controles.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo?.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero?.focus(); }
    }
  }}>
    <header className="cierre-campania-header"><Flag size={25} /><div><h2 id="titulo-cierre-campania">{finalizada ? "Resumen de campaña" : "Revisar antes de finalizar"}</h2><p>{campania.codigo} · {campania.nombre}</p></div></header>
    {cargando && <p role="status">Consultando diagnósticos y revisiones...</p>}
    {(error || errorCierre) && <p className="cierre-error" role="alert">{error || errorCierre}</p>}
    {!cargando && !error && datos && <>
      <div className="cierre-volumen"><span><strong>{datos.diagnosticosRealizados}</strong> diagnósticos realizados</span><span><strong>{datos.plantasEvaluadas}</strong> plantas distintas</span><span><strong>{datos.diasEvaluados}</strong> días con diagnósticos</span></div>
      <section className="cierre-indicadores" aria-label="Indicadores de la campaña">
        <article><span>Exactitud</span><strong>{numero(datos.exactitud)}{datos.exactitud !== null && " %"}</strong><small>{datos.revisados} diagnósticos revisados</small></article>
        <article><span>Tiempo real promedio</span><strong>{numero(datos.tiempoPromedioSegundos, 3)}{datos.tiempoPromedioSegundos !== null && " s"}</strong><small>{datos.conTiempoReal} con tiempo real</small></article>
        <article><span>Número de errores</span><strong>{datos.revisados > 0 ? datos.numeroErrores : "—"}</strong><small>Confirmados por el especialista</small></article>
      </section>
      <section className="cierre-pendientes"><h3>Estado de los registros</h3><dl>
        <div><dt>Pendientes de revisión del especialista</dt><dd>{datos.pendientesRevision}</dd></div>
        <div><dt>Diagnósticos sin tiempo real registrado</dt><dd>{datos.sinTiempoReal}</dd></div>
        <div><dt>Intentos que no produjeron un diagnóstico</dt><dd>{datos.intentosSinResultado}</dd></div>
      </dl><p>Los intentos sin resultado no entran a los indicadores. Los registros antiguos sin tiempo real tampoco entran al promedio de tiempo.</p></section>
      <div className={datos.revisionYTiempoCompletos ? "cierre-estado completo" : "cierre-estado"}>
        {datos.revisionYTiempoCompletos ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
        <span>{datos.diagnosticosRealizados === 0 ? "La campaña todavía no tiene diagnósticos para calcular resultados." : datos.revisionYTiempoCompletos ? "Todos los diagnósticos tienen revisión y tiempo real registrados." : "Hay datos pendientes: los resultados todavía están incompletos."}</span>
      </div>
      <p className="cierre-explicacion">{finalizada ? "Las evaluaciones están cerradas. Puedes completar las revisiones y sincronizar tiempos de diagnósticos ya realizados." : "Finalizar cierra las nuevas evaluaciones y la creación de lotes. El historial se conserva y las revisiones pendientes pueden completarse después."} Este resumen se actualiza con los datos guardados; todavía no es una versión definitiva congelada.</p>
      {!finalizada && requiereReconocer && <label className="cierre-reconocer"><input type="checkbox" checked={reconozcoPendientes} onChange={e => setReconozcoPendientes(e.target.checked)} />Entiendo que cerraré las evaluaciones con resultados {datos.diagnosticosRealizados === 0 ? "sin diagnósticos" : "incompletos"}.</label>}
    </>}
    <div className="modal-acciones cierre-acciones">
      <button ref={botonCancelar} className="boton-secundario" disabled={finalizando} onClick={cancelar}>{finalizada ? "Cerrar" : "Volver"}</button>
      <button className="boton-secundario" disabled={cargando || finalizando} onClick={() => { setCargando(true); setReconozcoPendientes(false); setRevision(x => x + 1); }}><RefreshCw size={16} /> Actualizar</button>
      {!finalizada && <button className="boton-finalizar-confirmar" disabled={cargando || finalizando || !!error || !datos || (requiereReconocer && !reconozcoPendientes)} onClick={finalizar}>{finalizando ? "Finalizando..." : "Finalizar evaluaciones"}</button>}
    </div>
  </div></div>;
}
