import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Clock3, SlidersHorizontal, CalendarDays, BarChart3, Info } from "lucide-react";
import { obtenerDetalleTiempo } from "../api/indicadoresApi";
import type { TiempoDetalle as Detalle } from "../types/indicadores.types";

const vacios = { idCampania: "", idLote: "", desde: "", hasta: "" };
const tiempo = (valor: number | null) => valor === null ? "Sin tiempo" : valor.toLocaleString("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " s";
const fecha = (valor: string) => new Date(valor + "T12:00:00").toLocaleDateString("es-PE");

export default function TiempoDetalle({ volver }: { volver: () => void }) {
  const [borrador, setBorrador] = useState(vacios);
  const [filtros, setFiltros] = useState(vacios);
  const [datos, setDatos] = useState<Detalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    obtenerDetalleTiempo({
      idCampania: filtros.idCampania || undefined, idLote: filtros.idLote || undefined,
      desde: filtros.desde || undefined, hasta: filtros.hasta || undefined,
    }, controller.signal).then(resultado => {
      if (!controller.signal.aborted) { setDatos(resultado); setError(""); }
    }).catch(() => {
      if (!controller.signal.aborted) setError("No se pudo cargar el tiempo. Intenta actualizar los datos.");
    }).finally(() => {
      if (!controller.signal.aborted) setCargando(false);
    });
    return () => controller.abort();
  }, [filtros, revision]);


  const maxPromedio = Math.max(...(datos?.dias.map(d => d.promedioSegundos ?? 0) ?? []), 0.001);
  const campania = datos?.campanias.find(x => x.id === filtros.idCampania)?.nombre ?? "Todas las campañas";
  const lote = datos?.lotes.find(x => x.id === filtros.idLote)?.nombre ?? "Todos los lotes";
  const periodo = filtros.desde && filtros.hasta ? fecha(filtros.desde) + " — " + fecha(filtros.hasta)
    : filtros.desde ? "Desde " + fecha(filtros.desde) : filtros.hasta ? "Hasta " + fecha(filtros.hasta) : "Todo el período";

  return <div className="indicadores-page exactitud-page tiempo-page">
    <button className="exactitud-volver" onClick={volver}><ArrowLeft size={17} /> Indicadores</button>
    <header className="indicadores-header">
      <div>
        <span className="indicadores-eyebrow">INDICADOR 02 · TIEMPO REAL POR PLANTA</span>
        <h1>Tiempo promedio de diagnóstico</h1>
        <p>¿Cuánto tarda el trabajador desde que entra a la planta hasta ver el resultado?</p>
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

      <section className="exactitud-overview" aria-label="Resumen de tiempos">
        <div className="panel-indicador exactitud-hero">
          <div className="exactitud-section-title"><Clock3 size={20} /><h2>Tiempo promedio del período</h2></div>
          <strong className="exactitud-hero-value">{datos.promedioSegundos === null ? "—" : tiempo(datos.promedioSegundos)}</strong>
          <p>Calculado con <strong>{datos.conTiempo}</strong> diagnósticos con tiempo registrado.</p>
          <span className="exactitud-formula">Suma de tiempos ÷ diagnósticos con tiempo</span>
          <div className="exactitud-resultados">
            <div><span>Más rápido<strong>{tiempo(datos.minimoSegundos)}</strong></span></div>
            <div><span>Más lento<strong>{tiempo(datos.maximoSegundos)}</strong></span></div>
          </div>
        </div>
        <div className="panel-indicador exactitud-cobertura">
          <div className="exactitud-section-title"><Info size={20} /><h2>Qué estamos midiendo</h2></div>
          <p>Desde que el trabajador entra a la planta para un diagnóstico nuevo hasta que aparece el resultado. Incluye tomar o elegir la foto, subirla, analizarla y esperar la respuesta.</p>
          <dl><div><dt>Diagnósticos realizados</dt><dd>{datos.totalDiagnosticos}</dd></div>
            <div><dt>Con tiempo real</dt><dd>{datos.conTiempo}</dd></div>
            <div><dt>Sin tiempo real</dt><dd>{datos.sinTiempo}</dd></div></dl>
          <p>No incluye la revisión posterior del especialista. Los registros antiguos solo tienen tiempo de procesamiento y no entran a este promedio.</p>
        </div>
      </section>
      {datos.dias.length === 0 ? <div className="panel-indicador exactitud-empty"><Clock3 size={32} /><h2>No hay diagnósticos en esta selección</h2><p>Prueba otra campaña, lote o rango de fechas.</p></div> : <>
        {datos.conTiempo > 0 ? <section className="panel-indicador exactitud-chart-panel" aria-label="Gráfico de tiempo promedio diario">
          <div className="exactitud-section-title"><BarChart3 size={20} /><h2>¿Cómo cambia el tiempo cada día?</h2></div>
          <p className="exactitud-description">Las barras más cortas representan un diagnóstico completo más rápido.</p>
          <div className="exactitud-chart-scale" aria-hidden="true"><span>0 s</span><span>{tiempo(maxPromedio / 2)}</span><span>{tiempo(maxPromedio)}</span></div>
          <div className="exactitud-grafico">{[...datos.dias].reverse().map(d => <div className="exactitud-barra" key={d.fecha}>
            <span>{fecha(d.fecha)}</span>
            <div className="exactitud-track" aria-hidden="true"><div style={{ width: (d.promedioSegundos ?? 0) / maxPromedio * 100 + "%" }} /></div>
            <div className="exactitud-day-value"><strong>{tiempo(d.promedioSegundos)}</strong><small>{d.conTiempo} con tiempo</small></div>
          </div>)}</div>
        </section> : <div className="panel-indicador exactitud-empty"><Clock3 size={32} /><h2>Aún no hay mediciones de tiempo real</h2><p>Los diagnósticos anteriores solo tienen tiempo del servidor. El promedio aparecerá al completar nuevos diagnósticos con esta medición.</p></div>}
        <section className="panel-indicador exactitud-table-panel">
          <div className="exactitud-section-title"><CalendarDays size={20} /><h2>Detalle diario</h2></div>
          <p className="exactitud-description">Tiempos expresados en segundos. Los registros sin tiempo válido se excluyen del cálculo.</p>
          <div className="exactitud-tabla"><table>
            <caption className="exactitud-sr-only">Tiempo real del diagnóstico por día</caption>
            <thead><tr>{["Fecha", "Diagnósticos", "Con tiempo", "Sin tiempo", "Promedio", "Más rápido", "Más lento"].map(x => <th scope="col" key={x}>{x}</th>)}</tr></thead>
            <tbody>{datos.dias.map(d => <tr key={d.fecha}><th scope="row">{fecha(d.fecha)}</th>
              <td>{d.totalDiagnosticos}</td><td>{d.conTiempo}</td><td>{d.sinTiempo}</td>
              <td><span className={d.promedioSegundos === null ? "exactitud-badge empty" : "exactitud-badge"}>{tiempo(d.promedioSegundos)}</span></td>
              <td>{tiempo(d.minimoSegundos)}</td><td>{tiempo(d.maximoSegundos)}</td></tr>)}</tbody>
          </table></div>
        </section>
      </>}
      <details className="exactitud-ayuda"><summary><Info size={17} /> Cómo interpretar el indicador</summary>
        <ul><li>El promedio usa todos los tiempos válidos del período, no el promedio simple de los promedios diarios.</li>
          <li>Los tiempos vacíos, cero o negativos no se incluyen. Sin tiempos válidos se muestra “Sin tiempo”.</li>
          <li>Los días corresponden a la fecha del diagnóstico en Perú.</li>
          <li>Para comparar con el método tradicional, mide desde que comienza la evaluación de la planta hasta que termina de escribir el diagnóstico. Si se abandona sin mostrar un resultado, no se registra duración.</li></ul>
      </details>
    </>}
  </div>;
}
