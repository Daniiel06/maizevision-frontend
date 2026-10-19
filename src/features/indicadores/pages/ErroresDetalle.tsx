import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, AlertTriangle, SlidersHorizontal, Clock3, ShieldCheck, Leaf, Shuffle, MapPin, ListChecks, ChevronLeft, ChevronRight, CalendarDays, BarChart3, Info } from "lucide-react";
import { obtenerDetalleErrores } from "../api/indicadoresApi";
import type { ErroresDetalle as Detalle } from "../types/indicadores.types";

const vacios = { idCampania: "", idLote: "", desde: "", hasta: "" };
const tasa = (valor: number | null) => valor === null ? "Sin revisión" : valor.toLocaleString("es-PE", { maximumFractionDigits: 2 }) + " / 100";
const fecha = (valor: string) => new Date(valor + "T12:00:00").toLocaleDateString("es-PE");

export default function ErroresDetalle({ volver }: { volver: () => void }) {
  const [borrador, setBorrador] = useState(vacios);
  const [filtros, setFiltros] = useState(vacios);
  const [datos, setDatos] = useState<Detalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    obtenerDetalleErrores({
      idCampania: filtros.idCampania || undefined, idLote: filtros.idLote || undefined,
      desde: filtros.desde || undefined, hasta: filtros.hasta || undefined, pagina,
    }, controller.signal).then(resultado => {
      if (!controller.signal.aborted) { setDatos(resultado); setError(""); }
    }).catch(() => {
      if (!controller.signal.aborted) setError("No se pudieron cargar los errores. Intenta actualizar los datos.");
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });
    return () => controller.abort();
  }, [filtros, revision, pagina]);


  const cobertura = datos && datos.totalDiagnosticos > 0 ? Math.round(datos.revisados / datos.totalDiagnosticos * 100) : 0;
  const campania = datos?.campanias.find(x => x.id === filtros.idCampania)?.nombre ?? "Todas las campañas";
  const lote = datos?.lotes.find(x => x.id === filtros.idLote)?.nombre ?? "Todos los lotes";
  const periodo = filtros.desde && filtros.hasta ? fecha(filtros.desde) + " — " + fecha(filtros.hasta)
    : filtros.desde ? "Desde " + fecha(filtros.desde) : filtros.hasta ? "Hasta " + fecha(filtros.hasta) : "Todo el período";

  return <div className="indicadores-page exactitud-page errores-page">
    <button className="exactitud-volver" onClick={volver}><ArrowLeft size={17} /> Indicadores</button>
    <header className="indicadores-header">
      <div>
        <span className="indicadores-eyebrow">INDICADOR 03 · ERRORES CONFIRMADOS</span>
        <h1>Número de errores de diagnóstico</h1>
        <p>¿Qué errores se repiten y dónde necesita mejorar el sistema?</p>
      </div>
      <button className="indicadores-actualizar" disabled={cargando} onClick={() => { setCargando(true); setRevision(x => x + 1); }}>
        <RefreshCw size={17} className={cargando ? "girando" : ""} /> {cargando ? "Actualizando..." : "Actualizar datos"}
      </button>
      <Link className="indicadores-actualizar" to="/jornadas">Ver por jornadas</Link>
    </header>
    <form className="panel-indicador exactitud-filtros" onSubmit={e => {
      e.preventDefault();
      if (borrador.desde && borrador.hasta && borrador.desde > borrador.hasta) {
        setError("La fecha inicial no puede ser posterior a la final."); return;
      }
      setError(""); setCargando(true); setPagina(1); setFiltros({ ...borrador });
    }}>
      <div className="exactitud-section-title"><SlidersHorizontal size={18} /><h2>Selecciona qué quieres evaluar</h2></div>
      <div className="exactitud-filter-fields">
        <label>Campaña<select value={borrador.idCampania} onChange={e => setBorrador({ ...borrador, idCampania: e.target.value, idLote: "" })}>
          <option value="">Todas las campañas</option>
          {datos?.campanias.map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
        </select></label>
        <label>Lote<select value={borrador.idLote} onChange={e => setBorrador({ ...borrador, idLote: e.target.value })}>
          <option value="">Todos los lotes</option>
          {datos?.lotes.filter(x => !borrador.idCampania || x.idCampania === borrador.idCampania)
            .map(x => <option key={x.id} value={x.id}>{x.nombre}</option>)}
        </select></label>
        <label>Fecha inicial<input type="date" value={borrador.desde} max={borrador.hasta || undefined} onChange={e => setBorrador({ ...borrador, desde: e.target.value })} /></label>
        <label>Fecha final<input type="date" value={borrador.hasta} min={borrador.desde || undefined} onChange={e => setBorrador({ ...borrador, hasta: e.target.value })} /></label>
      </div>
      <div className="exactitud-filter-actions">
        <span>Deja las fechas vacías para consultar todo el historial.</span>
        <div><button type="button" className="exactitud-clear" disabled={cargando} onClick={() => {
          setBorrador(vacios); setPagina(1); setFiltros({ ...vacios }); setError(""); setCargando(true);
        }}>Limpiar filtros</button><button type="submit" className="exactitud-apply" disabled={cargando}>Ver resultados</button></div>
      </div>
    </form>
    {(error || cargando) && <div className="exactitud-feedback" aria-live="polite">
      {error && <p role="alert">{error}</p>}
      {cargando && <p><RefreshCw size={17} className="girando" /> Consultando los diagnósticos del período...</p>}
    </div>}
    {!cargando && !error && datos && <>
      <div className="exactitud-contexto" aria-label="Filtros aplicados">
        <span>{campania}</span><span>{lote}</span><span><CalendarDays size={14} />{periodo}</span>
      </div>

      <section className="exactitud-overview" aria-label="Resumen de errores">
        <div className="panel-indicador exactitud-hero">
          <div className="exactitud-section-title"><AlertTriangle size={20} /><h2>Errores confirmados del período</h2></div>
          <strong className="exactitud-hero-value">{datos.revisados > 0 ? datos.numeroErrores.toLocaleString("es-PE") : "—"}</strong>
          <p>{datos.revisados > 0 ? <>Diagnósticos que necesitaron una corrección de clase entre <strong>{datos.revisados}</strong> revisados.</> : "Todavía no hay diagnósticos revisados para identificar errores."}</p>
          <span className="exactitud-formula">Contar los diagnósticos cuya clase predicha difiere de la clase del especialista.</span>
          <div className="exactitud-resultados"><div><span>Plantas distintas con errores<strong>{datos.plantasConErrores}</strong></span></div>
            <div><span>Errores por 100 revisados<strong>{tasa(datos.erroresPor100)}</strong></span></div></div>
        </div>
        <div className="panel-indicador exactitud-cobertura">
          <div className="exactitud-section-title"><ShieldCheck size={20} /><h2>Qué tan completa es la revisión</h2></div>
          <div className="exactitud-coverage-number"><strong>{cobertura} %</strong><span>de los diagnósticos revisados</span></div>
          <div className="exactitud-coverage-track" aria-hidden="true"><div style={{ width: cobertura + "%" }} /></div>
          <dl><div><dt>Diagnósticos realizados</dt><dd>{datos.totalDiagnosticos}</dd></div>
            <div><dt>Revisados por el especialista</dt><dd>{datos.revisados}</dd></div>
            <div className="exactitud-pendiente"><dt><Clock3 size={15} /> Pendientes de revisión</dt><dd>{datos.pendientes}</dd></div></dl>
          <p>Los pendientes no son errores ni aciertos confirmados. El conteo puede cambiar cuando se revisen.</p>
        </div>
      </section>
      <section aria-label="Tipos de errores" className="errores-tipos">
        <article className="panel-indicador"><Leaf size={22} /><strong>{datos.revisados > 0 ? datos.noDetectados : "—"}</strong><h2>Afección no detectada</h2><p>El sistema indicó una planta sana, pero el especialista registró una afección.</p></article>
        <article className="panel-indicador"><AlertTriangle size={22} /><strong>{datos.revisados > 0 ? datos.falsasAlertas : "—"}</strong><h2>Falsa alerta</h2><p>El sistema indicó una afección, pero el especialista registró una planta sana.</p></article>
        <article className="panel-indicador"><Shuffle size={22} /><strong>{datos.revisados > 0 ? datos.confusionesEntreAfecciones : "—"}</strong><h2>Confusión entre afecciones</h2><p>El sistema detectó una afección, pero eligió una clase distinta de la registrada por el especialista.</p></article>
      </section>
      {datos.numeroErrores > 0 && <section className="panel-indicador">
        <div className="exactitud-section-title"><Shuffle size={20} /><h2>¿Qué confunde con más frecuencia?</h2></div>
        <p className="exactitud-description">Estos pares muestran las clases que conviene revisar al mejorar el modelo. Son diferencias confirmadas, no explican por sí solas la causa del error.</p>
        <div className="exactitud-tabla errores-confusiones"><table><caption className="exactitud-sr-only">Confusiones entre la clase predicha y la clase registrada por el especialista</caption>
          <thead><tr><th scope="col">El sistema indicó</th><th scope="col">El especialista registró</th><th scope="col">Número de errores</th></tr></thead>
          <tbody>{datos.confusiones.map(c => <tr key={c.idClasePredicha + c.idClaseReal}><th scope="row">{c.clasePredicha}</th><td>{c.claseReal}</td><td><span className="exactitud-badge">{c.errores}</span></td></tr>)}</tbody>
        </table></div>
      </section>}
      {datos.dias.length === 0 ? <div className="panel-indicador exactitud-empty"><AlertTriangle size={32} /><h2>No hay diagnósticos en esta selección</h2><p>Prueba otra campaña, lote o rango de fechas.</p></div> : <>
        <section className="panel-indicador">
          <div className="exactitud-section-title"><BarChart3 size={20} /><h2>Errores por día</h2></div>
          <p className="exactitud-description">Un conteo mayor puede deberse a más evaluaciones. Compara también los revisados y los errores por cada 100 revisados.</p>
          <div className="exactitud-tabla"><table><caption className="exactitud-sr-only">Número de errores y volumen de revisión diario</caption>
            <thead><tr>{["Fecha", "Diagnósticos", "Revisados", "Errores", "Pendientes", "Errores / 100 revisados"].map(x => <th scope="col" key={x}>{x}</th>)}</tr></thead>
            <tbody>{datos.dias.map(d => <tr key={d.fecha}><th scope="row">{fecha(d.fecha)}</th><td>{d.totalDiagnosticos}</td><td>{d.validados}</td>
              <td><span className={d.validados > 0 ? "exactitud-badge" : "exactitud-badge empty"}>{d.validados > 0 ? d.incorrectos : "Sin revisión"}</span></td>
              <td>{d.pendientes}</td><td>{tasa(d.validados > 0 ? Math.round(d.incorrectos / d.validados * 10000) / 100 : null)}</td></tr>)}</tbody>
          </table></div>
        </section>
        <section className="panel-indicador">
          <div className="exactitud-section-title"><MapPin size={20} /><h2>¿En qué lotes aparecen?</h2></div>
          <p className="exactitud-description">Ordenados por cantidad de errores. Un lote con más errores no necesariamente tiene peor rendimiento: revisa también su volumen de evaluaciones.</p>
          <div className="exactitud-tabla errores-lotes"><table><caption className="exactitud-sr-only">Errores confirmados y diagnósticos revisados por lote</caption>
            <thead><tr><th scope="col">Lote y campaña</th><th scope="col">Revisados</th><th scope="col">Errores</th><th scope="col">Errores / 100 revisados</th></tr></thead>
            <tbody>{datos.porLote.map(l => <tr key={l.idLote}><th scope="row"><Link to={"/mapa/" + l.idLote}>{l.lote}</Link><small>{l.campania}</small></th><td>{l.revisados}</td><td>{l.revisados > 0 ? l.errores : "Sin revisión"}</td><td>{tasa(l.erroresPor100)}</td></tr>)}</tbody>
          </table></div>
        </section>
      </>}
      <section className="panel-indicador">
        <div className="exactitud-section-title"><ListChecks size={20} /><h2>Casos que necesitaron corrección</h2></div>
        <p className="exactitud-description">Identifica la planta y consulta su historial en el lote. Cada registro corresponde a un diagnóstico, aunque una planta aparezca varias veces.</p>
        {datos.numeroErrores === 0 ? <p>{datos.revisados === 0 ? "Primero se necesita la revisión del especialista." : "No hay errores confirmados en los diagnósticos revisados de esta selección."}{datos.pendientes > 0 && " Todavía quedan diagnósticos pendientes de revisión."}</p> : <>
          <div className="errores-casos">{datos.casos.map(c => <article key={c.idDiagnostico}>
            <div><strong>{c.planta}</strong><span>Fila {c.fila} · Planta {c.numeroPlanta}</span><small>{new Date(c.fechaDiagnostico).toLocaleString("es-PE", { timeZone: "America/Lima" })}</small></div>
            <div className="errores-caso-clases"><span>Sistema: <strong>{c.clasePredicha}</strong></span><span>Especialista: <strong>{c.claseReal}</strong></span>{c.observaciones && <small>Observación: {c.observaciones}</small>}</div>
            <div><span>{c.lote}</span><small>{c.campania}</small><Link to={"/mapa/" + c.idLote}>Ver lote →</Link></div>
          </article>)}</div>
          <nav className="errores-paginacion" aria-label="Páginas de casos"><span>Página {datos.pagina} de {datos.paginas} · {datos.numeroErrores} casos</span><div>
            <button disabled={datos.pagina <= 1 || cargando} onClick={() => { setCargando(true); setPagina(datos.pagina - 1); }}><ChevronLeft size={16} /> Anterior</button>
            <button disabled={datos.pagina >= datos.paginas || cargando} onClick={() => { setCargando(true); setPagina(datos.pagina + 1); }}>Siguiente <ChevronRight size={16} /></button>
          </div></nav>
        </>}
      </section>
      <details className="exactitud-ayuda"><summary><Info size={17} /> Cómo usar este indicador en tu tesis</summary>
        <ul><li>El indicador principal es el número de diagnósticos incorrectos confirmados por el especialista.</li>
          <li>La exactitud resume cuántos aciertos hay; este detalle permite localizar y clasificar los errores para decidir qué mejorar.</li>
          <li>Los errores por 100 revisados son contexto para comparar volúmenes distintos, no reemplazan el conteo principal.</li>
          <li>Para comparar métodos o períodos, usa condiciones y cantidades de evaluación equivalentes. Una reducción de errores con menos revisiones no demuestra una mejora por sí sola.</li>
          <li>Las fechas corresponden al diagnóstico en Perú. Una revisión posterior actualiza los resultados del día original.</li></ul>
      </details>
    </>}
  </div>;
}
