import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const fuente = readFileSync(new URL("../src/features/inspecciones/utils/tiempoAtencion.ts", import.meta.url), "utf8");
const codigo = ts.transpileModule(fuente, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function entorno() {
  let reloj = 1000;
  const almacen = new Map();
  const localStorage = { getItem: k => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v) };
  const modulo = { exports: {} };
  vm.runInNewContext(codigo, { exports: modulo.exports, module: modulo, Date,
    performance: { timeOrigin: 0, now: () => reloj }, localStorage });
  return { api: modulo.exports, adelantar: ms => reloj += ms, localStorage };
}
test("Incluye captura, subida, análisis y espera hasta el resultado", () => {
  const e = entorno();
  const inicio = e.api.iniciarAtencion();
  e.adelantar(10000); // fotografía
  e.adelantar(5000); // subida
  e.adelantar(20000); // análisis, guardado y respuesta
  const fin = e.api.finalizarAtencion(inicio);
  assert.equal(fin.tiempoAtencionMs, 35000);
  assert.equal(Date.parse(fin.resultadoVisibleUtc) - Date.parse(fin.inicioAtencionUtc), 35000);
});
test("Un reintento conserva el inicio del mismo intento", () => {
  const e = entorno(); const inicio = e.api.iniciarAtencion();
  e.adelantar(20000); // fallo
  e.adelantar(10000); // trabajador reintenta
  e.adelantar(5000); // obtiene resultado
  assert.equal(e.api.finalizarAtencion(inicio).tiempoAtencionMs, 35000);
  assert.equal(e.api.tiemposPendientes().length, 0); // el conteo por sí solo no guarda diagnósticos
});
test("La cola conserva la duración original, evita duplicados y separa usuarios", () => {
  const e = entorno(); e.localStorage.setItem("maizevision_usuario", JSON.stringify({ idUsuario: "uno" }));
  const inicio = e.api.iniciarAtencion(); e.adelantar(35000);
  const dato = { ...e.api.finalizarAtencion(inicio), idDiagnostico: "diag", usuarioId: "uno" };
  e.api.conservarTiempo(dato); e.adelantar(60000); e.api.conservarTiempo(dato);
  assert.equal(e.api.tiemposPendientes().length, 1);
  assert.equal(e.api.tiemposPendientes()[0].tiempoAtencionMs, 35000);
  e.localStorage.setItem("maizevision_usuario", JSON.stringify({ idUsuario: "dos" }));
  assert.equal(e.api.tiemposPendientes().length, 0);
  e.api.quitarTiempoPendiente("diag", "uno");
  assert.equal(e.api.tiemposPendientes("uno").length, 0);
});
