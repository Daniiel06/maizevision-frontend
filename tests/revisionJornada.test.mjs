import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const fuente=readFileSync(new URL("../src/features/jornadas/revisionJornada.ts",import.meta.url),"utf8");
const codigo=ts.transpileModule(fuente,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const modulo={exports:{}};
vm.runInNewContext(codigo,{exports:modulo.exports,module:modulo});
const seleccionar=modulo.exports.obtenerRevisionJornada;
test("Revisa el diagnóstico de la jornada y su foto aunque exista una evaluación más reciente",()=>{
 const historial={inspecciones:[
  {idInspeccion:"nueva",diagnosticos:[{idDiagnostico:"nuevo",idImagen:"foto-nueva"}],imagenes:[{idImagen:"foto-nueva",urlImagen:"nueva"}]},
  {idInspeccion:"jornada",diagnosticos:[{idDiagnostico:"principal",idImagen:"foto-original"},{idDiagnostico:"reintento",idImagen:"foto-otra"}],imagenes:[{idImagen:"foto-otra",urlImagen:"otra"},{idImagen:"foto-original",urlImagen:"original"}]}
 ]};
 const revision=seleccionar(historial,"principal");
 assert.equal(revision.diagnostico.idDiagnostico,"principal");
 assert.equal(revision.imagen.urlImagen,"original");
 assert.equal(revision.inspeccion.idInspeccion,"jornada");
});
test("Una foto ausente no se sustituye por la de otro diagnóstico",()=>{
 const revision=seleccionar({inspecciones:[{diagnosticos:[{idDiagnostico:"principal",idImagen:"perdida"}],imagenes:[{idImagen:"otra"}]}]},"principal");
 assert.equal(revision.imagen,null);
});
test("Un diagnóstico inexistente impide revisar un resultado diferente",()=>{
 assert.throws(()=>seleccionar({inspecciones:[{diagnosticos:[{idDiagnostico:"otro"}],imagenes:[]}]},"principal"),/No se encontró/);
});
