import { coloresLote, coloresLoteClaro, sectorEnPunto } from './lote3dModelo';
import type { SectorVisual } from './lote3dModelo';

export interface EstadoLote3D {
  sectores: SectorVisual[]; tema: 'claro' | 'oscuro'; seleccionado: string | null; maxFila: number;
}
export interface VisorLote3D {
  actualizar: (estado: EstadoLote3D) => void;
  girar: (paso: number) => void;
  zoom: (paso: number) => void;
  superior: () => void;
  restablecer: () => void;
  destruir: () => void;
}
const ANCHO = 4, FONDO = 2.8;
const INICIAL = { giro: -0.40, elevacion: 0.91, zoom: 1 };
const vertexSource = `
attribute vec3 aPos; attribute vec2 aUv; attribute vec3 aNormal; attribute float aPlanta;
uniform vec4 uCam; uniform float uAspect; varying vec2 vUv; varying float vTop; varying float vLuz; varying float vPlanta;
void main(){
  float c=cos(uCam.x),s=sin(uCam.x),e=uCam.y;
  float x=aPos.x*c+aPos.z*s, z=-aPos.x*s+aPos.z*c;
  gl_Position=vec4(x/(uCam.z*uAspect),(aPos.y*cos(e)-z*sin(e))/uCam.z,
    (-aPos.y*sin(e)-z*cos(e))/10.0,1.0);
  vUv=aUv; vTop=step(0.5,aNormal.y); vPlanta=aPlanta;
  vLuz=0.63+0.37*max(0.0,dot(aNormal,normalize(vec3(-0.35,0.9,0.4))));
}`;
const fragmentSource = `
precision mediump float;
uniform sampler2D uMapa; uniform vec3 uSuelo;
varying vec2 vUv; varying float vTop; varying float vLuz; varying float vPlanta;
void main(){
  vec3 color=mix(uSuelo,texture2D(uMapa,vUv).rgb,vTop);
  vec3 hoja=mix(vec3(0.14,0.40,0.21),vec3(0.40,0.69,0.32),clamp(vUv.x,0.0,1.0));
  color=mix(color,hoja,vPlanta);
  gl_FragColor=vec4(color*vLuz,1.0);
}`;

// La textura es un esquema estadístico por sector, no una interpolación espacial.
// Cada mancha se recorta a su sector; su tamaño/intensidad depende de su proporción.
export function pintarTextura(canvas: HTMLCanvasElement, estado: EstadoLote3D) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar la textura del lote.');
  const W = canvas.width, H = canvas.height, claro = estado.tema === 'claro';
  ctx.fillStyle = claro ? '#b4b2a4' : '#414b49'; ctx.fillRect(0, 0, W, H);
  for (const s of estado.sectores) {
    const x = s.u0 * W, y = s.v0 * H, w = (s.u1 - s.u0) * W, h = (s.v1 - s.v0) * H;
    ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, w - 2, h - 2); ctx.clip();
    ctx.fillStyle = s.total ? (claro ? '#b5b4a5' : '#49524c') : (claro ? '#a1a9ad' : '#3f4a54');
    ctx.fillRect(x, y, w, h);
    if (!s.total) {
      ctx.strokeStyle = claro ? '#79899355' : '#91a4af28'; ctx.lineWidth = 2;
      for (let d = -H; d < W + H; d += 20) { ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + H, H); ctx.stroke(); }
    }
    const categorias = s.categorias.slice().sort((a, b) => a.codigo.localeCompare(b.codigo));
    categorias.forEach((c, i) => {
      // Anclajes esquemáticos, estables al filtrar. No se asignan posiciones de plantas.
      const indice = Object.keys(coloresLote).indexOf(c.codigo);
      const angulo = (indice < 0 ? i : indice) * 2.39996;
      const cx = x + w * (0.5 + Math.cos(angulo) * 0.18), cy = y + h * (0.5 + Math.sin(angulo) * 0.18);
      const paleta = claro ? coloresLoteClaro : coloresLote;
      const hex = paleta[c.codigo] ?? '#b5a1cf';
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      const intensidad = Math.min(1, Math.max(0, c.proporcion));
      const escala = 0.28 + Math.sqrt(intensidad) * 0.48;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(w * escala, h * escala);
      const gradiente = ctx.createRadialGradient(0, 0, 0.03, 0, 0, 0.8);
      gradiente.addColorStop(0, `rgba(${r},${g},${b},${0.30 + intensidad * 0.65})`);
      gradiente.addColorStop(0.42, `rgba(${r},${g},${b},${0.18 + intensidad * 0.54})`);
      gradiente.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gradiente; ctx.fillRect(-0.85, -0.85, 1.7, 1.7); ctx.restore();
    });
    ctx.restore();
  }
  // Surcos decorativos: no representan puntos ni cantidades de plantas.
  const filas = Math.min(64, Math.max(8, estado.maxFila));
  for (let f = 0; f <= filas; f++) {
    const y = f / filas * H;
    ctx.strokeStyle = claro ? '#ffffff2a' : '#ced4b120'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.strokeStyle = '#0e181c22'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, y + 3); ctx.lineTo(W, y + 3); ctx.stroke();
  }
  for (const s of estado.sectores) {
    const x = s.u0 * W, y = s.v0 * H, w = (s.u1 - s.u0) * W, h = (s.v1 - s.v0) * H;
    ctx.strokeStyle = s.id === estado.seleccionado ? '#ffffff' : (claro ? '#ffffff55' : '#dce8e83b');
    ctx.lineWidth = s.id === estado.seleccionado ? 7 : 2; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  }
  ctx.strokeStyle = claro ? '#eee9d5' : '#82938b'; ctx.lineWidth = 8; ctx.strokeRect(3, 3, W - 6, H - 6);
}

export function crearVisorLote(canvas: HTMLCanvasElement, inicial: EstadoLote3D, onSeleccion: (id: string) => void, onFallo: () => void): VisorLote3D {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL no disponible');
  const shaders: WebGLShader[] = [], buffers: WebGLBuffer[] = [];
  let program: WebGLProgram | null = null, texture: WebGLTexture | null = null;
  function liberar() {
    buffers.forEach(b => gl!.deleteBuffer(b)); shaders.forEach(s => gl!.deleteShader(s));
    if (texture) gl!.deleteTexture(texture); if (program) gl!.deleteProgram(program);
  }
  try {
    const shader = (type: number, source: string) => {
      const s = gl.createShader(type); if (!s) throw new Error('Shader no disponible');
      shaders.push(s); gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('No se pudo preparar la vista 3D');
      return s;
    };
    program = gl.createProgram(); if (!program) throw new Error('Programa no disponible');
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource)); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('No se pudo preparar la vista 3D');
    gl.useProgram(program);
    const vertices: number[] = [];
    const cara = (a: number[], b: number[], c: number[], d: number[], normal: number[]) => {
      for (const [p, uv] of [[a, [0, 0]], [b, [1, 0]], [c, [1, 1]], [a, [0, 0]], [c, [1, 1]], [d, [0, 1]]]) vertices.push(...p, ...uv, ...normal, 0);
    };
    const x = ANCHO / 2, z = FONDO / 2, y = -0.20;
    cara([-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z], [0, 1, 0]);
    cara([-x, y, z], [-x, 0, z], [x, 0, z], [x, y, z], [0, 0, 1]);
    cara([x, y, -z], [x, 0, -z], [-x, 0, -z], [-x, y, -z], [0, 0, -1]);
    cara([-x, y, -z], [-x, 0, -z], [-x, 0, z], [-x, y, z], [-1, 0, 0]);
    cara([x, y, z], [x, 0, z], [x, 0, -z], [x, y, -z], [1, 0, 0]);
    // Vegetación decorativa de densidad fija: no depende del inventario ni de
    // diagnósticos y no representa posiciones o estados reales de las plantas.
    const trianguloHoja = (a: number[], b: number[], c: number[], tono: number) => {
      for (const p of [a, b, c]) vertices.push(...p, tono, 0, 0, 1, 0, 1);
    };
    for (let fila = 0; fila < 12; fila++) for (let columna = 0; columna < 22; columna++) {
      const px = -x + (columna + 0.5) * ANCHO / 22;
      const pz = -z + (fila + 0.5) * FONDO / 12;
      const alto = 0.085 + ((fila * 7 + columna * 3) % 5) * 0.006;
      trianguloHoja([px - 0.004, 0.006, pz], [px + 0.004, 0.006, pz], [px, alto, pz], 0.15);
      trianguloHoja([px, 0.006, pz - 0.004], [px, 0.006, pz + 0.004], [px, alto, pz], 0.3);
      for (let lado = 0; lado < 4; lado++) {
        const angulo = lado * Math.PI / 2 + (fila % 2) * 0.25;
        const dx = Math.cos(angulo), dz = Math.sin(angulo);
        const base = [px, alto * 0.45, pz];
        const izquierda = [px + dx * 0.032 - dz * 0.013, alto, pz + dz * 0.032 + dx * 0.013];
        const derecha = [px + dx * 0.032 + dz * 0.013, alto, pz + dz * 0.032 - dx * 0.013];
        const punta = [px + dx * 0.075, alto * 0.66, pz + dz * 0.075];
        trianguloHoja(base, izquierda, derecha, 0.40 + lado * 0.13);
        trianguloHoja(izquierda, punta, derecha, 0.67 + (lado % 2) * 0.25);
      }
    }
    const buffer = gl.createBuffer(); if (!buffer) throw new Error('Buffer no disponible'); buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    for (const [nombre, size, offset] of [['aPos', 3, 0], ['aUv', 2, 12], ['aNormal', 3, 20], ['aPlanta', 1, 32]] as const) {
      const loc = gl.getAttribLocation(program, nombre); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 36, offset);
    }
    texture = gl.createTexture(); if (!texture) throw new Error('Textura no disponible');
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, 'uMapa'), 0);
    const cam = gl.getUniformLocation(program, 'uCam'), aspectLoc = gl.getUniformLocation(program, 'uAspect'), suelo = gl.getUniformLocation(program, 'uSuelo');
    const mapa = document.createElement('canvas'); mapa.width = 1024; mapa.height = 768;
    let estado = inicial, pose = { ...INICIAL }, aspect = 1, escala = 2.5, frame = 0, cerrado = false;
    const ajustar = () => {
      const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr));
      aspect = canvas.width / canvas.height;
      // Escala fija respecto a la orientación: girar no modifica el zoom.
      escala = Math.max(2.45 / aspect, 1.85) * 1.12 / pose.zoom;
    };
    const dibujar = () => {
      frame = 0; if (cerrado || gl.isContextLost()) return;
      ajustar(); gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.uniform4f(cam, pose.giro, pose.elevacion, escala, 0); gl.uniform1f(aspectLoc, aspect);
      if (estado.tema === 'claro') gl.uniform3f(suelo, 0.41, 0.36, 0.29); else gl.uniform3f(suelo, 0.23, 0.25, 0.25);
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 9);
    };
    const solicitar = () => { if (!cerrado && !frame) frame = requestAnimationFrame(dibujar); };
    const actualizar = (nuevo: EstadoLote3D) => {
      estado = nuevo; pintarTextura(mapa, estado); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mapa); solicitar();
    };
    const punto = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const rx = ((clientX - rect.left) / rect.width * 2 - 1) * escala * aspect;
      const rz = - (1 - (clientY - rect.top) / rect.height * 2) * escala / Math.sin(pose.elevacion);
      const c = Math.cos(pose.giro), s = Math.sin(pose.giro);
      return sectorEnPunto(estado.sectores, (rx * c - rz * s) / ANCHO + 0.5, (rx * s + rz * c) / FONDO + 0.5);
    };
    let drag: { x: number; y: number; ultimoX: number; ultimoY: number; id: number; movido: boolean } | null = null;
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, ultimoX: e.clientX, ultimoY: e.clientY, id: e.pointerId, movido: false };
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) drag.movido = true;
      if (drag.movido) {
        pose.giro += (e.clientX - drag.ultimoX) * 0.009;
        if (e.pointerType !== 'touch') pose.elevacion = Math.max(0.42, Math.min(1.5, pose.elevacion + (e.clientY - drag.ultimoY) * 0.007));
        solicitar();
      }
      drag.ultimoX = e.clientX; drag.ultimoY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.movido && e.type === 'pointerup') { const id = punto(e.clientX, e.clientY); if (id) onSeleccion(id); }
      drag = null;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    const lost = (e: Event) => { e.preventDefault(); onFallo(); };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('webglcontextlost', lost);
    const resize = new ResizeObserver(solicitar); resize.observe(canvas);
    actualizar(inicial);
    return {
      actualizar,
      girar: paso => { pose.giro += paso; solicitar(); },
      zoom: paso => { pose.zoom = Math.max(0.7, Math.min(1.65, pose.zoom + paso)); solicitar(); },
      superior: () => { pose.elevacion = 1.5; pose.giro = 0; solicitar(); },
      restablecer: () => { pose = { ...INICIAL }; solicitar(); },
      destruir: () => {
        cerrado = true; cancelAnimationFrame(frame); resize.disconnect();
        canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
        canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('webglcontextlost', lost);
        liberar();
      },
    };
  } catch (error) { liberar(); throw error; }
}
