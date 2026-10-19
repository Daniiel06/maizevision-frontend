import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, RefreshCw, Eye, EyeOff, X, UserCheck, UserX } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../auth/context/AuthContext';
import { usuariosApi } from '../api/usuariosApi';
import type { Usuario, RolUsuario } from '../api/usuariosApi';
import './UsuariosPage.css';
const roles = [{ valor: 'EVALUADOR', nombre: 'Evaluador', descripcion: 'Trabajador: realiza diagnósticos en sus jornadas asignadas.' }, { valor: 'SUPERVISOR', nombre: 'Supervisor / especialista', descripcion: 'Organiza jornadas y revisa los diagnósticos.' }, { valor: 'ADMINISTRADOR', nombre: 'Administrador', descripcion: 'Administra usuarios y todas las operaciones del sistema.' }] as const;
const mensaje = (e: unknown) => axios.isAxiosError(e) ? e.response?.data?.mensaje ?? (e.response?.status === 403 ? 'Solo el administrador puede gestionar usuarios.' : e.response ? 'No se pudo completar la operación.' : 'No se pudo conectar con la API.') : e instanceof Error ? e.message : 'No se pudo completar la operación.';
export default function UsuariosPage() {
    const { usuario } = useAuth();
    const administrar = usuario?.rol === 'ADMINISTRADOR';
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [cargando, setCargando] = useState(true);
    const [ocupado, setOcupado] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [buscar, setBuscar] = useState('');
    const [rolFiltro, setRolFiltro] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [pagina, setPagina] = useState(1);
    const [crear, setCrear] = useState(false);
    const [nombres, setNombres] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const [rol, setRol] = useState<RolUsuario>('EVALUADOR');
    const [visible, setVisible] = useState(false);
    const [errorForm, setErrorForm] = useState('');
    const [cambio, setCambio] = useState<Usuario | null>(null);
    const cargar = useCallback(async () => { setOcupado(true); setError(''); try {
        setUsuarios(await usuariosApi.listar());
    }
    catch (e) {
        setError(mensaje(e));
    }
    finally {
        setOcupado(false);
    } }, []);
    useEffect(() => { if (!administrar)
        return; let vigente = true; usuariosApi.listar().then(u => { if (vigente)
        setUsuarios(u); }).catch(e => { if (vigente)
        setError(mensaje(e)); }).finally(() => { if (vigente)
        setCargando(false); }); return () => { vigente = false; }; }, [administrar]);
    function abrir() { setNombres(''); setApellidos(''); setCorreo(''); setPassword(''); setConfirmacion(''); setRol('EVALUADOR'); setVisible(false); setErrorForm(''); setCrear(true); }
    function cerrar() { setPassword(''); setConfirmacion(''); setCrear(false); }
    async function guardar() { setErrorForm(''); if (password !== confirmacion) {
        setErrorForm('Las contraseñas no coinciden.');
        return;
    } setOcupado(true); try {
        const nuevo = await usuariosApi.crear({ nombres: nombres.trim(), apellidos: apellidos.trim(), correo: correo.trim(), password, rol });
        setUsuarios(u => [...u, { ...nuevo, ultimoAcceso: null }].sort((a, b) => (a.apellidos + a.nombres).localeCompare(b.apellidos + b.nombres)));
        setPagina(1);
        cerrar();
        setExito('Cuenta creada. Puede iniciar sesión con el correo y la contraseña que definiste. Ya está disponible como responsable de jornadas.');
    }
    catch (e) {
        setErrorForm(mensaje(e));
    }
    finally {
        setOcupado(false);
    } }
    async function cambiarEstado() { if (!cambio)
        return; setOcupado(true); setError(''); try {
        await usuariosApi.estado(cambio.idUsuario, !cambio.activo);
        setUsuarios(us => us.map(u => u.idUsuario === cambio.idUsuario ? { ...u, activo: !u.activo } : u));
        setExito(cambio.activo ? 'Cuenta desactivada. Sus diagnósticos y asignaciones se conservan.' : 'Cuenta activada; puede iniciar sesión y recibir jornadas.');
        setCambio(null);
    }
    catch (e) {
        setError(mensaje(e));
        setCambio(null);
    }
    finally {
        setOcupado(false);
    } }
    const filtro = buscar.trim().toLowerCase();
    const filtrados = usuarios.filter(u => (!filtro || (u.nombres + ' ' + u.apellidos + ' ' + u.correo).toLowerCase().includes(filtro)) && (!rolFiltro || u.rol === rolFiltro) && (!estadoFiltro || u.activo === (estadoFiltro === 'activo')));
    const paginas = Math.max(1, Math.ceil(filtrados.length / 15));
    const paginaActual = Math.min(pagina, paginas);
    const filas = filtrados.slice((paginaActual - 1) * 15, paginaActual * 15);
    if (!usuario)
        return <div className="usuarios-page"><p>Cargando sesión…</p></div>;
    if (!administrar)
        return <div className="usuarios-page"><h1>Usuarios</h1><p>La creación y administración de cuentas corresponde al administrador.</p><Link to="/jornadas">Ir a jornadas</Link></div>;
    return <div className="usuarios-page"><header className="usuarios-header"><div><span>ADMINISTRACIÓN</span><h1><Users size={28}/>Usuarios</h1><p>Crea cuentas para los trabajadores y especialistas del fundo.</p></div><div className="usuarios-actions"><button disabled={ocupado || cargando} onClick={() => void cargar()}><RefreshCw size={16}/>Actualizar</button><button className="usuarios-primary" disabled={ocupado} onClick={abrir}><Plus size={17}/>Crear usuario</button></div></header>
 {error && <p className="usuarios-error" role="alert">{error}</p>}{exito && <p className="usuarios-exito" role="status">{exito}<button aria-label="Cerrar mensaje" onClick={() => setExito('')}><X size={16}/></button></p>}
 <section className="usuarios-panel"><div className="usuarios-filtros"><label><span>Buscar</span><div className="usuarios-busqueda"><Search size={17}/><input placeholder="Nombre o correo" value={buscar} onChange={e => { setBuscar(e.target.value); setPagina(1); }}/></div></label><label>Rol<select aria-label="Filtrar por rol" value={rolFiltro} onChange={e => { setRolFiltro(e.target.value); setPagina(1); }}><option value="">Todos</option>{roles.map(r => <option key={r.valor} value={r.valor}>{r.nombre}</option>)}</select></label><label>Estado<select aria-label="Filtrar por estado" value={estadoFiltro} onChange={e => { setEstadoFiltro(e.target.value); setPagina(1); }}><option value="">Todos</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option></select></label></div>
 <p className="usuarios-conteo">{usuarios.length} cuentas · {usuarios.filter(u => u.activo).length} activas · {filtrados.length} resultados</p>{cargando ? <p role="status">Cargando usuarios…</p> : <div className="usuarios-tabla"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Acción</th></tr></thead><tbody>{filas.map(u => <tr key={u.idUsuario}><td><strong>{u.nombres + ' ' + u.apellidos}</strong><small>{u.correo}</small></td><td>{roles.find(r => r.valor === u.rol)?.nombre ?? u.rol}</td><td><span className={'usuarios-estado ' + (u.activo ? 'activo' : 'inactivo')}>{u.activo ? 'Activo' : 'Inactivo'}</span></td><td>{u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString('es-PE', { timeZone: 'America/Lima' }) : 'Sin acceso registrado'}</td><td>{u.idUsuario === usuario.idUsuario ? <span className="usuarios-propia">Tu cuenta</span> : <button disabled={ocupado} onClick={() => setCambio(u)}>{u.activo ? <UserX size={16}/> : <UserCheck size={16}/>} {u.activo ? 'Desactivar' : 'Activar'}</button>}</td></tr>)}</tbody></table>{filas.length === 0 && <p>No hay usuarios que coincidan con la búsqueda.</p>}</div>}
 <div className="usuarios-paginacion"><button disabled={paginaActual === 1 || ocupado} onClick={() => setPagina(paginaActual - 1)}>Anterior</button><span>{paginaActual} de {paginas}</span><button disabled={paginaActual === paginas || ocupado} onClick={() => setPagina(paginaActual + 1)}>Siguiente</button></div></section>
 <section className="usuarios-ayuda"><div><h2>Asignar jornadas a un trabajador</h2><p>Después de crear su cuenta, entra al lote, abre Jornadas y selecciónalo como responsable al crear una jornada.</p></div><Link to="/jornadas">Ir a jornadas →</Link></section>
 {crear && <div className="usuarios-overlay"><section className="usuarios-modal" role="dialog" aria-modal="true" aria-labelledby="crear-usuario-titulo"><header><div><h2 id="crear-usuario-titulo">Crear usuario</h2><p>La cuenta quedará activa al guardarla.</p></div><button type="button" aria-label="Cerrar formulario" disabled={ocupado} onClick={cerrar}><X size={20}/></button></header><form onSubmit={e => { e.preventDefault(); void guardar(); }}><div className="usuarios-form-grid"><label htmlFor="usuario-nombres">Nombres<input id="usuario-nombres" autoFocus required maxLength={100} autoComplete="off" value={nombres} onChange={e => setNombres(e.target.value)}/></label><label htmlFor="usuario-apellidos">Apellidos<input id="usuario-apellidos" required maxLength={100} autoComplete="off" value={apellidos} onChange={e => setApellidos(e.target.value)}/></label><label htmlFor="usuario-correo" className="usuarios-ancho">Correo electrónico<input id="usuario-correo" type="email" required maxLength={254} autoComplete="off" value={correo} onChange={e => setCorreo(e.target.value)}/></label><label htmlFor="usuario-rol" className="usuarios-ancho">Rol<select id="usuario-rol" aria-label="Rol" value={rol} onChange={e => setRol(e.target.value as RolUsuario)}>{roles.map(r => <option key={r.valor} value={r.valor}>{r.nombre}</option>)}</select><small>{roles.find(r => r.valor === rol)?.descripcion}</small></label><label htmlFor="usuario-password">Contraseña<div className="usuarios-password"><input id="usuario-password" aria-label="Contraseña" type={visible ? 'text' : 'password'} required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}/><button type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div><small>Mínimo 8 caracteres.</small></label><label htmlFor="usuario-confirmacion">Confirmar contraseña<input id="usuario-confirmacion" type={visible ? 'text' : 'password'} required minLength={8} maxLength={128} autoComplete="new-password" value={confirmacion} onChange={e => setConfirmacion(e.target.value)}/></label></div>{errorForm && <p role="alert" className="usuarios-error">{errorForm}</p>}<div className="usuarios-modal-actions"><button type="button" disabled={ocupado} onClick={cerrar}>Cancelar</button><button type="submit" className="usuarios-primary" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Guardar usuario'}</button></div></form></section></div>}
 {cambio && <div className="usuarios-overlay"><section className="usuarios-modal usuarios-modal-corta" role="dialog" aria-modal="true" aria-labelledby="estado-usuario-titulo"><h2 id="estado-usuario-titulo">{cambio.activo ? 'Desactivar' : 'Activar'} usuario</h2><p>{cambio.nombres + ' ' + cambio.apellidos}</p><p>{cambio.activo ? 'No podrá acceder ni seguir utilizando su sesión. Sus diagnósticos y jornadas se conservarán.' : 'Podrá iniciar sesión y ser asignado a jornadas.'}</p><div className="usuarios-modal-actions"><button disabled={ocupado} onClick={() => setCambio(null)}>Cancelar</button><button className="usuarios-primary" disabled={ocupado} onClick={() => void cambiarEstado()}>Confirmar {cambio.activo ? 'desactivación' : 'activación'}</button></div></section></div>}</div>;
}
