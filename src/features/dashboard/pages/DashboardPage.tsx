import { Activity, ArrowRight, CalendarDays, CheckCheck, ChevronRight, ExternalLink, Filter, Layers3, MapPinned, RefreshCw, ScanSearch, Sprout } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../auth/context/AuthContext';
import { obtenerPanelDashboard } from '../api/dashboardApi';
import type { DashboardFiltro, DashboardPanel, DashboardSector } from '../types/dashboard.types';
import './DashboardPage.css';

const numero = (n: number) => n.toLocaleString('es-PE');
const porcentaje = (n: number, total: number) => total ? `${(100 * n / total).toFixed(1)} %` : 'Sin datos';
const isoPeru = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const rango = (dias: number) => ({ desde: isoPeru(new Date(Date.now() - (dias - 1) * 86400000)), hasta: isoPeru(new Date()) });
const bases = { COMBINADA: 'Referencia si existe + IA pendiente', PREDICCION: 'Solo predicción del modelo', REFERENCIA: 'Solo referencia del especialista' };
const colores: Record<string, string> = { HEALTHY: '#3d936b', FALL_ARMYWORM: '#bb7c32', GRAY_LEAF_SPOT: '#768b9c', COMMON_RUST: '#bd674d', LEAF_BLIGHT: '#8b85ac', LETHAL_NECROSIS: '#b26083', TAR_SPOT: '#526965' };
const color = (codigo: string) => colores[codigo] ?? '#75817a';
const totalSector = (s: DashboardSector) => s.clases.reduce((n, c) => n + c.plantas, 0);
const cantidadSector = (s: DashboardSector, codigo: string) => s.clases.filter(c => codigo ? c.codigo === codigo : c.codigo !== 'HEALTHY').reduce((n, c) => n + c.plantas, 0);

export default function DashboardPage() {
  const { usuario } = useAuth();
  const permitido = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'SUPERVISOR';
  const [filtros, setFiltros] = useState<DashboardFiltro>(() => ({ idFundo: '', idCampania: '', idLote: '', base: 'COMBINADA', ...rango(30) }));
  const [aplicados, setAplicados] = useState(filtros);
  const [datos, setDatos] = useState<DashboardPanel | null>(null);
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');
  const [errorFiltro, setErrorFiltro] = useState('');
  const [revision, setRevision] = useState(0);
  const [clase, setClase] = useState('');
  const [sector, setSector] = useState<string | null>(null);
  const requestKey = JSON.stringify(aplicados) + ':' + revision;
  const cargando = loadedKey !== requestKey;

  useEffect(() => {
    if (!permitido) return;
    const abort = new AbortController();
    obtenerPanelDashboard(aplicados, abort.signal).then(r => { if (!abort.signal.aborted) { setDatos(r); setError(''); } })
      .catch(e => { if (abort.signal.aborted) return;
        setError(axios.isAxiosError(e) ? e.response?.data?.mensaje ?? (e.response?.status === 403 ? 'Tu cuenta no tiene acceso al panel de administración.' : 'No se pudo consultar el panel. Comprueba que la API esté disponible y actualizada.') : 'No se pudo cargar el panel.');
      }).finally(() => { if (!abort.signal.aborted) setLoadedKey(requestKey); });
    return () => abort.abort();
  }, [aplicados, revision, permitido, requestKey]);

  const campanias = datos?.campanias.filter(c => !filtros.idFundo || c.padre === filtros.idFundo) ?? [];
  const lotes = datos?.lotes.filter(l => filtros.idCampania ? l.padre === filtros.idCampania : campanias.some(c => c.id === l.padre)) ?? [];
  function aplicar(next = filtros) {
    const duracion = (Date.parse(next.hasta) - Date.parse(next.desde)) / 86400000;
    if (!next.desde || !next.hasta || !Number.isFinite(duracion) || duracion < 0 || duracion > 365) { setErrorFiltro('Selecciona un período válido de hasta 366 días.'); return; }
    setErrorFiltro(''); setSector(null); setClase(''); setAplicados({ ...next }); setRevision(v => v + 1);
  }
  function verLote(id: string) {
    const lote = datos?.lotes.find(l => l.id === id);
    const campania = datos?.campanias.find(c => c.id === lote?.padre);
    const next = { ...aplicados, idLote: id, idCampania: campania?.id ?? '', idFundo: campania?.padre ?? '' };
    setFiltros(next); aplicar(next);
  }
  if (!permitido) return <section className="dashboard-page"><h1>Panel de administración</h1><p>Este panel está disponible para administración y supervisión.</p><Link to="/jornadas">Ir a mis jornadas</Link></section>;

  const dominante = datos?.distribucion.find(c => c.codigo !== 'HEALTHY');
  const elegido = datos?.sectores.find(s => `${s.fila}:${s.columna}` === sector);
  const prioridad = datos?.sectores.filter(s => cantidadSector(s, clase) > 0).slice().sort((a, b) => cantidadSector(b, clase) - cantidadSector(a, clase) || a.fila - b.fila || a.columna - b.columna)[0];
  const nombreSeleccion = datos?.distribucion.find(c => c.codigo === clase)?.nombre ?? 'Todos los hallazgos';

  return <div className="dashboard-page">
    <header className="dashboard-hero"><div><span className="dashboard-kicker">PANEL DE DECISIONES</span><h1>Estado del cultivo</h1><p>{usuario?.nombres}, revisa qué se está encontrando y dónde conviene inspeccionar.</p></div><button className="dashboard-refresh" disabled={cargando} onClick={() => setRevision(v => v + 1)}><RefreshCw size={17} className={cargando ? 'dashboard-spin' : ''}/>Actualizar</button></header>

    <form className="dashboard-filtros" onSubmit={e => { e.preventDefault(); aplicar(); }}>
      <div className="dashboard-filter-heading"><strong><Filter size={16}/>Explorar registros</strong><div className="dashboard-periodos">{[7, 30, 90].map(d => <button type="button" key={d} onClick={() => setFiltros(f => ({ ...f, ...rango(d) }))}>Últimos {d} días</button>)}</div></div>
      <div className="dashboard-filter-grid">
        <label>Fundo<select aria-label="Fundo" value={filtros.idFundo} onChange={e => setFiltros(f => ({ ...f, idFundo: e.target.value, idCampania: '', idLote: '' }))}><option value="">Todos los fundos</option>{datos?.fundos.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}</select></label>
        <label>Campaña<select aria-label="Campaña" value={filtros.idCampania} onChange={e => setFiltros(f => ({ ...f, idCampania: e.target.value, idLote: '' }))}><option value="">Todas las campañas</option>{campanias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
        <label>Lote<select aria-label="Lote" value={filtros.idLote} onChange={e => setFiltros(f => ({ ...f, idLote: e.target.value }))}><option value="">Todos los lotes</option>{lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}</select></label>
        <label>Desde<input aria-label="Desde" type="date" value={filtros.desde} required onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))}/></label>
        <label>Hasta<input aria-label="Hasta" type="date" value={filtros.hasta} required min={filtros.desde} onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))}/></label>
        <label>Base de clasificación<select aria-label="Base de clasificación" value={filtros.base} onChange={e => setFiltros(f => ({ ...f, base: e.target.value as DashboardFiltro['base'] }))}>{Object.entries(bases).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      </div>
      <div className="dashboard-filter-footer"><span>Las fechas filtran las evaluaciones y jornadas. El inventario corresponde al ámbito seleccionado.</span><button type="submit" className="dashboard-primary" disabled={cargando}>Aplicar filtros <ArrowRight size={15}/></button></div>
      {errorFiltro && <p role="alert" className="dashboard-error">{errorFiltro}</p>}
    </form>
    {error && !cargando && <section role="alert" className="dashboard-error"><strong>No se pudo cargar la información</strong><p>{error}</p><button onClick={() => setRevision(v => v + 1)}>Volver a intentar</button></section>}
    {cargando && <section role="status" className="dashboard-loading"><RefreshCw size={25} className="dashboard-spin"/><p>Consultando campañas y evaluaciones…</p></section>}
    {!cargando && !error && datos && <>
      <div className="dashboard-context"><span>{new Date(datos.desde + 'T12:00:00').toLocaleDateString('es-PE')} – {new Date(datos.hasta + 'T12:00:00').toLocaleDateString('es-PE')} · {bases[datos.base]}</span><small>Actualizado {new Date(datos.generadoUtc).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</small></div>
      <section className="dashboard-kpis" aria-label="Resumen del ámbito seleccionado">
        <Metrica icono={<Sprout size={20}/>} titulo="Campañas" valor={datos.campaniasRegistradas} detalle={`${numero(datos.campaniasActivas)} activas`}/>
        <Metrica icono={<Layers3 size={20}/>} titulo="Lotes" valor={datos.lotesRegistrados} detalle="En las campañas seleccionadas"/>
        <Metrica icono={<Activity size={20}/>} titulo="Plantas registradas" valor={datos.plantasRegistradas} detalle="Inventario del ámbito seleccionado"/>
        <Metrica icono={<ScanSearch size={20}/>} titulo="Plantas evaluadas" valor={datos.plantasEvaluadas} detalle={`${numero(datos.diagnosticosRealizados)} diagnósticos en el período`}/>
      </section>
      <section className="dashboard-followup" aria-label="Cobertura y trabajo pendiente">
        <div><span>Cobertura de evaluación</span><strong>{porcentaje(datos.plantasEvaluadas, datos.plantasRegistradas)}</strong><progress value={datos.plantasEvaluadas} max={Math.max(1, datos.plantasRegistradas)} aria-label="Cobertura de plantas evaluadas"/><small>{numero(Math.max(0, datos.plantasRegistradas - datos.plantasEvaluadas))} plantas sin evaluación en este período</small></div>
        <div><span><CheckCheck size={16}/>Últimas observaciones revisadas</span><strong>{numero(datos.plantasRevisadas)} <small>de {numero(datos.plantasEvaluadas)}</small></strong><small>{numero(datos.plantasEvaluadas - datos.plantasRevisadas)} aún sin referencia; se identifican como predicciones.</small></div>
        <div><span><CalendarDays size={16}/>Jornadas del período</span><strong>{numero(datos.jornadasProgramadas)} <small>programadas</small></strong><small>{numero(datos.jornadasAbiertas)} abiertas · <Link to="/jornadas">Ver jornadas <ChevronRight size={12}/></Link></small></div>
      </section>
      <section className="dashboard-charts">
        <article className="dashboard-panel"><Cabecera numero="01" titulo="Qué se está encontrando" descripcion="Una clasificación por planta: su último diagnóstico dentro del período."/>
          {!datos.plantasEnBase ? <Vacio texto="No hay clasificaciones para la base y el período seleccionados."/> : <div className="dashboard-bars">{datos.distribucion.map(c => <button key={c.codigo} className={'dashboard-bar-item' + (clase === c.codigo ? ' seleccionada' : '')} onClick={() => { setClase(actual => actual === c.codigo ? '' : c.codigo); setSector(null); }} aria-pressed={clase === c.codigo} title="Resaltar esta categoría en los sectores del lote"><span className="dashboard-bar-label"><span><i style={{ background: color(c.codigo) }}/>{c.nombre}</span><strong>{numero(c.plantas)} <small>{porcentaje(c.plantas, datos.plantasEnBase)}</small></strong></span><span className="dashboard-bar-track"><span style={{ width: `${100 * c.plantas / datos.plantasEnBase}%`, background: color(c.codigo) }}/></span></button>)}</div>}
          <p className="dashboard-caption">Base: {numero(datos.plantasEnBase)} plantas con clasificación. Estas proporciones describen lo observado, no la incidencia de todo el fundo.</p>
        </article>
        <article className="dashboard-panel"><Cabecera numero="02" titulo="Actividad de evaluación" descripcion="Plantas distintas evaluadas cada día, según la fecha de diagnóstico."/><Tendencia datos={datos}/><p className="dashboard-caption">Una planta puede aparecer en varios días. Este gráfico muestra actividad, no evolución de la enfermedad.</p></article>
      </section>
      <section className="dashboard-panel" id="dashboard-sectores"><div className="dashboard-panel-top"><Cabecera numero="03" titulo="Dónde se concentran los hallazgos" descripcion="Sectores del lote según las filas y las posiciones registradas."/><label className="dashboard-resaltar">Resaltar<select aria-label="Resaltar" value={clase} onChange={e => { setClase(e.target.value); setSector(null); }}><option value="">Todos los hallazgos</option>{datos.distribucion.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}</select></label></div>
        {!aplicados.idLote ? <Vacio texto="Selecciona un lote en los filtros o en la tabla inferior para explorar sus sectores."/> : !datos.sectores.length ? <Vacio texto="Este lote todavía no tiene una distribución de plantas registrada."/> : <>
          <div className="dashboard-sector-layout"><div><div className="dashboard-sector-grid" style={{ '--columnas': Math.max(...datos.sectores.map(s => s.columna)) + 1 } as CSSProperties}>
            {datos.sectores.map(s => { const total = totalSector(s), cantidad = cantidadSector(s, clase), valor = total ? cantidad / total : 0, id = `${s.fila}:${s.columna}`;
              return <button key={id} aria-pressed={sector === id} className={'dashboard-sector' + (!total ? ' sin-datos' : '') + (sector === id ? ' seleccionado' : '')} style={total ? { background: clase === 'HEALTHY' ? `rgba(61,147,107,${0.08 + valor * 0.48})` : `rgba(185,108,49,${0.05 + valor * 0.47})` } : undefined} onClick={() => setSector(id)} title={`Filas ${s.filaDesde}–${s.filaHasta}, posiciones ${s.posicionDesde}–${s.posicionHasta}. ${s.evaluadas} evaluadas de ${s.registradas} registradas.`}>
                <span>F{s.filaDesde}–{s.filaHasta}</span><small>P{s.posicionDesde}–{s.posicionHasta}</small><strong>{total ? porcentaje(cantidad, total) : 'Sin datos'}</strong><small>{total ? `${cantidad} de ${total} en base` : s.registradas ? `${numero(s.registradas)} registradas` : 'Sin plantas registradas'}</small></button>; })}
          </div><p className="dashboard-caption">{nombreSeleccion}. Color más intenso = mayor proporción entre las plantas con clasificación del sector. Sin datos no significa libre de plagas.</p><p className="dashboard-orientacion">Fila 1 arriba · Posición 1 a la izquierda. Esquema sin orientación geográfica.</p></div>
          <aside className="dashboard-sector-info"><h3>{elegido ? `Filas ${elegido.filaDesde}–${elegido.filaHasta}` : 'Explora un sector'}</h3>
            {elegido ? <><p>Posiciones {elegido.posicionDesde}–{elegido.posicionHasta}</p><dl><div><dt>Plantas registradas</dt><dd>{numero(elegido.registradas)}</dd></div><div><dt>Evaluadas en el período</dt><dd>{numero(elegido.evaluadas)}</dd></div><div><dt>En la base seleccionada</dt><dd>{numero(totalSector(elegido))}</dd></div></dl>{elegido.clases.map(c => <div className="dashboard-sector-class" key={c.codigo}><span><i style={{ background: color(c.codigo) }}/>{c.nombre}</span><strong>{c.plantas}</strong></div>)}{!elegido.clases.length && <p>No hay clasificaciones en esta base para el sector.</p>}</> : <><p>Selecciona una celda para ver el rango de plantas y sus categorías.</p>{prioridad && <p>Mayor cantidad de {clase ? nombreSeleccion.toLowerCase() : 'hallazgos'}: <strong>filas {prioridad.filaDesde}–{prioridad.filaHasta}, posiciones {prioridad.posicionDesde}–{prioridad.posicionHasta}</strong> ({cantidadSector(prioridad, clase)} plantas).</p>}</>}
            <Link className="dashboard-map-link" to={'/mapa/' + aplicados.idLote}>Abrir mapa del lote <ArrowRight size={15}/></Link></aside></div>
        </>}
      </section>
      <section className="dashboard-bottom"><article className="dashboard-panel"><Cabecera numero="04" titulo="Lotes para revisar" descripcion="Hasta ocho lotes, ordenados por cantidad de plantas con hallazgos."/>
        {!datos.comparacionLotes.length ? <Vacio texto="No hay lotes en el ámbito seleccionado."/> : <div className="dashboard-table-scroll"><table className="dashboard-table"><thead><tr><th>Lote</th><th>Evaluadas</th><th>Con hallazgo</th><th>Más frecuente</th><th><span className="dashboard-sr-only">Acción</span></th></tr></thead><tbody>{datos.comparacionLotes.map(l => <tr key={l.idLote}><td><strong>{l.nombre}</strong><small>{l.campania}</small></td><td>{numero(l.evaluadas)} / {numero(l.registradas)}<small>{porcentaje(l.evaluadas, l.registradas)} de cobertura</small></td><td>{numero(l.conHallazgo)}<small>de {numero(l.enBase)} en base</small></td><td>{l.predominante ?? (l.enBase ? 'Sin hallazgos en base' : 'Sin datos')}</td><td><button className="dashboard-text-button" onClick={() => verLote(l.idLote)}>Ver sectores <ChevronRight size={13}/></button></td></tr>)}</tbody></table></div>}
      </article><article className="dashboard-panel dashboard-acciones"><Cabecera numero="05" titulo="Qué hacer con esta información" descripcion="Prioriza la inspección y define el manejo con el responsable agronómico."/>
        {dominante ? <><span className="dashboard-dominante">Más frecuente entre los hallazgos</span><h3>{dominante.nombre}</h3><p><strong>{numero(dominante.plantas)} plantas</strong> · {porcentaje(dominante.plantas, datos.plantasEnBase)} de la base seleccionada.</p><p>{accion(dominante.codigo)}</p></> : <p>{datos.plantasEnBase ? 'Las observaciones de esta base corresponden a hoja sana. Continúa el monitoreo de las plantas sin evaluar.' : 'Registra evaluaciones para identificar qué zonas conviene inspeccionar.'}</p>}
        <p className="dashboard-manejo">Los herbicidas controlan malezas. La presencia de un insecto o una enfermedad foliar no determina por sí sola qué producto aplicar.</p><a href="https://servicios.senasa.gob.pe/SIGIAWeb/sigia_consulta_cultivo.html" target="_blank" rel="noopener noreferrer">Consultar productos registrados en SENASA <ExternalLink size={14}/></a><small>Verificar cultivo, plaga y uso autorizado en la etiqueta antes de una aplicación.</small>
      </article></section>
      <footer className="dashboard-footer">Los cálculos de exactitud, tiempo y errores se mantienen en <Link to="/indicadores">Indicadores</Link>. Este panel resume la situación observada del cultivo.</footer>
    </>}
  </div>;
}

function accion(codigo: string) {
  if (codigo === 'FALL_ARMYWORM') return 'Inspecciona las plantas señaladas para confirmar presencia del insecto y nivel de daño. Con esa evaluación, define las medidas de manejo integrado; el número de fotos clasificadas no establece un umbral de aplicación.';
  if (['GRAY_LEAF_SPOT', 'COMMON_RUST', 'LEAF_BLIGHT', 'TAR_SPOT'].includes(codigo)) return 'Revisa los síntomas en las zonas señaladas y confirma la enfermedad. El responsable agronómico debe valorar el estado del cultivo y las condiciones del campo antes de decidir medidas de manejo o un fungicida.';
  return 'Confirma la condición foliar y su causa en las plantas señaladas antes de definir medidas de manejo. La clasificación de una imagen no establece un tratamiento químico.';
}
function Metrica({ icono, titulo, valor, detalle }: { icono: ReactNode; titulo: string; valor: number; detalle: string }) { return <article className="dashboard-metric"><span className="dashboard-metric-icon">{icono}</span><span>{titulo}</span><strong>{numero(valor)}</strong><small>{detalle}</small></article>; }
function Cabecera({ numero: n, titulo, descripcion }: { numero: string; titulo: string; descripcion: string }) { return <header className="dashboard-panel-heading"><span>{n}</span><div><h2>{titulo}</h2><p>{descripcion}</p></div></header>; }
function Vacio({ texto }: { texto: string }) { return <div className="dashboard-empty"><MapPinned size={23}/><p>{texto}</p></div>; }
function Tendencia({ datos }: { datos: DashboardPanel }) {
  const serie = useMemo(() => {
    const porDia = new Map(datos.actividad.map(d => [d.fecha.slice(0, 10), d.plantas]));
    const values: { fecha: string; plantas: number }[] = [];
    for (let t = Date.parse(datos.desde + 'T00:00:00Z'); t <= Date.parse(datos.hasta + 'T00:00:00Z'); t += 86400000) {
      const fecha = new Date(t).toISOString().slice(0, 10); values.push({ fecha, plantas: porDia.get(fecha) ?? 0 });
    }
    return values;
  }, [datos]);
  if (!datos.actividad.length) return <Vacio texto="No hay evaluaciones registradas en estas fechas."/>;
  const max = Math.max(1, ...serie.map(d => d.plantas));
  const x = (i: number) => 40 + (serie.length === 1 ? 220 : i * 440 / (serie.length - 1));
  const y = (n: number) => 180 - n * 145 / max;
  const puntos = serie.map((d, i) => `${x(i)},${y(d.plantas)}`).join(' ');
  return <div className="dashboard-trend"><svg viewBox="0 0 510 225" role="img" aria-label={`Plantas evaluadas por día. Máximo diario: ${max}.`}>
    {[0, 0.5, 1].map(p => <g key={p}><line x1="40" x2="480" y1={y(p * max)} y2={y(p * max)} stroke="#e1e9e3" strokeDasharray="4 4"/><text x="30" y={y(p * max) + 4} textAnchor="end">{Math.round(p * max)}</text></g>)}
    <polygon points={`${x(0)},180 ${puntos} ${x(serie.length - 1)},180`} fill="#e6f1e9"/><polyline points={puntos} fill="none" stroke="#27744e" strokeWidth="3" strokeLinejoin="round"/>
    {serie.map((d, i) => <circle key={d.fecha} cx={x(i)} cy={y(d.plantas)} r={serie.length > 90 ? 2 : 3.5} fill="#27744e"><title>{d.fecha}: {d.plantas} plantas evaluadas</title></circle>)}
    {[0, Math.floor((serie.length - 1) / 2), serie.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => <text key={i} x={x(i)} y="210" textAnchor="middle">{serie[i].fecha.slice(8)}/{serie[i].fecha.slice(5, 7)}</text>)}
  </svg><span><i/>Plantas evaluadas por día</span></div>;
}
