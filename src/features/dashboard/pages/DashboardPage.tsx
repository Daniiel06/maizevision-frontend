import { Activity, ArrowRight, CalendarDays, ChevronRight, ExternalLink, Info, Layers3, MapPinned, Moon, RefreshCw, ScanSearch, SlidersHorizontal, Sprout, Sun } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../auth/context/AuthContext';
import { obtenerPanelDashboard } from '../api/dashboardApi';
import type { DashboardFiltro, DashboardPanel, DashboardSector } from '../types/dashboard.types';
import LoteSectores3D from '../components/LoteSectores3D';
import { coloresLote } from '../components/lote3dModelo';
import './DashboardPage.css';

const numero = (n: number) => n.toLocaleString('es-PE');
const porcentaje = (n: number, total: number) => total ? `${(100 * n / total).toFixed(1)} %` : 'Sin datos';
const fechaCorta = (fecha: string) => new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
const isoPeru = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const rango = (dias: number) => ({ desde: isoPeru(new Date(Date.now() - (dias - 1) * 86400000)), hasta: isoPeru(new Date()) });
const bases = { COMBINADA: 'Referencia + IA pendiente', PREDICCION: 'Predicción del modelo', REFERENCIA: 'Referencia del especialista' };
const color = (codigo: string) => `var(--dash-${codigo}, ${coloresLote[codigo] ?? '#a6b3cb'})`;
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
  const [avanzados, setAvanzados] = useState(false);
  const [vistaSectores, setVistaSectores] = useState<'3d' | 'sectores'>('3d');
  const [tema, setTema] = useState<'claro' | 'oscuro'>(() => {
    try { return localStorage.getItem('maizevision_dashboard_tema') === 'claro' ? 'claro' : 'oscuro'; }
    catch { return 'oscuro'; }
  });
  useEffect(() => {
    try { localStorage.setItem('maizevision_dashboard_tema', tema); } catch { /* El selector sigue funcionando sin almacenamiento. */ }
  }, [tema]);
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
  if (!permitido) return <section className="dashboard-page dashboard-denied"><h1>Panel de administración</h1><p>Este panel está disponible para administración y supervisión.</p><Link to="/jornadas">Ir a mis jornadas</Link></section>;
  const dominante = datos?.distribucion.filter(c => c.codigo !== 'HEALTHY').slice().sort((a, b) => b.plantas - a.plantas)[0];
  const elegido = datos?.sectores.find(s => `${s.fila}:${s.columna}` === sector);
  const nombreSeleccion = datos?.distribucion.find(c => c.codigo === clase)?.nombre ?? 'Hallazgos';
  const modificados = JSON.stringify(filtros) !== JSON.stringify(aplicados);

  return <div className="dashboard-page" data-tema={tema}>
    <header className="dashboard-hero"><div><span className="dashboard-kicker"><span/> MAIZEVISION / RESUMEN</span><h1>Estado del cultivo</h1></div><div className="dashboard-header-actions"><button type="button" className="dashboard-theme" aria-label={`Cambiar a modo ${tema === 'oscuro' ? 'claro' : 'oscuro'}`} title={`Cambiar a modo ${tema === 'oscuro' ? 'claro' : 'oscuro'}`} onClick={() => setTema(t => t === 'oscuro' ? 'claro' : 'oscuro')}>{tema === 'oscuro' ? <Sun size={16}/> : <Moon size={16}/>}<span>Modo {tema === 'oscuro' ? 'claro' : 'oscuro'}</span></button><button className="dashboard-refresh" aria-label="Actualizar" disabled={cargando} onClick={() => setRevision(v => v + 1)}><RefreshCw size={16} className={cargando ? 'dashboard-spin' : ''}/><span>Actualizar</span></button></div></header>
    <form className="dashboard-filtros" onSubmit={e => { e.preventDefault(); aplicar(); }}>
      <div className="dashboard-filter-grid">
        <label>Fundo<select aria-label="Fundo" value={filtros.idFundo} onChange={e => setFiltros(f => ({ ...f, idFundo: e.target.value, idCampania: '', idLote: '' }))}><option value="">Todos los fundos</option>{datos?.fundos.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}</select></label>
        <label>Campaña<select aria-label="Campaña" value={filtros.idCampania} onChange={e => setFiltros(f => ({ ...f, idCampania: e.target.value, idLote: '' }))}><option value="">Todas las campañas</option>{campanias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
        <label>Lote<select aria-label="Lote" value={filtros.idLote} onChange={e => setFiltros(f => ({ ...f, idLote: e.target.value }))}><option value="">Todos los lotes</option>{lotes.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}</select></label>
        <button type="button" className={'dashboard-more' + (avanzados ? ' activo' : '')} aria-expanded={avanzados} aria-controls="dashboard-filtros-avanzados" onClick={() => setAvanzados(v => !v)}><SlidersHorizontal size={16}/>Más filtros</button>
        <button type="submit" className="dashboard-primary" disabled={cargando}>Aplicar filtros <ArrowRight size={15}/></button>
      </div>
      {avanzados && <div className="dashboard-advanced" id="dashboard-filtros-avanzados">
        <label>Desde<input aria-label="Desde" type="date" value={filtros.desde} required onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))}/></label>
        <label>Hasta<input aria-label="Hasta" type="date" value={filtros.hasta} required min={filtros.desde} onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))}/></label>
        <label>Base de clasificación<select aria-label="Base de clasificación" value={filtros.base} onChange={e => setFiltros(f => ({ ...f, base: e.target.value as DashboardFiltro['base'] }))}>{Object.entries(bases).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      </div>}
      <div className="dashboard-filter-footer"><div className="dashboard-periodos">{[7, 30, 90].map(d => { const r = rango(d); return <button type="button" key={d} aria-pressed={aplicados.desde === r.desde && aplicados.hasta === r.hasta} disabled={cargando} onClick={() => { const next = { ...filtros, ...r }; setFiltros(next); aplicar(next); }}>Últimos {d} días</button>; })}</div><span>{modificados ? 'Cambios sin aplicar' : 'Inventario del ámbito · Evaluaciones del período'}</span></div>
      {errorFiltro && <p role="alert" className="dashboard-error">{errorFiltro}</p>}
    </form>
    {error && !cargando && <section role="alert" className="dashboard-error"><strong>No se pudo cargar la información</strong><p>{error}</p><button onClick={() => setRevision(v => v + 1)}>Volver a intentar</button></section>}
    {cargando && <section role="status" className="dashboard-loading"><RefreshCw size={25} className="dashboard-spin"/><p>Cargando resumen…</p></section>}
    {!cargando && !error && datos && <>
      <div className="dashboard-context"><span><CalendarDays size={13}/>{fechaCorta(datos.desde)} – {fechaCorta(datos.hasta)} <span className="dashboard-base-chip">{bases[datos.base]}</span></span><small>Actualizado {new Date(datos.generadoUtc).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' })}</small></div>
      <section className="dashboard-kpis" aria-label="Resumen del ámbito seleccionado">
        <Metrica tono="violeta" icono={<Sprout size={20}/>} titulo="Campañas" valor={datos.campaniasRegistradas} detalle={`${numero(datos.campaniasActivas)} activas`}/>
        <Metrica tono="turquesa" icono={<Layers3 size={20}/>} titulo="Lotes" valor={datos.lotesRegistrados} detalle="En el ámbito seleccionado"/>
        <Metrica tono="azul" icono={<Activity size={20}/>} titulo="Plantas registradas" valor={datos.plantasRegistradas} detalle="Inventario"/>
        <Metrica tono="verde" icono={<ScanSearch size={20}/>} titulo="Plantas evaluadas" valor={datos.plantasEvaluadas} detalle={`${numero(datos.diagnosticosRealizados)} diagnósticos · período`}/>
      </section>
      <section className="dashboard-charts">
        <article className="dashboard-panel dashboard-distribucion"><Cabecera titulo="Diagnósticos por categoría" ayuda="Último diagnóstico por planta en el período. La referencia reemplaza la predicción cuando existe, según la base seleccionada. Porcentajes entre plantas clasificadas; no representan incidencia de todo el fundo."/>
          {!datos.plantasEnBase ? <Vacio texto="No hay clasificaciones para la base y el período seleccionados."/> : <>
            <Distribucion datos={datos} clase={clase}/>
            <div className="dashboard-bars">{datos.distribucion.map(c => <button key={c.codigo} className={'dashboard-bar-item' + (clase === c.codigo ? ' seleccionada' : '')} onClick={() => { setClase(actual => actual === c.codigo ? '' : c.codigo); setSector(null); }} aria-pressed={clase === c.codigo} title="Resaltar categoría en los sectores"><span className="dashboard-bar-label"><span><i style={{ background: color(c.codigo) }}/>{c.nombre}</span><strong>{numero(c.plantas)}<small>{porcentaje(c.plantas, datos.plantasEnBase)}</small></strong></span></button>)}</div>
          </>}
        </article>
        <article className="dashboard-panel dashboard-actividad"><Cabecera titulo="Actividad de evaluación" ayuda="Plantas distintas evaluadas cada día. Una planta puede aparecer en días diferentes. Este gráfico muestra actividad, no evolución de una enfermedad."/><div className="dashboard-chart-total"><strong>{numero(datos.diagnosticosRealizados)}</strong><span>diagnósticos en el período</span></div><Tendencia datos={datos}/></article>
        <article className="dashboard-panel dashboard-monitoreo"><Cabecera titulo="Seguimiento" ayuda="Cobertura: plantas distintas evaluadas en el período / plantas registradas en el ámbito. La revisión de referencia es opcional para la operación y se utiliza en los indicadores de validación."/>
          <div className="dashboard-coverage"><Anillo cantidad={datos.plantasEvaluadas} total={datos.plantasRegistradas}/><span>Cobertura de evaluación</span></div>
          <div className="dashboard-followup"><div><span>Sin evaluar</span><strong>{numero(Math.max(0, datos.plantasRegistradas - datos.plantasEvaluadas))}</strong></div><div><span>Con referencia</span><strong>{numero(datos.plantasRevisadas)}<small> / {numero(datos.plantasEvaluadas)}</small></strong></div></div>
          <Link className="dashboard-jornadas" to="/jornadas"><span><CalendarDays size={17}/>Jornadas</span><strong>{numero(datos.jornadasAbiertas)}<small> abiertas / {numero(datos.jornadasProgramadas)}</small></strong><ChevronRight size={15}/></Link>
        </article>
      </section>
      <section className="dashboard-bottom">
        <article className="dashboard-panel" id="dashboard-sectores"><div className="dashboard-panel-top"><Cabecera titulo="Hallazgos por sector" ayuda="Distribución por rangos de filas y posiciones. La vista 3D representa proporciones con manchas esquemáticas recortadas a cada sector, sin interpolar ni ubicar plantas exactas. El verde representa hoja sana solo donde hay clasificaciones. Sin datos no significa saludable. En Sectores, el porcentaje usa las plantas clasificadas del sector como base. El relieve y los surcos son ilustrativos; no representan dimensiones ni orientación geográfica reales."/>{aplicados.idLote && <label className="dashboard-resaltar"><span className="dashboard-sr-only">Resaltar</span><select aria-label="Resaltar" value={clase} onChange={e => { setClase(e.target.value); setSector(null); }}><option value="">{vistaSectores === '3d' ? 'Todas las categorías' : 'Todos los hallazgos'}</option>{datos.distribucion.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}</select></label>}</div>
          {!aplicados.idLote ? <Vacio texto="Selecciona un lote para ver sus sectores."/> : !datos.sectores.length ? <Vacio texto="Este lote aún no tiene plantas distribuidas."/> : <>
            <div className="dashboard-sector-view-switch" role="group" aria-label="Vista de hallazgos"><button type="button" aria-pressed={vistaSectores === '3d'} onClick={() => setVistaSectores('3d')}>Vista 3D</button><button type="button" aria-pressed={vistaSectores === 'sectores'} onClick={() => setVistaSectores('sectores')}>Sectores</button></div>
            {vistaSectores === '3d' ? <LoteSectores3D sectores={datos.sectores} maxFila={datos.maxFila} maxPosicion={datos.maxPosicion} clase={clase} seleccionado={sector} tema={tema} onSeleccion={setSector}/> : <>
            <div className="dashboard-sector-grid" style={{ '--columnas': Math.max(...datos.sectores.map(s => s.columna)) + 1 } as CSSProperties}>
              {datos.sectores.map(s => { const total = totalSector(s), cantidad = cantidadSector(s, clase), valor = total ? cantidad / total : 0, id = `${s.fila}:${s.columna}`;
                return <button key={id} aria-pressed={sector === id} className={'dashboard-sector' + (!total ? ' sin-datos' : '') + (sector === id ? ' seleccionado' : '')} style={total ? { background: clase === 'HEALTHY' ? `rgba(55,189,139,${0.10 + valor * 0.50})` : `rgba(143,102,227,${0.10 + valor * 0.60})` } : undefined} onClick={() => setSector(id)} title={`Filas ${s.filaDesde}–${s.filaHasta}, posiciones ${s.posicionDesde}–${s.posicionHasta}. ${s.evaluadas} evaluadas de ${s.registradas} registradas.`}>
                  <span>F{s.filaDesde}–{s.filaHasta}</span><small>P{s.posicionDesde}–{s.posicionHasta}</small><strong>{total ? porcentaje(cantidad, total) : 'Sin datos'}</strong><small>{total ? `${cantidad} de ${total}` : '—'}</small></button>; })}
            </div>
            <div className="dashboard-sector-legend"><span>{nombreSeleccion} / clasificadas</span><span>Menor <i style={clase === 'HEALTHY' ? { background: 'linear-gradient(90deg,#283048,#37bd8b)' } : undefined}/> Mayor</span></div></>}
            {elegido && <aside className="dashboard-sector-info"><h3>Filas {elegido.filaDesde}–{elegido.filaHasta}</h3><p>Posiciones {elegido.posicionDesde}–{elegido.posicionHasta} · {numero(elegido.evaluadas)} evaluadas / {numero(elegido.registradas)} registradas</p><div className="dashboard-sector-categories">{elegido.clases.map(c => <span className="dashboard-sector-class" key={c.codigo}><i style={{ background: color(c.codigo) }}/>{c.nombre}<strong>{numero(c.plantas)}</strong></span>)}</div>{!elegido.clases.length && <p>Sin clasificaciones en esta base.</p>}</aside>}
            <Link className="dashboard-map-link" to={'/mapa/' + aplicados.idLote}>Abrir mapa del lote <ArrowRight size={14}/></Link>
          </>}
        </article>
        <article className="dashboard-panel dashboard-lotes"><Cabecera titulo="Lotes con más hallazgos" ayuda="Hasta ocho lotes ordenados por cantidad de plantas con hallazgos en su último diagnóstico del período. La barra compara cantidades, no riesgo ni incidencia del lote."/>
          {!datos.comparacionLotes.length ? <Vacio texto="No hay lotes en el ámbito seleccionado."/> : <div className="dashboard-lot-bars">{datos.comparacionLotes.map(l => { const max = Math.max(1, ...datos.comparacionLotes.map(x => x.conHallazgo)); return <div className="dashboard-lot-row" key={l.idLote}>
            <div className="dashboard-lot-heading"><strong>{l.nombre}</strong><span>{numero(l.conHallazgo)}<small> con hallazgo</small></span></div>
            <div className="dashboard-lot-track"><span style={{ width: `${100 * l.conHallazgo / max}%`, background: color(l.codigoPredominante ?? '') }}/></div>
            <div className="dashboard-lot-meta"><span>{l.predominante ?? (l.enBase ? 'Sin hallazgos' : 'Sin datos')}</span><button className="dashboard-text-button" onClick={() => verLote(l.idLote)}>Ver sectores <ChevronRight size={13}/></button></div>
            <small className="dashboard-lot-coverage">{numero(l.evaluadas)} / {numero(l.registradas)} evaluadas · {porcentaje(l.evaluadas, l.registradas)}</small>
          </div>; })}</div>}
        </article>
      </section>
      <section className="dashboard-senasa"><div className="dashboard-senasa-title"><span className="dashboard-senasa-icon"><Sprout size={21}/></span><div><span>CONSULTA OFICIAL</span><h2>Productos registrados · SENASA</h2></div></div><a href="https://servicios.senasa.gob.pe/SIGIAWeb/sigia_consulta_cultivo.html" target="_blank" rel="noopener noreferrer">Consultar registro <ExternalLink size={14}/><span className="dashboard-sr-only"> (abre en una nueva pestaña)</span></a>
        <details><summary>¿Para qué sirve?</summary><div><p>Abre SIGIA, el registro oficial de plaguicidas. Permite buscar productos por cultivo y plaga y consultar su registro.</p><p>Busca maíz y comprueba que el producto corresponda a la plaga y al uso indicado en su etiqueta. MaizeVision no envía tus diagnósticos ni selecciona productos o dosis automáticamente.</p>{dominante && <p>Hallazgo más frecuente en este resumen: <strong>{dominante.nombre}</strong>. Confirma la condición y el daño en campo para definir el manejo con el responsable agronómico.</p>}</div></details>
      </section>
      <footer className="dashboard-footer"><details><summary>Cómo leer este resumen</summary><p>Una clasificación por planta: el último diagnóstico del período. Los porcentajes describen plantas observadas, no todo el fundo. El inventario no cambia con las fechas. En la base combinada se usa la referencia cuando existe y, si no, la predicción. La exactitud, el tiempo y los errores están en <Link to="/indicadores">Indicadores</Link>.</p></details><Link to="/indicadores">Ver indicadores <ArrowRight size={13}/></Link></footer>
    </>}
  </div>;
}

function Metrica({ tono, icono, titulo, valor, detalle }: { tono: string; icono: ReactNode; titulo: string; valor: number; detalle: string }) {
  return <article className={`dashboard-metric ${tono}`}><div><span>{titulo}</span><span className="dashboard-metric-icon">{icono}</span></div><strong>{numero(valor)}</strong><small>{detalle}</small></article>;
}
function Cabecera({ titulo, ayuda }: { titulo: string; ayuda: string }) {
  return <header className="dashboard-panel-heading"><h2>{titulo}</h2><details className="dashboard-help"><summary aria-label={`Información: ${titulo}`}><Info size={15}/></summary><p>{ayuda}</p></details></header>;
}
function Vacio({ texto }: { texto: string }) { return <div className="dashboard-empty"><MapPinned size={24}/><p>{texto}</p></div>; }
function Distribucion({ datos, clase }: { datos: DashboardPanel; clase: string }) {
  const categorias = datos.distribucion.filter(c => c.plantas > 0);
  return <div className="dashboard-donut"><svg viewBox="0 0 200 200" role="img" aria-label={`Distribución de ${numero(datos.plantasEnBase)} plantas clasificadas. Detalle en la leyenda.`}><circle cx="100" cy="100" r="76" fill="none" stroke="#29334d" strokeWidth="19"/>{categorias.map((c, i) => {
    const cantidad = c.plantas / datos.plantasEnBase * 100;
    const offset = categorias.slice(0, i).reduce((n, anterior) => n + anterior.plantas, 0) / datos.plantasEnBase * 100;
    return <circle key={c.codigo} cx="100" cy="100" r="76" pathLength="100" fill="none" stroke={color(c.codigo)} strokeWidth={clase === c.codigo ? 24 : 19} strokeDasharray={`${cantidad} ${100 - cantidad}`} strokeDashoffset={-offset} transform="rotate(-90 100 100)" opacity={clase && clase !== c.codigo ? 0.35 : 1}><title>{c.nombre}: {numero(c.plantas)} · {porcentaje(c.plantas, datos.plantasEnBase)}</title></circle>;
  })}<text x="100" y="100" className="dashboard-ring-number" textAnchor="middle">{numero(datos.plantasEnBase)}</text><text x="100" y="122" textAnchor="middle" className="dashboard-ring-label">clasificadas</text></svg></div>;
}
function Anillo({ cantidad, total }: { cantidad: number; total: number }) {
  const valor = total ? Math.min(100, cantidad / total * 100) : 0;
  return <svg viewBox="0 0 160 160" role="img" aria-label={`Cobertura de plantas evaluadas: ${porcentaje(cantidad, total)}`}><circle cx="80" cy="80" r="62" fill="none" stroke="#29334d" strokeWidth="9"/><circle cx="80" cy="80" r="62" pathLength="100" fill="none" stroke="#45cddd" strokeWidth="9" strokeDasharray={`${valor} ${100 - valor}`} transform="rotate(-90 80 80)"/><text x="80" y="86" textAnchor="middle" className="dashboard-ring-number">{total ? `${valor.toFixed(1)} %` : '—'}</text></svg>;
}
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
    <defs><linearGradient id="dashboard-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#45cddd" stopOpacity=".30"/><stop offset="100%" stopColor="#45cddd" stopOpacity="0"/></linearGradient></defs>
    {[...new Set([0, Math.ceil(max / 2), max])].map(n => <g key={n}><line x1="40" x2="480" y1={y(n)} y2={y(n)} stroke="#303b54" strokeDasharray="3 5"/><text x="30" y={y(n) + 4} textAnchor="end">{n}</text></g>)}
    <polygon points={`${x(0)},180 ${puntos} ${x(serie.length - 1)},180`} fill="url(#dashboard-area)"/><polyline points={puntos} fill="none" stroke="#45cddd" strokeWidth="2.5" strokeLinejoin="round"/>
    {serie.map((d, i) => <circle key={d.fecha} cx={x(i)} cy={y(d.plantas)} r={serie.length > 90 ? 2 : 3.5} fill="#45cddd"><title>{d.fecha}: {d.plantas} plantas evaluadas</title></circle>)}
    {[0, Math.floor((serie.length - 1) / 2), serie.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => <text key={i} x={x(i)} y="210" textAnchor="middle">{serie[i].fecha.slice(8)}/{serie[i].fecha.slice(5, 7)}</text>)}
  </svg><span><i/>Plantas evaluadas por día</span></div>;
}
