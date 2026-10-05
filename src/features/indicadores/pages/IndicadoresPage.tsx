import {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Target,
} from "lucide-react";

import {
  obtenerResumenIndicadores,
} from "../api/indicadoresApi";

import type {
  IndicadoresResumen,
  PrecisionClase,
} from "../types/indicadores.types";

import "./IndicadoresPage.css";


export default function IndicadoresPage() {
  const [
    resumen,
    setResumen,
  ] = useState<IndicadoresResumen | null>(
    null
  );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  const cargarIndicadores =
    async (
      esActualizacion = false
    ) => {
      try {
        if (esActualizacion) {
          setActualizando(true);
        } else {
          setCargando(true);
        }

        setError(null);

        const data =
          await obtenerResumenIndicadores();

        setResumen(data);
      } catch (err) {
        console.error(
          "Error cargando indicadores:",
          err
        );

        setError(
          "No se pudieron cargar los indicadores de investigación."
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    };


  useEffect(() => {
    cargarIndicadores();
  }, []);


  if (cargando) {
    return (
      <div className="indicadores-loading">
        <div className="indicadores-spinner" />

        <span>
          Calculando indicadores de investigación...
        </span>
      </div>
    );
  }


  if (error || !resumen) {
    return (
      <div className="indicadores-error">
        <AlertTriangle size={38} />

        <h2>
          No fue posible cargar los indicadores
        </h2>

        <p>
          {error ??
            "No existe información disponible."}
        </p>

        <button
          type="button"
          onClick={() =>
            cargarIndicadores()
          }
        >
          <RefreshCw size={17} />

          Reintentar
        </button>
      </div>
    );
  }


  const hayValidaciones =
    resumen.diagnosticosValidados > 0;


  return (
    <div className="indicadores-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="indicadores-header">

        <div>
          <span className="indicadores-eyebrow">
            INVESTIGACIÓN
          </span>

          <h1>
            Indicadores del diagnóstico
          </h1>

          <p>
            Evaluación cuantitativa del diagnóstico
            de plagas foliares mediante MaizeVision.
          </p>
        </div>


        <button
          type="button"
          className="indicadores-actualizar"
          onClick={() =>
            cargarIndicadores(true)
          }
          disabled={actualizando}
        >
          <RefreshCw
            size={17}
            className={
              actualizando
                ? "girando"
                : ""
            }
          />

          {actualizando
            ? "Actualizando..."
            : "Actualizar datos"}
        </button>

      </header>


      {/* =====================================================
          INDICADORES PRINCIPALES
      ===================================================== */}

      <section className="indicadores-principales">

        <IndicadorCard
          clase="indicador-precision"
          icono={
            <Target size={25} />
          }
          numero={
            hayValidaciones
              ? `${formatearNumero(
                  resumen.porcentajePrecision
                )} %`
              : "—"
          }
          titulo="Precisión del diagnóstico"
          descripcion={
            hayValidaciones
              ? `${resumen.correctos} diagnósticos correctos de ${resumen.diagnosticosValidados} validados`
              : "Pendiente de validaciones del especialista"
          }
          objetivo="Incrementar la precisión"
          tendencia="positiva"
        />


        <IndicadorCard
          clase="indicador-tiempo"
          icono={
            <Clock3 size={25} />
          }
          numero={
            resumen.totalDiagnosticos > 0
              ? `${formatearNumero(
                  resumen.tiempoPromedioMinutos
                )} min`
              : "—"
          }
          titulo="Tiempo promedio de diagnóstico"
          descripcion={
            resumen.totalDiagnosticos > 0
              ? `${formatearNumero(
                  resumen.tiempoPromedioSegundos
                )} segundos en promedio`
              : "Todavía no existen diagnósticos"
          }
          objetivo="Disminuir el tiempo"
          tendencia="negativa"
        />


        <IndicadorCard
          clase="indicador-error"
          icono={
            <AlertTriangle size={25} />
          }
          numero={
            hayValidaciones
              ? `${formatearNumero(
                  resumen.porcentajeError
                )} %`
              : "—"
          }
          titulo="Error de identificación"
          descripcion={
            hayValidaciones
              ? `${resumen.incorrectos} diagnósticos incorrectos de ${resumen.diagnosticosValidados} validados`
              : "Pendiente de validaciones del especialista"
          }
          objetivo="Disminuir los errores"
          tendencia="negativa"
        />

      </section>


      {/* =====================================================
          ESTADO DE VALIDACIÓN
      ===================================================== */}

      <section className="indicadores-grid-superior">

        <div className="panel-indicador panel-validacion">

          <div className="panel-indicador-header">

            <div>
              <span className="panel-subtitulo">
                CONTROL DE DATOS
              </span>

              <h2>
                Estado de validación
              </h2>
            </div>

            <ShieldCheck size={24} />

          </div>


          <div className="validacion-contenido">

            <div
              className="validacion-circulo"
              style={{
                background:
                  `conic-gradient(
                    var(--primary)
                    ${Math.min(
                      resumen.porcentajeValidacion,
                      100
                    )}%,
                    #e8edf0
                    0
                  )`,
              }}
            >
              <div className="validacion-circulo-centro">
                <strong>
                  {formatearNumero(
                    resumen.porcentajeValidacion
                  )} %
                </strong>

                <span>
                  validado
                </span>
              </div>
            </div>


            <div className="validacion-resumen">

              <ResumenDato
                titulo="Diagnósticos realizados"
                valor={resumen.totalDiagnosticos}
              />

              <ResumenDato
                titulo="Validados por especialista"
                valor={resumen.diagnosticosValidados}
                clase="dato-correcto"
              />

              <ResumenDato
                titulo="Pendientes de validación"
                valor={resumen.diagnosticosPendientes}
                clase="dato-pendiente"
              />

            </div>

          </div>


          <div className="validacion-barra">

            <div className="validacion-barra-track">
              <div
                className="validacion-barra-fill"
                style={{
                  width:
                    `${Math.min(
                      resumen.porcentajeValidacion,
                      100
                    )}%`,
                }}
              />
            </div>

            <span>
              {resumen.diagnosticosValidados}
              {" de "}
              {resumen.totalDiagnosticos}
              {" diagnósticos revisados"}
            </span>

          </div>

        </div>


        {/* =================================================
            CORRECTOS / INCORRECTOS
        ================================================= */}

        <div className="panel-indicador panel-resultados">

          <div className="panel-indicador-header">

            <div>
              <span className="panel-subtitulo">
                VALIDACIÓN PROFESIONAL
              </span>

              <h2>
                Resultado de las validaciones
              </h2>
            </div>

            <ScanSearch size={24} />

          </div>


          {!hayValidaciones ? (
            <div className="sin-validaciones">

              <ShieldCheck size={35} />

              <strong>
                Aún no hay diagnósticos validados
              </strong>

              <span>
                La precisión y el error se calcularán
                cuando el especialista revise los
                diagnósticos.
              </span>

            </div>
          ) : (
            <div className="resultado-validaciones">

              <ResultadoBarra
                titulo="Correctos"
                valor={resumen.correctos}
                porcentaje={
                  resumen.porcentajePrecision
                }
                tipo="correcto"
              />

              <ResultadoBarra
                titulo="Incorrectos"
                valor={resumen.incorrectos}
                porcentaje={
                  resumen.porcentajeError
                }
                tipo="incorrecto"
              />


              <div className="formula-indicador">

                <div>
                  <span>
                    Precisión
                  </span>

                  <strong>
                    {resumen.correctos}
                    {" / "}
                    {resumen.diagnosticosValidados}
                    {" × 100"}
                  </strong>
                </div>


                <div>
                  <span>
                    Error
                  </span>

                  <strong>
                    100 % −{" "}
                    {formatearNumero(
                      resumen.porcentajePrecision
                    )}
                    {" %"}
                  </strong>
                </div>

              </div>

            </div>
          )}

        </div>

      </section>


      {/* =====================================================
          PRECISIÓN POR CLASE
      ===================================================== */}

      <section className="panel-indicador panel-clases">

        <div className="panel-indicador-header">

          <div>
            <span className="panel-subtitulo">
              COMPORTAMIENTO DEL MODELO
            </span>

            <h2>
              Precisión por clase diagnosticada
            </h2>

            <p>
              Calculada únicamente con diagnósticos
              revisados por el especialista.
            </p>
          </div>

          <BarChart3 size={25} />

        </div>


        {resumen.precisionPorClase.length ===
        0 ? (
          <div className="clases-vacio">

            <Activity size={34} />

            <strong>
              Sin información suficiente
            </strong>

            <span>
              Las clases aparecerán cuando existan
              diagnósticos validados.
            </span>

          </div>
        ) : (
          <div className="clases-lista">

            {resumen.precisionPorClase.map(
              clase => (
                <PrecisionClaseFila
                  key={clase.codigo}
                  clase={clase}
                />
              )
            )}

          </div>
        )}

      </section>


      {/* =====================================================
          INTERPRETACIÓN DE INDICADORES
      ===================================================== */}

      <section className="indicadores-explicacion">

        <div className="explicacion-card">

          <div className="explicacion-icono explicacion-verde">
            <Target size={21} />
          </div>

          <div>
            <strong>
              Precisión del diagnóstico
            </strong>

            <p>
              Representa el porcentaje de diagnósticos
              en los que la clase predicha por la IA
              coincide con la validación realizada por
              el especialista.
            </p>
          </div>

        </div>


        <div className="explicacion-card">

          <div className="explicacion-icono explicacion-azul">
            <Clock3 size={21} />
          </div>

          <div>
            <strong>
              Tiempo promedio
            </strong>

            <p>
              Mide el tiempo transcurrido desde el inicio
              de la inspección hasta que el sistema
              genera el diagnóstico de la planta.
            </p>
          </div>

        </div>


        <div className="explicacion-card">

          <div className="explicacion-icono explicacion-rojo">
            <AlertTriangle size={21} />
          </div>

          <div>
            <strong>
              Error de identificación
            </strong>

            <p>
              Corresponde al porcentaje de diagnósticos
              validados que no coinciden con la
              identificación realizada por el
              especialista.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   COMPONENTES
========================================================= */


function IndicadorCard({
  clase,
  icono,
  numero,
  titulo,
  descripcion,
  objetivo,
  tendencia,
}: {
  clase: string;
  icono: React.ReactNode;
  numero: string;
  titulo: string;
  descripcion: string;
  objetivo: string;
  tendencia: "positiva" | "negativa";
}) {
  return (
    <article
      className={`indicador-card ${clase}`}
    >

      <div className="indicador-card-top">

        <div className="indicador-icono">
          {icono}
        </div>

        <span
          className={`indicador-objetivo indicador-objetivo-${tendencia}`}
        >
          {objetivo}
        </span>

      </div>


      <div className="indicador-numero">
        {numero}
      </div>


      <h2>
        {titulo}
      </h2>


      <p>
        {descripcion}
      </p>

    </article>
  );
}


function ResumenDato({
  titulo,
  valor,
  clase = "",
}: {
  titulo: string;
  valor: number;
  clase?: string;
}) {
  return (
    <div className="resumen-dato">

      <div>
        <span>
          {titulo}
        </span>
      </div>

      <strong className={clase}>
        {valor}
      </strong>

    </div>
  );
}


function ResultadoBarra({
  titulo,
  valor,
  porcentaje,
  tipo,
}: {
  titulo: string;
  valor: number;
  porcentaje: number;
  tipo: "correcto" | "incorrecto";
}) {
  return (
    <div className="resultado-barra">

      <div className="resultado-barra-header">

        <span>
          {tipo === "correcto" ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertTriangle size={17} />
          )}

          {titulo}
        </span>

        <strong>
          {valor}
          {" · "}
          {formatearNumero(
            porcentaje
          )} %
        </strong>

      </div>


      <div className="resultado-track">
        <div
          className={`resultado-fill resultado-fill-${tipo}`}
          style={{
            width:
              `${Math.min(
                porcentaje,
                100
              )}%`,
          }}
        />
      </div>

    </div>
  );
}


function PrecisionClaseFila({
  clase,
}: {
  clase: PrecisionClase;
}) {
  return (
    <article className="clase-fila">

      <div className="clase-fila-header">

        <div>
          <strong>
            {clase.nombre}
          </strong>

          <span>
            {clase.correctos}
            {" correctos · "}
            {clase.incorrectos}
            {" incorrectos · "}
            {clase.totalValidados}
            {" validados"}
          </span>
        </div>


        <strong className="clase-precision">
          {formatearNumero(
            clase.precision
          )} %
        </strong>

      </div>


      <div className="clase-track">
        <div
          className="clase-fill"
          style={{
            width:
              `${Math.min(
                clase.precision,
                100
              )}%`,
          }}
        />
      </div>

    </article>
  );
}


function formatearNumero(
  numero: number
) {
  return Number(
    numero ?? 0
  ).toLocaleString(
    "es-PE",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}