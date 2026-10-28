import { Maximize2, Minus, Plus, RotateCcw, RotateCw, View } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DashboardSector } from '../types/dashboard.types';
import { construirSectores3D, coloresLote } from './lote3dModelo';
import { crearVisorLote } from './lote3dWebgl';
import type { VisorLote3D } from './lote3dWebgl';
import './LoteSectores3D.css';

interface Props {
  sectores: DashboardSector[]; maxFila: number; maxPosicion: number; clase: string;
  seleccionado: string | null; tema: 'claro' | 'oscuro'; onSeleccion: (id: string) => void;
}

export default function LoteSectores3D({ sectores, maxFila, maxPosicion, clase, seleccionado, tema, onSeleccion }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null), visor = useRef<VisorLote3D | null>(null);
  const [fallo, setFallo] = useState(false);
  const visual = useMemo(() => construirSectores3D(sectores, maxFila, maxPosicion, clase), [sectores, maxFila, maxPosicion, clase]);
  const categorias = useMemo(() => {
    const mapa = new Map<string, { nombre: string; plantas: number }>();
    sectores.forEach(s => s.clases.forEach(c => {
      if (c.plantas > 0 && (!clase || clase === c.codigo)) mapa.set(c.codigo, { nombre: c.nombre, plantas: (mapa.get(c.codigo)?.plantas ?? 0) + c.plantas });
    }));
    return [...mapa].map(([codigo, c]) => ({ codigo, ...c }));
  }, [sectores, clase]);
  useEffect(() => {
    if (!canvas.current) return;
    let vigente = true;
    const informarFallo = () => queueMicrotask(() => { if (vigente) setFallo(true); });
    try {
      visor.current = crearVisorLote(canvas.current, { sectores: [], tema: 'oscuro', seleccionado: null, maxFila: 0 }, onSeleccion, informarFallo);
    } catch { informarFallo(); }
    return () => { vigente = false; visor.current?.destruir(); visor.current = null; };
  }, [onSeleccion]);
  useEffect(() => {
    visor.current?.actualizar({ sectores: visual, tema, seleccionado, maxFila });
  }, [visual, tema, seleccionado, maxFila]);

  return <div className="lote3d">
    <div className="lote3d-toolbar" aria-label="Controles de la vista 3D">
      <span><i/>Vista 3D · por sectores</span>
      <div>
        <button type="button" aria-label="Girar a la izquierda" title="Girar a la izquierda" disabled={fallo} onClick={() => visor.current?.girar(-0.25)}><RotateCcw size={15}/></button>
        <button type="button" aria-label="Girar a la derecha" title="Girar a la derecha" disabled={fallo} onClick={() => visor.current?.girar(0.25)}><RotateCw size={15}/></button>
        <button type="button" aria-label="Alejar lote" title="Alejar" disabled={fallo} onClick={() => visor.current?.zoom(-0.15)}><Minus size={15}/></button>
        <button type="button" aria-label="Acercar lote" title="Acercar" disabled={fallo} onClick={() => visor.current?.zoom(0.15)}><Plus size={15}/></button>
        <button type="button" aria-label="Vista superior del lote" title="Vista superior" disabled={fallo} onClick={() => visor.current?.superior()}><View size={15}/></button>
        <button type="button" aria-label="Restablecer vista del lote" title="Restablecer vista" disabled={fallo} onClick={() => visor.current?.restablecer()}><Maximize2 size={15}/></button>
      </div>
    </div>
    <div className="lote3d-scene">
      <canvas ref={canvas} className={fallo ? 'lote3d-canvas oculto' : 'lote3d-canvas'} role="img" aria-label="Lote 3D con distribución esquemática por sectores. Arrastra para girar o usa los botones. El detalle accesible está en Seleccionar sector."/>
      {fallo ? <p role="status" className="lote3d-fallback">La vista 3D no está disponible en este dispositivo. Cambia a «Sectores» para consultar el lote.</p> : <>
        <span className="lote3d-dimensiones">{maxFila} filas · {maxPosicion} posiciones</span>
        <span className="lote3d-gesto">Arrastra para girar · Toca un sector</span>
      </>}
    </div>
    <div className="lote3d-leyenda" aria-label="Categorías visibles en el lote">
      {categorias.map(c => <span key={c.codigo}><i style={{ background: `var(--dash-${c.codigo}, ${coloresLote[c.codigo] ?? '#a6b3cb'})` }}/>{c.nombre}<strong>{c.plantas.toLocaleString('es-PE')}</strong></span>)}
      <span><i className="lote3d-desconocido"/>Sin clasificación</span>
    </div>
    <p className="lote3d-nota">Plantitas decorativas; su color no indica diagnóstico. Las manchas resumen cada sector, sin posiciones exactas ni superficie afectada.</p>
    <details className="lote3d-accesible"><summary>Seleccionar sector</summary><div>{visual.map(s => <button key={s.id} type="button" aria-pressed={s.id === seleccionado} onClick={() => onSeleccion(s.id)}><span>F{s.datos.filaDesde}–{s.datos.filaHasta} · P{s.datos.posicionDesde}–{s.datos.posicionHasta}</span><strong>{s.total ? `${s.seleccionadas} / ${s.total} clasificadas` : 'Sin datos'}</strong></button>)}</div></details>
  </div>;
}
