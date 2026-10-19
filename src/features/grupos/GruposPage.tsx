import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/context/AuthContext';
import { gruposApi } from './gruposApi';
import type { GrupoResumen, GrupoDetalle, GrupoPlanta, GrupoLote, GrupoUsuario, AsociarGrupo } from './gruposApi';
import { iniciarInspeccion, obtenerClasesDiagnostico } from '../inspecciones/api/inspeccionesApi';
import type { ClaseDiagnosticoResponse } from '../inspecciones/api/inspeccionesApi';
import { iniciarAtencion } from '../inspecciones/utils/tiempoAtencion';
import type { InicioAtencion } from '../inspecciones/utils/tiempoAtencion';
import RevisionJornadaModal from '../jornadas/RevisionJornadaModal';
import '../jornadas/JornadasPage.css';
import './GruposPage.css';
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const tiempo = (ms: number | null) => ms == null ? 'Sin tiempo' : (ms / 1000).toFixed(2) + ' s';
const fecha = (d: string | null) => d ? new Date(d).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : 'Sin diagnóstico';
const errorTexto = (e: unknown) => axios.isAxiosError(e) ? e.response?.data?.mensaje ?? 'No se pudo cargar. Comprueba la API y la migración 008.' : e instanceof Error ? e.message : 'No se pudo completar la operación.';
export default function GruposPage() {
    const { idLote, idGrupo } = useParams();
    const { usuario } = useAuth();
    const navegar = useNavigate();
    const gestionar = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'SUPERVISOR';
    const [lote, setLote] = useState(idLote ?? '');
    const [lotes, setLotes] = useState<GrupoLote[]>([]);
    const [responsables, setResponsables] = useState<GrupoUsuario[]>([]);
    const [lista, setLista] = useState<GrupoResumen[]>([]);
    const [detalle, setDetalle] = useState<GrupoDetalle | null>(null);
    const [pagina, setPagina] = useState(1);
    const [error, setError] = useState('');
    const [ocupado, setOcupado] = useState(false);
    const requestKey = (idGrupo ?? lote) + ":" + pagina;
    const [loadedKey, setLoadedKey] = useState("");
    const cargando = loadedKey !== requestKey;
    const [nombre, setNombre] = useState('');
    const [dia, setDia] = useState(hoy);
    const [meta, setMeta] = useState(15);
    const [responsable, setResponsable] = useState('');
    const [panel, setPanel] = useState<'crear' | 'asociar' | null>(null);
    const [manifiesto, setManifiesto] = useState<AsociarGrupo[]>([]);
    const [notasImportacion, setNotasImportacion] = useState('');
    const [fila, setFila] = useState(1);
    const [desde, setDesde] = useState(1);
    const [hasta, setHasta] = useState(15);
    const [paginaC, setPaginaC] = useState(1);
    const [selector, setSelector] = useState(false);
    const [candidatas, setCandidatas] = useState<GrupoPlanta[]>([]);
    const [seleccion, setSeleccion] = useState<string[]>([]);
    const [clases, setClases] = useState<ClaseDiagnosticoResponse[]>([]);
    const [revision, setRevision] = useState<GrupoPlanta | null>(null);
    const [plantaActiva, setPlantaActiva] = useState<GrupoPlanta | null>(null);
    const inicio = useRef<InicioAtencion | null>(null);
    const [confirmar, setConfirmar] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [soloMios, setSoloMios] = useState(usuario?.rol === 'EVALUADOR');
    const cargar = useCallback(async () => { if (idGrupo)
        setDetalle(await gruposApi.detalle(idGrupo, pagina));
    else if (lote)
        setLista(await gruposApi.listar(lote, pagina)); if (!idGrupo && gestionar) setResponsables(await gruposApi.responsables()); }, [idGrupo, lote, pagina, gestionar]);
    useEffect(() => { let vigente = true; Promise.all([gruposApi.lotes(), gestionar ? gruposApi.responsables() : Promise.resolve([])]).then(([l, u]) => { if (vigente) {
        setLotes(l);
        setResponsables(u);
        if (!idGrupo && l.length === 1) setLote(actual => actual || l[0].idLote);
    } }).catch(e => { if (vigente)
        setError(errorTexto(e)); }); return () => { vigente = false; }; }, [gestionar, idGrupo]);
    useEffect(() => { let vigente = true; const req = idGrupo ? gruposApi.detalle(idGrupo, pagina) : lote ? gruposApi.listar(lote, pagina) : Promise.resolve(null); req.then(r => { if (!vigente)
        return; if (Array.isArray(r))
        setLista(r);
    else
        setDetalle(r); }).catch(e => { if (vigente)
        setError(errorTexto(e)); }).finally(() => { if (vigente)
        setLoadedKey((idGrupo ?? lote) + ":" + pagina); }); return () => { vigente = false; }; }, [idGrupo, lote, pagina]);
    useEffect(() => { if (idGrupo && gestionar)
        obtenerClasesDiagnostico().then(setClases).catch(e => setError(errorTexto(e))); }, [idGrupo, gestionar]);
    useEffect(() => { if (!selector || !idGrupo)
        return; let vigente = true; gruposApi.candidatas(idGrupo, { fila, desde, hasta, pagina: paginaC }).then(r => { if (vigente)
        setCandidatas(r); }).catch(e => { if (vigente)
        setError(errorTexto(e)); }); return () => { vigente = false; }; }, [selector, idGrupo, fila, desde, hasta, paginaC]);
    async function actuar(f: () => Promise<void>) { setOcupado(true); setError(''); try {
        await f();
    }
    catch (e) {
        setError(errorTexto(e));
    }
    finally {
        setOcupado(false);
    } }
    async function leerManifiesto(file: File) { setError(''); setManifiesto([]); try {
        if (file.size > 2000000)
            throw Error('El archivo supera 2 MB.');
        const data = JSON.parse(await file.text());
        const arr = Array.isArray(data) ? data : data.grupos;
        if (!Array.isArray(arr) || arr.length < 1 || arr.length > 50)
            throw Error('El archivo debe contener entre 1 y 50 jornadas.');
        const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (const g of arr) {
            if (!g || !uuid.test(g.idLote) || typeof g.nombre !== 'string' || !g.nombre.trim() || g.nombre.length > 100 || !Array.isArray(g.idsDiagnosticos) || g.idsDiagnosticos.length < 1 || g.idsDiagnosticos.length > 200 || !g.idsDiagnosticos.every((x: unknown) => typeof x === 'string' && uuid.test(x)))
                throw Error('El archivo contiene una jornada inválida.');
        }
        if (new Set(arr.map(g => g.idLote)).size !== 1 || arr[0].idLote !== lote)
            throw Error('Selecciona el lote al que pertenece este archivo.');
        setManifiesto(arr);
        setNotasImportacion(typeof data.advertencia === 'string' ? data.advertencia : 'Se conservan fechas, usuarios, revisiones y tiempos originales.');
    }
    catch (e) {
        setError(errorTexto(e));
    } }
    function descargar() { const rows = [['Jornada', 'Origen', 'Fecha planificada', 'Responsable', 'Asignadas', 'Evaluadas', 'Revisadas', 'Correctas', 'Errores revisados', 'Exactitud (%)', 'Con tiempo', 'Tiempo promedio (s)', 'Estado revisión'], ...lista.map(g => [g.nombre, g.origen, g.fechaPlanificada ?? '', g.responsable ?? 'Evaluadores originales', g.asignadas, g.evaluadas, g.revisadas, g.correctas, g.errores ?? '', g.exactitud ?? '', g.conTiempo, g.tiempoPromedioMs == null ? '' : g.tiempoPromedioMs / 1000, g.revisadas === g.evaluadas && g.evaluadas > 0 ? 'Completa' : 'Pendiente'])]; const csv = '\uFEFF' + rows.map(r => r.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'indicadores-jornadas-pagina-' + pagina + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    const r = cargando ? undefined : detalle?.resumen;
    const planAbierto = r?.origen === 'PLANIFICADO' && r.estado === 'ABIERTA' && detalle?.estadoCampania === 'ACTIVA';
    const puedeEvaluar = planAbierto && r.fechaPlanificada === hoy() && r.idResponsable === usuario?.idUsuario;
    return <main className="jornadas-page grupos-page"><Link className="jornada-volver" to="/campanias">← Campañas</Link><header className="jornadas-heading"><div><span className="jornada-eyebrow">JORNADAS DE EVALUACIÓN</span><h1>{r?.nombre ?? 'Jornadas'}</h1><p>{r ? r.origen === 'PLANIFICADO' ? 'Programada para ' + r.fechaPlanificada + ' · ' + r.responsable : 'Agrupación de registros existentes · fechas originales conservadas' : usuario?.rol === 'EVALUADOR' ? 'Consulta tus jornadas asignadas y evalúa sus plantas en la fecha prevista.' : 'Programa jornadas con fecha, plantas y un trabajador responsable. Puedes programar varias el mismo día.'}</p></div><button disabled={ocupado} onClick={() => void actuar(cargar)}>Actualizar</button></header>
 {error && <p role="alert" className="jornada-error">{error}</p>}{cargando && <p role="status">Cargando jornadas…</p>}
 {!idGrupo && <><section className="jornada-panel grupos-toolbar"><label>Lote<select aria-label="Lote" value={lote} onChange={e => { setLote(e.target.value); setPagina(1); setLista([]); setManifiesto([]); setError(''); }}><option value="">Selecciona un lote</option>{lotes.map(l => <option key={l.idLote} value={l.idLote}>{l.campania + ' · ' + l.nombre}</option>)}</select></label>{lote && gestionar && <><button onClick={() => setPanel(panel === 'crear' ? null : 'crear')}>Crear jornada</button></>}{lista.length > 0 && <button onClick={descargar}>Descargar indicadores de esta página</button>}</section>
 {lote && panel === 'crear' && gestionar && <form className="jornada-panel grupos-form" onSubmit={e => { e.preventDefault(); void actuar(async () => { const g = await gruposApi.crear({ idLote: lote, nombre, fecha: dia, metaPlantas: meta, idResponsable: responsable }); navegar('/jornadas/asignadas/' + g.idGrupo); }); }}><h2>Planifica una jornada</h2><label>Nombre<input required maxLength={100} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Jornada 1 · sector norte"/></label><label>Fecha<input type="date" required min={hoy()} value={dia} onChange={e => setDia(e.target.value)}/></label><label>Meta de plantas<input type="number" required min={1} max={200} value={meta} onChange={e => setMeta(Number(e.target.value))}/></label><label>Responsable<select aria-label="Responsable" required value={responsable} onChange={e => setResponsable(e.target.value)}><option value="">Selecciona una persona</option>{responsables.map(u => <option key={u.idUsuario} value={u.idUsuario}>{u.nombre}</option>)}</select></label><p>El responsable evalúa las plantas asignadas en la fecha prevista. Una persona puede tener varias jornadas.</p><button className="jornada-primary" disabled={ocupado}>Crear y seleccionar plantas</button></form>}
 {lote && panel === 'asociar' && gestionar && <section className="jornada-panel"><h2>Asocia diagnósticos ya registrados</h2><p>Importa el archivo JSON de jornadas. Se crean asociaciones; no se cambian las fechas, evaluadores, diagnósticos ni mediciones.</p><label>Archivo de jornadas<input type="file" accept=".json,application/json" disabled={ocupado} onChange={e => { const file = e.target.files?.[0]; if (file)
            void leerManifiesto(file); }}/></label>{manifiesto.length > 0 && <><p>{notasImportacion}</p><ul>{manifiesto.map((g, i) => <li key={i}>{g.nombre}: {g.idsDiagnosticos.length} plantas</li>)}</ul><button className="jornada-primary" disabled={ocupado} onClick={() => void actuar(async () => { await gruposApi.asociar(manifiesto); setManifiesto([]); setPanel(null); setPagina(1); await cargar(); })}>Asociar {manifiesto.length} jornadas</button></>}</section>}
 {lista.length > 0 && <label className="jornada-check"><input type="checkbox" checked={soloMios} onChange={e => setSoloMios(e.target.checked)}/>Solo mis jornadas</label>}
 <section className="jornada-lista">{lista.filter(g => !soloMios || g.idResponsable === usuario?.idUsuario).map(g => <Link className="jornada-panel jornada-card" key={g.idGrupo} to={'/jornadas/asignadas/' + g.idGrupo}><div className="jornada-card-title"><h2>{g.nombre}</h2><span className="jornada-badge">{g.origen === 'REGISTROS_EXISTENTES' ? 'Registros existentes' : g.estado === 'CERRADA' ? 'Cerrada' : g.fechaPlanificada === hoy() ? 'Hoy' : 'Programada'}</span></div><p>{g.fechaPlanificada ?? 'Fechas originales'} · {g.responsable ?? 'Evaluadores originales'}</p><progress value={g.evaluadas} max={g.metaPlantas}/><p>{g.evaluadas}/{g.metaPlantas} evaluadas · {g.revisadas} revisadas</p><div className="grupos-card-metricas"><span>Exactitud: {g.exactitud == null ? 'Pendiente' : g.exactitud.toFixed(2) + ' %'}</span><span>Tiempo: {tiempo(g.tiempoPromedioMs)}</span><span>Errores: {g.errores ?? 'Pendiente'}</span></div></Link>)}</section>{lote && <div className="jornada-paginacion"><button disabled={pagina === 1 || ocupado} onClick={() => setPagina(p => p - 1)}>Anterior</button><span>Página {pagina}</span><button disabled={lista.length < 20 || ocupado} onClick={() => setPagina(p => p + 1)}>Siguiente</button></div>}</>}
 {r && detalle && idGrupo && <><Link className="jornada-volver" to={'/lotes/' + r.idLote + '/jornadas'}>← Jornadas del lote</Link><section className="jornada-panel"><h2>Avance de la jornada</h2><progress value={r.evaluadas} max={r.metaPlantas}/><p>{r.evaluadas} de {r.metaPlantas} evaluadas · {r.asignadas} asignadas · {r.revisadas} revisadas · {r.conTiempo} con tiempo</p><p className="jornada-nota">Se utiliza un diagnóstico principal por planta. Los adicionales permanecen en su historial.</p>{r.origen === 'REGISTROS_EXISTENTES' && <p className="jornada-nota">Estas asociaciones se crearon después de las evaluaciones; no representan jornadas independientes. Diagnósticos: {fecha(r.desde)} a {fecha(r.hasta)}.</p>}</section><section className="jornada-metricas"><article><span>Exactitud</span><strong>{r.exactitud == null ? 'Pendiente' : r.exactitud.toFixed(2) + ' %'}</strong><small>{r.correctas} correctos de {r.revisadas} revisados</small></article><article><span>Tiempo registrado promedio</span><strong>{tiempo(r.tiempoPromedioMs)}</strong><small>{r.conTiempo} mediciones de {r.evaluadas} evaluaciones</small></article><article><span>Errores revisados</span><strong>{r.errores ?? 'Pendiente'}</strong><small>{r.evaluadas - r.revisadas} pendientes de revisión</small></article></section>
 <section className="jornada-panel"><div className="jornada-card-title"><h2>Plantas asignadas</h2>{gestionar && planAbierto && r.asignadas < r.metaPlantas && <button onClick={() => { setSeleccion([]); setSelector(true); }}>Asignar plantas</button>}</div><div className="jornada-table-scroll"><table><thead><tr><th>Planta</th><th>Diagnóstico principal</th><th>Revisión</th><th>Tiempo</th><th>Acción</th></tr></thead><tbody>{detalle.plantas.map(p => <tr key={p.idPlanta}><td>{p.codigo}<small>Fila {p.fila} · posición {p.posicion}</small></td><td>{p.diagnostico ?? 'Pendiente'}<small>{p.idDiagnostico ? fecha(p.fechaDiagnostico) : ''} {p.evaluador}</small></td><td>{p.referencia ?? 'Pendiente'}{gestionar && p.idDiagnostico && <div><button disabled={ocupado} onClick={() => setRevision(p)}>Revisar hoja</button></div>}</td><td>{tiempo(p.tiempoMs)}</td><td>{!p.idDiagnostico && puedeEvaluar ? <button className="jornada-primary" disabled={ocupado} onClick={() => { inicio.current = iniciarAtencion(); setPlantaActiva(p); }}>Evaluar</button> : p.idDiagnostico ? 'Evaluada' : 'Pendiente del responsable / fecha'}{gestionar && planAbierto && !p.idDiagnostico && <button disabled={ocupado} onClick={() => void actuar(async () => { await gruposApi.quitar(idGrupo, p.idPlanta); await cargar(); })}>Retirar</button>}</td></tr>)}</tbody></table></div><div className="jornada-paginacion"><button disabled={pagina === 1 || ocupado} onClick={() => setPagina(p => p - 1)}>Anterior</button><span>Página {pagina}</span><button disabled={pagina * 20 >= detalle.totalPlantas || ocupado} onClick={() => setPagina(p => p + 1)}>Siguiente</button></div></section>
 {gestionar && r.estado === 'ABIERTA' && <form className="jornada-panel" onSubmit={e => { e.preventDefault(); void actuar(async () => { await gruposApi.cerrar(idGrupo, confirmar, motivo); await cargar(); }); }}><h2>Cerrar jornada</h2><p>Termina la captura; la revisión del especialista continúa disponible.</p>{r.evaluadas < r.metaPlantas && <><label className="jornada-check"><input type="checkbox" required checked={confirmar} onChange={e => setConfirmar(e.target.checked)}/>Cerrar con evaluaciones pendientes</label><label>Motivo<textarea required maxLength={1000} value={motivo} onChange={e => setMotivo(e.target.value)}/></label></>}<button disabled={ocupado}>Cerrar jornada</button></form>}{detalle.motivoCierre && <p className="jornada-nota">{detalle.motivoCierre}</p>}</>}
 {selector && r && idGrupo && <div className="jornada-overlay"><section className="jornada-modal" role="dialog" aria-modal="true" aria-label="Asignar plantas a la jornada"><div className="jornada-card-title"><h2>Selecciona plantas</h2><button onClick={() => setSelector(false)}>Cerrar</button></div><div className="jornada-filtros"><label>Fila<input type="number" min={1} value={fila} onChange={e => { setFila(Number(e.target.value)); setPaginaC(1); setSeleccion([]); }}/></label><label>Desde<input type="number" min={1} value={desde} onChange={e => { setDesde(Number(e.target.value)); setPaginaC(1); setSeleccion([]); }}/></label><label>Hasta<input type="number" min={desde} value={hasta} onChange={e => { setHasta(Number(e.target.value)); setPaginaC(1); setSeleccion([]); }}/></label></div><p>{seleccion.length} seleccionadas · {r.metaPlantas - r.asignadas} disponibles en la meta</p><div className="jornada-candidatas">{candidatas.map(p => <label className="jornada-candidata" key={p.idPlanta}><input type="checkbox" checked={seleccion.includes(p.idPlanta)} disabled={!seleccion.includes(p.idPlanta) && seleccion.length >= r.metaPlantas - r.asignadas} onChange={e => setSeleccion(s => e.target.checked ? [...s, p.idPlanta] : s.filter(id => id !== p.idPlanta))}/>{p.codigo}</label>)}</div><div className="jornada-paginacion"><button disabled={paginaC === 1 || ocupado} onClick={() => setPaginaC(p => p - 1)}>Anterior</button><span>Página {paginaC}</span><button disabled={candidatas.length < 50 || ocupado} onClick={() => setPaginaC(p => p + 1)}>Siguiente</button></div><button className="jornada-primary" disabled={ocupado || seleccion.length === 0} onClick={() => void actuar(async () => { await gruposApi.asignar(idGrupo, seleccion); setSelector(false); await cargar(); })}>Asignar plantas seleccionadas</button>{error && <p role="alert" className="jornada-error">{error}</p>}</section></div>}
 {plantaActiva && idGrupo && <div className="jornada-overlay"><section className="jornada-modal jornada-modal-small" role="dialog" aria-modal="true" aria-label="Evaluar planta de la jornada"><h2>{plantaActiva.codigo}</h2><p>El tiempo comenzó al abrir esta planta. Toma la fotografía y espera el resultado.</p><div className="jornada-actions"><button disabled={ocupado} onClick={() => { inicio.current = null; setPlantaActiva(null); }}>Cancelar</button><button className="jornada-primary" disabled={ocupado} onClick={() => void actuar(async () => { const i = await iniciarInspeccion({ idPlanta: plantaActiva.idPlanta, idGrupo }); navegar('/inspecciones/' + i.idInspeccion + '?grupo=' + idGrupo, { state: { inicioAtencion: inicio.current } }); })}>Tomar foto y diagnosticar</button></div>{error && <p role="alert" className="jornada-error">{error}</p>}</section></div>}
 {revision && <RevisionJornadaModal planta={revision} clases={clases} cerrar={() => setRevision(null)} guardada={async () => { await cargar(); }}/>}</main>;
}
