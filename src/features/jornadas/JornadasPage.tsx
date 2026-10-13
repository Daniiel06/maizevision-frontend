import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { CalendarDays, CheckCircle2, ArrowLeft, Plus, Camera, RefreshCw } from "lucide-react";
import { useAuth } from "../auth/context/AuthContext";
import { iniciarInspeccion, obtenerClasesDiagnostico } from "../inspecciones/api/inspeccionesApi";
import type { ClaseDiagnosticoResponse } from "../inspecciones/api/inspeccionesApi";
import { iniciarAtencion } from "../inspecciones/utils/tiempoAtencion";
import type { InicioAtencion } from "../inspecciones/utils/tiempoAtencion";
import { jornadasApi } from "./jornadasApi";
import type { ContextoJornada, DetalleJornada, ResumenJornada, CandidatasJornada, PlantaJornada } from "./jornadasApi";
import DescargarReporte from "../reportes/DescargarReporte";
import RevisionJornadaModal from "./RevisionJornadaModal";
import "./JornadasPage.css";
const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const tiempo = (ms: number | null) => ms == null ? "Pendiente" : (ms / 1000).toFixed(1) + " s";
const mensaje = (e: unknown): string => {
    if (!axios.isAxiosError(e)) return "No se pudo completar la operación.";
    if (typeof e.response?.data?.mensaje === "string") return e.response.data.mensaje;
    if (!e.response) return "No se pudo conectar con la API. Comprueba que el backend esté iniciado.";
    if (e.response.status === 401) return "Tu sesión venció. Vuelve a iniciar sesión.";
    if (e.response.status === 403) return "Tu usuario no tiene permiso para esta operación.";
    if (e.response.status === 404) return "La API no encontró esta ruta o registro. Reinicia el backend actualizado para cargar las jornadas.";
    if (e.response.status >= 500) return "La API encontró un error al cargar las jornadas. Revisa el error de la terminal del backend; puede faltar la migración 007 de Supabase.";
    return "No se pudo completar la operación (HTTP " + e.response.status + ").";
};
function Progreso({ resumen: r }: {
    resumen: ResumenJornada;
}) {
    return <div className="jornada-progreso">
    <div>
    <strong>{r.evaluadas} de {r.metaPlantas} plantas evaluadas</strong>
    <span>{Math.round(100 * r.evaluadas / r.metaPlantas)}%</span>
    </div>
    <progress value={r.evaluadas} max={r.metaPlantas}/>
    <small>{r.asignadas} asignadas · {r.revisadas} revisadas · {r.conTiempo} con tiempo</small>
    </div>;
}
export default function JornadasPage() {
    const { idLote, idJornada } = useParams();
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const gestionar = usuario?.rol === "ADMINISTRADOR" || usuario?.rol === "SUPERVISOR";
    const [contexto, setContexto] = useState<ContextoJornada | null>(null);
    const [lista, setLista] = useState<ResumenJornada[]>([]);
    const [detalle, setDetalle] = useState<DetalleJornada | null>(null);
    const [pagina, setPagina] = useState(1);
    const [fecha, setFecha] = useState(hoy);
    const [meta, setMeta] = useState(20);
    const [error, setError] = useState("");
    const [ocupado, setOcupado] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [seleccionar, setSeleccionar] = useState(false);
    const [candidatas, setCandidatas] = useState<CandidatasJornada | null>(null);
    const [paginaC, setPaginaC] = useState(1);
    const [fila, setFila] = useState("");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [seleccion, setSeleccion] = useState<string[]>([]);
    const [clases, setClases] = useState<ClaseDiagnosticoResponse[]>([]);
    const [plantaRevision, setPlantaRevision] = useState<PlantaJornada | null>(null);
    const [cerrar, setCerrar] = useState(false);
    const [confirmar, setConfirmar] = useState(false);
    const [motivo, setMotivo] = useState("");
    const [plantaActiva, setPlantaActiva] = useState<PlantaJornada | null>(null);
    const inicio = useRef<InicioAtencion | null>(null);
    const cargar = useCallback(async (vigente: () => boolean = () => true) => { if (idJornada) {
        const d = await jornadasApi.detalle(idJornada, pagina);
        if (vigente())
            setDetalle(d);
    }
    else if (idLote) {
        const [c, l] = await Promise.all([jornadasApi.contexto(idLote), jornadasApi.listar(idLote, pagina)]);
        if (vigente()) {
            setContexto(c);
            setMeta(c.metaSugerida);
            setLista(l);
        }
    } }, [idJornada, idLote, pagina]);
    useEffect(() => {
        let vigente = true;
        const request = idJornada ? jornadasApi.detalle(idJornada, pagina) : idLote ? Promise.all([jornadasApi.contexto(idLote), jornadasApi.listar(idLote, pagina)]) : Promise.resolve(null);
        request.then(data => { if (!vigente || !data)
            return; if (Array.isArray(data)) {
            setContexto(data[0]);
            setMeta(data[0].metaSugerida);
            setLista(data[1]);
        }
        else
            setDetalle(data); }).catch(e => { if (vigente)
            setError(mensaje(e)); }).finally(() => { if (vigente)
            setCargando(false); });
        return () => { vigente = false; };
    }, [idJornada, idLote, pagina]);
    useEffect(() => { if (idJornada && gestionar)
        obtenerClasesDiagnostico().then(setClases).catch(() => setError("No se pudieron cargar las clases para la revisión.")); }, [idJornada, gestionar]);
    useEffect(() => { if (!seleccionar || !idJornada)
        return; let vigente = true; jornadasApi.candidatas(idJornada, { fila: fila ? Number(fila) : undefined, desde: desde ? Number(desde) : undefined, hasta: hasta ? Number(hasta) : undefined, pagina: paginaC }).then(c => { if (vigente)
        setCandidatas(c); }).catch(e => { if (vigente)
        setError(mensaje(e)); }); return () => { vigente = false; }; }, [seleccionar, idJornada, fila, desde, hasta, paginaC]);
    async function actuar(action: () => Promise<void>) { setOcupado(true); setError(""); try {
        await action();
    }
    catch (e) {
        setError(mensaje(e));
    }
    finally {
        setOcupado(false);
    } }
    const abierta = detalle?.resumen.estado === "ABIERTA" && detalle.estadoCampania === "ACTIVA";
    const hoyDisponible = abierta && detalle?.resumen.fecha === hoy();
    const restante = detalle ? detalle.resumen.metaPlantas - detalle.resumen.asignadas : 0;
    function elegir(p: PlantaJornada) { inicio.current = iniciarAtencion(); setPlantaActiva(p); }
    return <main className="jornadas-page">
 <Link className="jornada-volver" to="/campanias">
    <ArrowLeft size={17}/> Campañas</Link>
 <header className="jornadas-heading">
    <div>
    <span className="jornada-eyebrow">CONTROL DIARIO</span>
    <h1>
    <CalendarDays /> {idJornada ? "Jornada de evaluación" : "Jornadas del lote"}</h1>
    <p>{detalle ? detalle.lote + " · " + detalle.resumen.fecha : contexto?.nombre ?? "Organiza las evaluaciones de cada día"}</p>
    </div>
    {idJornada && detalle && <DescargarReporte tipo="jornada" id={idJornada}/>}<button disabled={ocupado || cargando} onClick={() => void actuar(cargar)}>
    <RefreshCw size={16}/> Actualizar</button>
    </header>
 {error && <p role="alert" className="jornada-error">{error}</p>}
 {cargando && <p role="status">Cargando jornadas…</p>}
 {!idJornada && contexto && <>
 {gestionar && contexto.estadoCampania === "ACTIVA" && <form className="jornada-panel jornada-crear" onSubmit={e => { e.preventDefault(); void actuar(async () => { const j = await jornadasApi.crear(contexto.idLote, fecha, meta); navigate("/jornadas/" + j.idJornada); }); }}>
            <div>
            <h2>Planifica el día</h2>
            <p>La cantidad se adapta a tu trabajo. Cada planta cuenta una vez por jornada.</p>
            </div>
            <label>Fecha<input type="date" required min={hoy()} value={fecha} onChange={e => setFecha(e.target.value)}/>
            </label>
            <label>Meta de plantas<input type="number" required min={1} max={contexto.totalPlantas} value={meta} onChange={e => setMeta(Number(e.target.value))}/>
            </label>
            <button className="jornada-primary" disabled={ocupado || contexto.totalPlantas === 0}>
            <Plus size={17}/> Crear jornada</button>
            <small>Se sugiere la meta de la última jornada del lote. Puedes cambiarla antes de crear la siguiente.</small>
            </form>}
 {contexto.estadoCampania !== "ACTIVA" && <p className="jornada-nota">Campaña finalizada: puedes consultar las jornadas y completar la revisión del especialista.</p>}
 <section className="jornada-lista">{lista.map(r => <Link key={r.idJornada} className="jornada-panel jornada-card" to={"/jornadas/" + r.idJornada}>
            <div className="jornada-card-title">
            <h2>{r.fecha}</h2>
            <span className="jornada-badge">{r.estado === "ABIERTA" ? "Abierta" : "Cerrada"}</span>
            </div>
            <Progreso resumen={r}/>
            <span className="jornada-link">Abrir jornada →</span>
            </Link>)}</section>{lista.length === 0 && <p>Aún no hay jornadas en esta página.</p>}
 <div className="jornada-paginacion">
        <button disabled={pagina === 1 || ocupado} onClick={() => setPagina(p => p - 1)}>Anterior</button>
        <span>Página {pagina}</span>
        <button disabled={lista.length < 20 || ocupado} onClick={() => setPagina(p => p + 1)}>Siguiente</button>
        </div>
 </>}
 {idJornada && detalle && <>
 <section className="jornada-panel">
        <div className="jornada-card-title">
        <h2>Avance del día</h2>
        <span className="jornada-badge">{detalle.resumen.estado === "ABIERTA" ? "Abierta" : "Cerrada"}</span>
        </div>
        <Progreso resumen={detalle.resumen}/>
        <p className="jornada-nota">Se conserva el primer diagnóstico de cada planta para esta jornada. Las repeticiones siguen en el historial.</p>
        </section>
 <section className="jornada-metricas" aria-label="Indicadores de la jornada">
        <article>
        <span>Exactitud del diagnóstico</span>
        <strong>{detalle.resumen.exactitud == null ? "Sin revisiones" : detalle.resumen.exactitud.toFixed(1) + "%"}</strong>
        <small>{detalle.resumen.correctas} correctos de {detalle.resumen.revisadas} revisados</small>
        </article>
        <article>
        <span>Tiempo promedio de diagnóstico</span>
        <strong>{tiempo(detalle.resumen.tiempoPromedioMs)}</strong>
        <small>{detalle.resumen.conTiempo} mediciones · {detalle.resumen.evaluadas - detalle.resumen.conTiempo} pendientes</small>
        </article>
        <article>
        <span>Número de errores</span>
        <strong>{detalle.resumen.revisadas === 0 ? "Sin revisiones" : detalle.resumen.errores}</strong>
        <small>{detalle.resumen.evaluadas - detalle.resumen.revisadas} diagnósticos pendientes de revisión</small>
        </article>
        </section>
 <section className="jornada-panel">
        <div className="jornada-card-title">
        <div>
        <h2>Plantas de la jornada</h2>
        <p>Ubica la planta por fila y posición para empezar su evaluación.</p>
        </div>{gestionar && abierta && restante > 0 && <button onClick={() => { setSeleccion([]); setCandidatas(null); setSeleccionar(true); }}>
            <Plus size={17}/> Asignar plantas ({restante} disponibles)</button>}</div>
 {detalle.plantas.length === 0 && <p>Asigna las plantas que se revisarán en esta jornada.</p>}
 <div className="jornada-table-scroll">
        <table>
        <thead>
        <tr>
        <th>Planta</th>
        <th>Ubicación</th>
        <th>Diagnóstico</th>
        <th>Tiempo real</th>
        <th>Revisión</th>
        <th>Acción</th>
        </tr>
        </thead>
        <tbody>{detalle.plantas.map(p => <tr key={p.idPlanta}>
            <td>
            <strong>{p.codigo}</strong>
            </td>
            <td>Fila {p.fila} · posición {p.posicion}</td>
            <td>{p.diagnostico ?? "Por evaluar"}</td>
            <td>{p.idDiagnostico ? tiempo(p.tiempoMs) : "—"}</td>
            <td>{p.referencia ?? (p.idDiagnostico ? "Pendiente" : "—")}{gestionar && p.idDiagnostico && <div className="jornada-revision"><button disabled={ocupado} onClick={() => setPlantaRevision(p)}>{p.referencia ? "Ver / editar revisión" : "Revisar hoja"}</button></div>}</td>
            <td>{!p.idDiagnostico && hoyDisponible ? <button className="jornada-primary" disabled={ocupado} onClick={() => elegir(p)}>
                <Camera size={15}/> Evaluar</button> : p.idDiagnostico ? <span className="jornada-completa">
                <CheckCircle2 size={17}/> Evaluada</span> : <span>Fuera de fecha o cerrada</span>}{gestionar && abierta && !p.idDiagnostico && <button className="jornada-quitar" disabled={ocupado} onClick={() => void actuar(async () => { await jornadasApi.quitar(idJornada, p.idPlanta); await cargar(); })}>Retirar</button>}</td>
            </tr>)}</tbody>
        </table>
        </div>
 <div className="jornada-paginacion">
        <button disabled={detalle.pagina <= 1 || ocupado} onClick={() => setPagina(p => Math.max(1, p - 1))}>Anterior</button>
        <span>{detalle.totalPlantas} plantas · página {detalle.pagina}</span>
        <button disabled={detalle.pagina * 20 >= detalle.totalPlantas || ocupado} onClick={() => setPagina(p => p + 1)}>Siguiente</button>
        </div>
        </section>
 {gestionar && detalle.resumen.estado === "ABIERTA" && <section className="jornada-panel">
            <h2>Cierre de la jornada</h2>
            <p>El cierre termina la captura. El especialista puede seguir revisando los resultados.</p>{!cerrar ? <button onClick={() => setCerrar(true)}>Preparar cierre</button> : <form onSubmit={e => { e.preventDefault(); void actuar(async () => { await jornadasApi.cerrar(idJornada, confirmar, motivo); setCerrar(false); await cargar(); }); }}>{detalle.resumen.evaluadas < detalle.resumen.metaPlantas && <>
                    <p>Faltan {detalle.resumen.metaPlantas - detalle.resumen.evaluadas} plantas para cumplir la meta.</p>
                    <label className="jornada-check">
                    <input type="checkbox" required checked={confirmar} onChange={e => setConfirmar(e.target.checked)}/> Confirmo el cierre incompleto</label>
                    <label>Motivo<textarea required maxLength={1000} value={motivo} onChange={e => setMotivo(e.target.value)}/>
                    </label>
                    </>}<div className="jornada-actions">
                <button type="button" onClick={() => setCerrar(false)}>Cancelar</button>
                <button className="jornada-primary" disabled={ocupado}>Cerrar jornada</button>
                </div>
                </form>}</section>}
 {detalle.motivoCierre && <p className="jornada-nota">Motivo del cierre: {detalle.motivoCierre}</p>}
 </>}
 {seleccionar && detalle && <div className="jornada-overlay">
        <section className="jornada-modal" role="dialog" aria-modal="true" aria-label="Seleccionar plantas">
        <div className="jornada-card-title">
        <h2>Selecciona plantas</h2>
        <button disabled={ocupado} onClick={() => setSeleccionar(false)}>Cerrar</button>
        </div>
        <p>{seleccion.length} seleccionadas · puedes asignar {restante} más</p>
        <div className="jornada-filtros">
        <label>Fila<input type="number" min={1} value={fila} onChange={e => { setCandidatas(null); setFila(e.target.value); setPaginaC(1); setSeleccion([]); }}/>
        </label>
        <label>Desde posición<input type="number" min={1} value={desde} onChange={e => { setCandidatas(null); setDesde(e.target.value); setPaginaC(1); setSeleccion([]); }}/>
        </label>
        <label>Hasta posición<input type="number" min={1} value={hasta} onChange={e => { setCandidatas(null); setHasta(e.target.value); setPaginaC(1); setSeleccion([]); }}/>
        </label>
        </div>
        <button disabled={!candidatas || ocupado} onClick={() => setSeleccion(candidatas!.plantas.slice(0, Math.min(restante, 200)).map(p => p.idPlanta))}>Seleccionar hasta la meta en esta página</button>
        <div className="jornada-candidatas">{candidatas ? candidatas.plantas.map(p => <label key={p.idPlanta} className="jornada-candidata">
            <input type="checkbox" checked={seleccion.includes(p.idPlanta)} disabled={ocupado || (!seleccion.includes(p.idPlanta) && seleccion.length >= Math.min(restante, 200))} onChange={e => setSeleccion(s => e.target.checked ? [...s, p.idPlanta] : s.filter(id => id !== p.idPlanta))}/>
            <span>
            <strong>{p.codigo}</strong>
            <small>Fila {p.fila} · posición {p.posicion}</small>
            </span>
            </label>) : <p>Cargando plantas…</p>}</div>
        <div className="jornada-paginacion">
        <button disabled={paginaC === 1 || ocupado} onClick={() => { setCandidatas(null); setPaginaC(p => p - 1); setSeleccion([]); }}>Anterior</button>
        <span>{candidatas?.total ?? 0} disponibles · página {paginaC}</span>
        <button disabled={!candidatas || paginaC * 50 >= candidatas.total || ocupado} onClick={() => { setCandidatas(null); setPaginaC(p => p + 1); setSeleccion([]); }}>Siguiente</button>
        </div>
        <button className="jornada-primary" disabled={ocupado || seleccion.length === 0} onClick={() => void actuar(async () => { await jornadasApi.asignar(idJornada!, seleccion); setSeleccionar(false); await cargar(); })}>Asignar {seleccion.length} plantas</button>{error && <p role="alert" className="jornada-error">{error}</p>}</section>
        </div>}
 {plantaActiva && <div className="jornada-overlay">
        <section className="jornada-modal jornada-modal-small" role="dialog" aria-modal="true" aria-label="Evaluar planta">
        <h2>{plantaActiva.codigo}</h2>
        <p>Fila {plantaActiva.fila} · posición {plantaActiva.posicion}</p>
        <p>El tiempo real empezó al abrir esta planta y termina cuando se muestra el resultado.</p>
        <div className="jornada-actions">
        <button disabled={ocupado} onClick={() => setPlantaActiva(null)}>Cancelar</button>
        <button className="jornada-primary" disabled={ocupado} onClick={() => void actuar(async () => { const i = await iniciarInspeccion({ idPlanta: plantaActiva.idPlanta, idJornada }); navigate("/inspecciones/" + i.idInspeccion + "?jornada=" + idJornada, { state: { inicioAtencion: inicio.current } }); })}>Tomar foto y diagnosticar</button>
        </div>{error && <p role="alert" className="jornada-error">{error}</p>}</section>
        </div>}
 {plantaRevision && <RevisionJornadaModal key={plantaRevision.idDiagnostico!} planta={plantaRevision} clases={clases} cerrar={() => setPlantaRevision(null)} guardada={() => actuar(cargar)} />}
 </main>;
}
