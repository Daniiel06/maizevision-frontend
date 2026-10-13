import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Target, SlidersHorizontal, CheckCircle2, XCircle, Clock3, ShieldCheck, CalendarDays, BarChart3, Info } from "lucide-react";
import { obtenerDetalleExactitud } from "../api/indicadoresApi";
import type { ExactitudDetalle as Detalle } from "../types/indicadores.types";

const vacios = { idCampania: "", idLote: "", desde: "", hasta: "" };
const porcentaje = (valor: number | null) => valor === null ? "Sin datos validados" :
  valor.toLocaleString("es-PE", { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + " %";
const fecha = (valor: string) => new Date(valor + "T12:00:00").toLocaleDateString("es-PE");

export default function ExactitudDetalle({ volver }: { volver: () => void }) {
  const [borrador, setBorrador] = useState(vacios);
  const [filtros, setFiltros] = useState(vacios);
  const [datos, setDatos] = useState<Detalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    obtenerDetalleExactitud({
      idCampania: filtros.idCampania || undefined, idLote: filtros.idLote || undefined,
      desde: filtros.desde || undefined, hasta: filtros.hasta || undefined,
    }, controller.signal).then(resultado => {
      if (!controller.signal.aborted) { setDatos(resultado); setError(""); }
    }).catch(() => {
      if (!controller.signal.aborted) setError("No se pudo cargar la exactitud. Intenta actualizar los datos.");
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });
    return () => controller.abort();
  }, [filtros, revision]);


  const cobertura = datos && datos.totalDiagnosticos > 0 ? Math.round(datos.validados / datos.totalDiagnosticos * 100) : 0;
  const campania = datos?.campanias.find(x => x.id === filtros.idCampania)?.nombre ?? "Todas las campañas";
  const lote = datos?.lotes.find(x => x.id === filtros.idLote)?.nombre ?? "Todos los lotes";
  const periodo = filtros.desde && filtros.hasta ? fecha(filtros.desde) + " — " + fecha(filtros.hasta)
    : filtros.desde ? "Desde " + fecha(filtros.desde) : filtros.hasta ? "Hasta " + fecha(filtros.hasta) : "Todo el período";

  return <div className="indicadores-page exactitud-page">
    <button className="exactitud-volver" onClick={volver}><ArrowLeft size={17} /> Indicadores</button>
    <header className="indicadores-header">
      <div>
        <span className="indicadores-eyebrow">INDICADOR 01 · ACIERTOS DEL MODELO</span>
        <h1>Exactitud del diagnóstico</h1>
        <p>¿Cuántos diagnósticos coinciden con la revisión del especialista?</p>
      </div>
      <button className="indicadores-actualizar" disabled={cargando} onClick={() => { setCargando(true); setRevision(x => x + 1); }}>
        <RefreshCw size={17} className={cargando ? "girando" : ""} /> {cargando ? "Actualizando..." : "Actualizar datos"}
      </button>
      <Link className="indicadores-actualizar" to="/grupos">Ver por grupos de plantas</Link>
    </header>
    <form className="panel-indicador exactitud-filtros" onSubmit={e => {
      e.preventDefault();
      if (borrador.desde && borrador.hasta && borrador.desde > borrador.hasta) {
        setError("La fecha inicial no puede ser posterior a la final."); return;
      }
      setError(""); setCargando(true); setFiltros({ ...borrador });
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
          setBorrador(vacios); setFiltros({ ...vacios }); setError(""); setCargando(true);
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
      <section className="exactitud-overview" aria-label="Resumen de exactitud">
        <div className="panel-indicador exactitud-hero">
          <div className="exactitud-section-title"><Target size={20} /><h2>Exactitud del período</h2></div>
          <strong className="exactitud-hero-value">{datos.porcentajeExactitud === null ? "—" : porcentaje(datos.porcentajeExactitud)}</strong>
          <p>{datos.validados > 0 ? <><strong>{datos.correctos}</strong> diagnósticos correctos de <strong>{datos.validados}</strong> revisados.</>
            : "Se calculará cuando el especialista revise los diagnósticos."}</p>
          <span className="exactitud-formula">Correctos ÷ revisados × 100</span>
          <div className="exactitud-resultados">
            <div className="exactitud-correcto"><CheckCircle2 size={19} /><span>Correctos<strong>{datos.correctos}</strong></span></div>
            <div className="exactitud-incorrecto"><XCircle size={19} /><span>Incorrectos<strong>{datos.incorrectos}</strong></span></div>
          </div>
        </div>
        <div className="panel-indicador exactitud-cobertura">
          <div className="exactitud-section-title"><ShieldCheck size={20} /><h2>Revisión del especialista</h2></div>
          <div className="exactitud-coverage-number"><strong>{cobertura} %</strong><span>de los diagnósticos revisados</span></div>
          <div className="exactitud-coverage-track" aria-hidden="true"><div style={{ width: cobertura + "%" }} /></div>
          <dl><div><dt>Diagnósticos realizados</dt><dd>{datos.totalDiagnosticos}</dd></div>
            <div><dt>Revisados</dt><dd>{datos.validados}</dd></div>
            <div className="exactitud-pendiente"><dt><Clock3 size={15} /> Pendientes de revisión</dt><dd>{datos.pendientes}</dd></div>
            <div><dt>Plantas distintas evaluadas</dt><dd>{datos.plantasEvaluadas}</dd></div></dl>
          <p>Los pendientes no cuentan como aciertos ni errores.</p>
        </div>
      </section>
      {datos.dias.length === 0 ? <div className="panel-indicador exactitud-empty"><Target size={32} /><h2>No hay diagnósticos en esta selección</h2><p>Prueba otra campaña, lote o rango de fechas.</p></div> : <>
        <section className="panel-indicador exactitud-chart-panel" aria-label="Gráfico de exactitud diaria">
          <div className="exactitud-section-title"><BarChart3 size={20} /><h2>¿Cómo cambia la exactitud cada día?</h2></div>
          <p className="exactitud-description">Cada barra muestra el porcentaje de aciertos entre los diagnósticos revisados de ese día.</p>
          <div className="exactitud-chart-scale" aria-hidden="true"><span>0 %</span><span>50 %</span><span>100 %</span></div>
          <div className="exactitud-grafico">{[...datos.dias].reverse().map(d => <div className="exactitud-barra" key={d.fecha}>
            <span>{fecha(d.fecha)}</span>
            <div className="exactitud-track" aria-hidden="true"><div style={{ width: (d.porcentajeExactitud ?? 0) + "%" }} /></div>
            <div className="exactitud-day-value"><strong>{d.porcentajeExactitud === null ? "Sin revisión" : porcentaje(d.porcentajeExactitud)}</strong><small>{d.validados} revisados</small></div>
          </div>)}</div>
        </section>
        <section className="panel-indicador exactitud-table-panel">
          <div className="exactitud-section-title"><CalendarDays size={20} /><h2>Detalle de las evaluaciones diarias</h2></div>
          <p className="exactitud-description">Consulta los conteos que explican el resultado de cada día.</p>
          <div className="exactitud-tabla"><table>
            <caption className="exactitud-sr-only">Diagnósticos, plantas y resultados por día</caption>
            <thead><tr>{["Fecha", "Diagnósticos", "Plantas", "Revisados", "Correctos", "Incorrectos", "Pendientes", "Exactitud"]
              .map(x => <th scope="col" key={x}>{x}</th>)}</tr></thead>
            <tbody>{datos.dias.map(d => <tr key={d.fecha}><th scope="row">{fecha(d.fecha)}</th>
              <td>{d.totalDiagnosticos}</td><td>{d.plantasEvaluadas}</td><td>{d.validados}</td><td className="exactitud-correcto">{d.correctos}</td>
              <td className="exactitud-incorrecto">{d.incorrectos}</td><td className="exactitud-pendiente">{d.pendientes}</td>
              <td><span className={d.porcentajeExactitud === null ? "exactitud-badge empty" : "exactitud-badge"}>{d.porcentajeExactitud === null ? "Sin revisión" : porcentaje(d.porcentajeExactitud)}</span></td></tr>)}</tbody>
          </table></div>
        </section>
      </>}
      <details className="exactitud-ayuda"><summary><Info size={17} /> Cómo leer estos resultados</summary>
        <ul><li>Un diagnóstico es correcto cuando coincide con la clase registrada por el especialista.</li>
          <li>Una planta puede tener varios diagnósticos. Por eso, diagnósticos y plantas son cantidades diferentes.</li>
          <li>Los días corresponden a la fecha del diagnóstico en Perú. Si se revisa después, se actualiza el resultado del día original.</li>
          <li>La exactitud del período usa el total de correctos y revisados; no es el promedio de los porcentajes diarios.</li></ul>
      </details>
    </>}
  </div>;
}
