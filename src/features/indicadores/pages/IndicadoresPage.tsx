import { Link } from "react-router-dom";
import ErroresDetalle from "./ErroresDetalle";
import TiempoDetalle from "./TiempoDetalle";
import ExactitudDetalle from "./ExactitudDetalle";
import {
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  Clock3,
  RefreshCw,
  Target,
} from "lucide-react";

import {
  obtenerResumenIndicadores,
} from "../api/indicadoresApi";

import type {
  IndicadoresResumen,
} from "../types/indicadores.types";

import "./IndicadoresPage.css";


export default function IndicadoresPage() {
  const [verErrores, setVerErrores] = useState(false);
  const [verTiempo, setVerTiempo] = useState(false);
  const [verExactitud, setVerExactitud] = useState(false);
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


  if (verErrores) return <ErroresDetalle volver={() => { setVerErrores(false); void cargarIndicadores(true); }} />;

  if (verTiempo) return <TiempoDetalle volver={() => { setVerTiempo(false); void cargarIndicadores(true); }} />;

  if (verExactitud) return <ExactitudDetalle volver={() => { setVerExactitud(false); void cargarIndicadores(true); }} />;

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

        <Link className="indicadores-actualizar" to="/jornadas">Ver indicadores por jornadas</Link>
      </header>


      {/* =====================================================
          INDICADORES PRINCIPALES
      ===================================================== */}

      <section className="indicadores-principales">

        <IndicadorCard
          clase="indicador-precision"
          onClick={() => setVerExactitud(true)}
          icono={
            <Target size={25} />
          }
          numero={
            hayValidaciones
              ? `${formatearNumero(
                  resumen.porcentajeExactitud
                )} %`
              : "—"
          }
          titulo="Exactitud del diagnóstico"
          descripcion={
            hayValidaciones
              ? `${resumen.correctos} diagnósticos correctos de ${resumen.diagnosticosValidados} validados`
              : "Pendiente de validaciones del especialista"
          }
          objetivo="Incrementar la exactitud"
          tendencia="positiva"
        />


        <IndicadorCard
          clase="indicador-tiempo"
          onClick={() => setVerTiempo(true)}
          icono={<Clock3 size={25} />}
          numero={resumen.diagnosticosConTiempo > 0 ? resumen.tiempoPromedioSegundos.toLocaleString("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " s" : "—"}
          titulo="Tiempo promedio de diagnóstico"
          descripcion={resumen.diagnosticosConTiempo > 0 ? "Tiempo real por planta · " + resumen.diagnosticosConTiempo + " diagnósticos con tiempo" : "Aún no hay tiempos reales registrados"}
          objetivo="Disminuir el tiempo"
          tendencia="negativa"
        />


        <IndicadorCard
          clase="indicador-error"
          onClick={() => setVerErrores(true)}
          icono={
            <AlertTriangle size={25} />
          }
          numero={hayValidaciones ? resumen.numeroErrores.toLocaleString("es-PE") : "—"}
          titulo="Número de errores de diagnóstico"
          descripcion={hayValidaciones ? "Errores confirmados en " + resumen.diagnosticosValidados + " diagnósticos revisados" : "Pendiente de revisión del especialista"}
          objetivo="Disminuir los errores"
          tendencia="negativa"
        />

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
  onClick,
}: {
  clase: string;
  icono: React.ReactNode;
  numero: string;
  titulo: string;
  descripcion: string;
  objetivo: string;
  tendencia: "positiva" | "negativa";
  onClick?: () => void;
}) {
  return (
    <article
      className={`indicador-card ${clase}`}
    >
      {onClick && <button type="button" className="indicador-abrir" onClick={onClick} aria-label={"Ver detalle de " + titulo.toLowerCase()}><span>Ver detalle diario →</span></button>}

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