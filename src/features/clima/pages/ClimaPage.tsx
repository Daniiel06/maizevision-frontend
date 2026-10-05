import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CloudRain,
  CloudSun,
  Droplets,
  Leaf,
  MapPinned,
  RefreshCw,
  ShieldAlert,
  Sprout,
  Thermometer,
  TrendingUp,
  Wind,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import type { ReactNode } from "react";

import { motion } from "framer-motion";

import { obtenerFundos } from "../../fundos/api/fundosApi";

import { obtenerClimaFundo } from "../api/climaApi";

import type { Fundo } from "../../fundos/types/fundo.types";

import type { ClimaFundo, PronosticoDia } from "../types/clima.types";

import "./ClimaPage.css";

/* =========================================================
   TIPOS
========================================================= */

interface Toast {
  tipo: "error" | "exito" | "info";

  mensaje: string;
}

interface RiesgoPlaga {
  nombre: string;

  codigo: string;

  valor: number | null;

  nivel: "Bajo" | "Moderado" | "Alto" | "Muy alto" | "No evaluable";

  motivo: string;

  recomendacion: string;
}

interface ResumenPronostico {
  temperaturaPromedio: number | null;

  humedadPromedio: number | null;

  lluviaMaxima: number | null;

  precipitacionAcumulada: number | null;

  vientoMaximo: number | null;

  diasHumedo: number;

  diasLluvia: number;
}

/* =========================================================
   PÁGINA
========================================================= */

export default function ClimaPage() {
  const [fundos, setFundos] = useState<Fundo[]>([]);

  const [idFundo, setIdFundo] = useState("");

  const [dias, setDias] = useState<7 | 14>(7);

  const [clima, setClima] = useState<ClimaFundo | null>(null);

  const [cargando, setCargando] = useState(true);

  const [actualizando, setActualizando] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);

  /* =======================================================
     TOAST
  ======================================================= */

  const mostrarToast = (mensaje: string, tipo: Toast["tipo"]) => {
    setToast({
      mensaje,
      tipo,
    });
  };

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  /* =======================================================
     ERRORES
  ======================================================= */

  const obtenerMensajeError = (error: unknown) => {
    if (typeof error === "object" && error !== null && "response" in error) {
      const httpError = error as {
        response?: {
          status?: number;

          data?: {
            mensaje?: string;
          };
        };
      };

      if (httpError.response?.data?.mensaje) {
        return httpError.response.data.mensaje;
      }

      if (httpError.response?.status === 401) {
        return "La sesión no está autorizada para consultar el clima.";
      }

      if (httpError.response?.status === 404) {
        return "No se encontró el fundo solicitado.";
      }

      if (httpError.response?.status === 409) {
        return "El fundo todavía no tiene una ubicación configurada.";
      }

      if (httpError.response?.status === 503) {
        return "El servicio meteorológico no está disponible temporalmente.";
      }
    }

    return "No se pudo obtener la información meteorológica.";
  };

  /* =======================================================
     CARGAR CLIMA
  ======================================================= */

  const cargarClima = async (
    fundoId: string,
    cantidadDias: 7 | 14,
    mostrarExito = false,
  ) => {
    if (!fundoId) {
      return;
    }

    try {
      setActualizando(true);

      const data = await obtenerClimaFundo(fundoId, cantidadDias);

      setClima(data);

      if (mostrarExito) {
        mostrarToast("Información agroclimática actualizada.", "exito");
      }
    } catch (error) {
      console.error("Error obteniendo clima:", error);

      setClima(null);

      mostrarToast(obtenerMensajeError(error), "error");
    } finally {
      setActualizando(false);
    }
  };

  /* =======================================================
     INICIALIZAR
  ======================================================= */

  useEffect(() => {
    const inicializar = async () => {
      try {
        const data = await obtenerFundos();

        const activosConUbicacion = data.filter(
          (fundo) =>
            fundo.activo && fundo.latitud !== null && fundo.longitud !== null,
        );

        setFundos(activosConUbicacion);

        if (activosConUbicacion.length > 0) {
          const primero = activosConUbicacion[0];

          setIdFundo(primero.idFundo);

          await cargarClima(primero.idFundo, 7);
        } else {
          mostrarToast(
            "No existen fundos activos con ubicación configurada.",
            "info",
          );
        }
      } catch (error) {
        console.error(error);

        mostrarToast("No se pudieron cargar los fundos.", "error");
      } finally {
        setCargando(false);
      }
    };

    inicializar();
  }, []);

  /* =======================================================
     CAMBIO FUNDO
  ======================================================= */

  const handleCambiarFundo = async (nuevoId: string) => {
    setIdFundo(nuevoId);

    await cargarClima(nuevoId, dias);
  };

  /* =======================================================
     CAMBIO PERIODO
  ======================================================= */

  const handleCambiarDias = async (nuevosDias: 7 | 14) => {
    setDias(nuevosDias);

    if (idFundo) {
      await cargarClima(idFundo, nuevosDias);
    }
  };

  /* =======================================================
     RESUMEN PRONÓSTICO
  ======================================================= */

  const resumen = useMemo<ResumenPronostico>(
    () => calcularResumen(clima?.pronostico ?? []),
    [clima?.pronostico],
  );

  /* =======================================================
     RIESGOS CLIMÁTICOS
  ======================================================= */

  const riesgos = useMemo(
    () => calcularRiesgos(clima?.pronostico ?? []),
    [clima?.pronostico],
  );

  const riesgosEvaluables = riesgos.filter((riesgo) => riesgo.valor !== null);

  const riesgoMayor =
    riesgosEvaluables
      .slice()
      .sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0))[0] ?? null;

  const riesgoGeneral = riesgoMayor?.valor ?? 0;

  const recomendacionGeneral = obtenerRecomendacionGeneral(
    riesgoGeneral,
    riesgoMayor,
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (cargando) {
    return (
      <div className="clima-cargando">
        <CloudSun size={48} />

        <strong>Preparando análisis agroclimático...</strong>
      </div>
    );
  }

  return (
    <div className="clima-page">
      {toast && <ToastClima toast={toast} cerrar={() => setToast(null)} />}

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="clima-header">
        <div>
          <span className="clima-etiqueta">CENTRO AGROCLIMÁTICO</span>

          <h1>Clima y riesgo fitosanitario</h1>

          <p>
            Interpretación meteorológica para apoyar la vigilancia y toma de
            decisiones en el cultivo de maíz.
          </p>
        </div>

        <div className="clima-header-acciones">
          <select
            value={idFundo}
            onChange={(e) => handleCambiarFundo(e.target.value)}
            disabled={fundos.length === 0}
          >
            {fundos.length === 0 ? (
              <option value="">Sin fundos configurados</option>
            ) : (
              fundos.map((fundo) => (
                <option key={fundo.idFundo} value={fundo.idFundo}>
                  {fundo.nombre}
                </option>
              ))
            )}
          </select>

          <div className="clima-periodo-selector">
            <button
              type="button"
              className={dias === 7 ? "activo" : ""}
              onClick={() => handleCambiarDias(7)}
            >
              7 días
            </button>

            <button
              type="button"
              className={dias === 14 ? "activo" : ""}
              onClick={() => handleCambiarDias(14)}
            >
              14 días
            </button>
          </div>

          <button
            type="button"
            className="clima-actualizar"
            onClick={() => cargarClima(idFundo, dias, true)}
            disabled={!idFundo || actualizando}
          >
            <RefreshCw size={17} className={actualizando ? "girando" : ""} />
            Actualizar
          </button>
        </div>
      </header>

      {!clima ? (
        <section className="clima-sin-datos">
          <CloudSun size={50} />

          <h2>Información agroclimática no disponible</h2>

          <p>
            Comprueba que el fundo tenga una ubicación geográfica configurada y
            vuelve a intentar.
          </p>
        </section>
      ) : (
        <>
          {/* =================================================
              FUNDO
          ================================================= */}

          <section className="clima-fundo-bar">
            <div className="clima-fundo-info">
              <MapPinned size={19} />

              <div>
                <strong>{clima.fundo}</strong>

                <span>{clima.ubicacion ?? "Ubicación configurada"}</span>
              </div>
            </div>

            <div className="clima-fundo-fuente">
              <span>Fuente meteorológica</span>

              <strong>{clima.fuente}</strong>
            </div>
          </section>

          {/* =================================================
              INDICADORES PRINCIPALES
          ================================================= */}

          <section className="clima-kpis">
            <TarjetaKpi
              icono={<Thermometer size={22} />}
              titulo="Temperatura actual"
              valor={`${formatearNumero(clima.actual.temperaturaC)} °C`}
              detalle={clima.actual.descripcionClima}
              tipo="temperatura"
            />

            <TarjetaKpi
              icono={<Droplets size={22} />}
              titulo="Humedad actual"
              valor={`${formatearNumero(clima.actual.humedadRelativa, 0)} %`}
              detalle={`Promedio próximos ${dias} días: ${formatearNumero(
                resumen.humedadPromedio,
                0,
              )}%`}
              tipo="humedad"
            />

            <TarjetaKpi
              icono={<CloudRain size={22} />}
              titulo="Mayor prob. de lluvia"
              valor={`${formatearNumero(resumen.lluviaMaxima, 0)} %`}
              detalle={`${resumen.diasLluvia} día(s) con señal de precipitación`}
              tipo="lluvia"
            />

            <TarjetaKpi
              icono={<ShieldAlert size={22} />}
              titulo="Mayor compatibilidad"
              valor={`${Math.round(riesgoGeneral)}%`}
              detalle={riesgoMayor ? riesgoMayor.nombre : "Sin análisis"}
              tipo={riesgoGeneral >= 70 ? "riesgo" : "normal"}
            />
          </section>

          {/* =================================================
              DECISIÓN PRINCIPAL
          ================================================= */}

          <section className="clima-decision">
            <div className="decision-icono">
              <Activity size={28} />
            </div>

            <div className="decision-contenido">
              <span>INTERPRETACIÓN DEL SISTEMA</span>

              <h2>{recomendacionGeneral.titulo}</h2>

              <p>{recomendacionGeneral.descripcion}</p>
            </div>

            <div
              className={`decision-nivel decision-${obtenerClaseNivel(
                riesgoGeneral,
              )}`}
            >
              <small>Nivel climático</small>

              <strong>{obtenerNombreNivel(riesgoGeneral)}</strong>
            </div>
          </section>

          {/* =================================================
              GRID PRINCIPAL
          ================================================= */}

          <section className="clima-dashboard-grid">
            {/* ===============================================
                GRÁFICO PRINCIPAL
            =============================================== */}

            <div className="clima-panel clima-panel-grafico">
              <div className="clima-panel-header">
                <div>
                  <span>PRONÓSTICO AGROCLIMÁTICO</span>

                  <h2>Comportamiento de los próximos {dias} días</h2>

                  <p>
                    Temperatura, humedad y precipitación esperada en el fundo.
                  </p>
                </div>

                <TrendingUp size={23} />
              </div>

              <GraficoPrincipal datos={clima.pronostico} />
            </div>

            {/* ===============================================
                BARRAS FITOSANITARIAS
            =============================================== */}

            <div className="clima-panel clima-panel-riesgo">
              <div className="clima-panel-header">
                <div>
                  <span>VIGILANCIA FITOSANITARIA</span>

                  <h2>Compatibilidad climática</h2>

                  <p>
                    Qué tan favorables son las condiciones ambientales para cada
                    problema.
                  </p>
                </div>

                <Sprout size={23} />
              </div>

              <div className="riesgos-lista">
                {riesgos.map((riesgo) => (
                  <BarraRiesgo key={riesgo.codigo} riesgo={riesgo} />
                ))}
              </div>

              <div className="riesgo-aclaracion">
                <AlertTriangle size={16} />

                <span>
                  Este índice representa compatibilidad climática, no confirma
                  presencia de plaga ni reemplaza el diagnóstico mediante
                  imagen.
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              PRONÓSTICO DIARIO
          ================================================= */}

          <section className="clima-panel clima-pronostico-panel">
            <div className="clima-panel-header">
              <div>
                <span>EVOLUCIÓN DIARIA</span>

                <h2>Ventana de vigilancia</h2>

                <p>Condiciones previstas día por día.</p>
              </div>

              <CalendarDays size={22} />
            </div>

            <div className="pronostico-scroll">
              <div className="pronostico-dias">
                {clima.pronostico.map((dia) => (
                  <DiaClima key={dia.fecha} dia={dia} />
                ))}
              </div>
            </div>
          </section>

          {/* =================================================
              INDICADORES SECUNDARIOS
          ================================================= */}

          <section className="clima-resumen-grid">
            <ResumenCard
              icono={<Droplets size={19} />}
              titulo="Humedad prevista"
              valor={`${formatearNumero(resumen.humedadPromedio, 0)}%`}
              descripcion={`${resumen.diasHumedo} día(s) presentan humedad media elevada.`}
            />

            <ResumenCard
              icono={<CloudRain size={19} />}
              titulo="Precipitación acumulada"
              valor={`${formatearNumero(resumen.precipitacionAcumulada)} mm`}
              descripcion={`Pronóstico acumulado para ${dias} días.`}
            />

            <ResumenCard
              icono={<Thermometer size={19} />}
              titulo="Temperatura media"
              valor={`${formatearNumero(resumen.temperaturaPromedio)} °C`}
              descripcion="Promedio aproximado del periodo evaluado."
            />

            <ResumenCard
              icono={<Wind size={19} />}
              titulo="Viento máximo"
              valor={`${formatearNumero(resumen.vientoMaximo)} km/h`}
              descripcion="Máxima velocidad diaria prevista."
            />
          </section>

          {/* =================================================
              RECOMENDACIONES
          ================================================= */}

          <section className="clima-panel recomendaciones-panel">
            <div className="clima-panel-header">
              <div>
                <span>APOYO A LA DECISIÓN</span>

                <h2>Recomendaciones de vigilancia</h2>

                <p>Acciones sugeridas a partir del pronóstico climático.</p>
              </div>

              <Leaf size={23} />
            </div>

            <div className="recomendaciones-grid">
              {generarRecomendaciones(riesgos).map((recomendacion, indice) => (
                <div
                  className="recomendacion-item"
                  key={`${indice}-${recomendacion}`}
                >
                  <div className="recomendacion-numero">{indice + 1}</div>

                  <p>{recomendacion}</p>
                </div>
              ))}
            </div>
          </section>

          {/* =================================================
              NOTA CIENTÍFICA
          ================================================= */}

          <section className="clima-nota">
            <CheckCircle2 size={18} />

            <div>
              <strong>Interpretación preventiva</strong>

              <p>
                Las condiciones meteorológicas pueden favorecer el desarrollo de
                determinadas enfermedades, pero la presencia real depende
                también del patógeno, el estado del cultivo, la susceptibilidad
                de la variedad y otros factores agronómicos.
              </p>
            </div>
          </section>

          <footer className="clima-footer">
            <span>
              Fuente meteorológica: <strong>{clima.fuente}</strong>
            </span>

            {clima.zonaHoraria && (
              <span>Zona horaria: {clima.zonaHoraria}</span>
            )}
          </footer>
        </>
      )}
    </div>
  );
}

/* =========================================================
   TARJETA KPI
========================================================= */

function TarjetaKpi({
  icono,
  titulo,
  valor,
  detalle,
  tipo,
}: {
  icono: ReactNode;
  titulo: string;
  valor: string;
  detalle: string;
  tipo: string;
}) {
  return (
    <article className={`clima-kpi clima-kpi-${tipo}`}>
      <div className="kpi-superior">
        <div className="kpi-icono">{icono}</div>

        <span>{titulo}</span>
      </div>

      <strong className="kpi-valor">{valor}</strong>

      <p>{detalle}</p>
    </article>
  );
}

/* =========================================================
   RESUMEN
========================================================= */

function ResumenCard({
  icono,
  titulo,
  valor,
  descripcion,
}: {
  icono: ReactNode;
  titulo: string;
  valor: string;
  descripcion: string;
}) {
  return (
    <article className="resumen-card">
      <div className="resumen-icono">{icono}</div>

      <div>
        <span>{titulo}</span>

        <strong>{valor}</strong>

        <p>{descripcion}</p>
      </div>
    </article>
  );
}

/* =========================================================
   BARRA RIESGO
========================================================= */

function BarraRiesgo({ riesgo }: { riesgo: RiesgoPlaga }) {
  const clase =
    riesgo.valor === null ? "no-evaluable" : obtenerClaseNivel(riesgo.valor);

  return (
    <article className="riesgo-item">
      <div className="riesgo-cabecera">
        <div>
          <strong>{riesgo.nombre}</strong>

          <span>{riesgo.motivo}</span>
        </div>

        <div className={`riesgo-nivel riesgo-nivel-${clase}`}>
          {riesgo.valor === null ? "N/D" : `${Math.round(riesgo.valor)}%`}
        </div>
      </div>

      <div className="riesgo-barra-fondo">
        {riesgo.valor !== null && (
          <motion.div
            className={`riesgo-barra riesgo-barra-${clase}`}
            initial={{
              width: 0,
            }}
            animate={{
              width: `${Math.max(3, riesgo.valor)}%`,
            }}
            transition={{
              duration: 0.9,
              ease: "easeOut",
            }}
          />
        )}
      </div>

      <div className="riesgo-pie">
        <span>{riesgo.nivel}</span>

        <small>{riesgo.recomendacion}</small>
      </div>
    </article>
  );
}

/* =========================================================
   DÍA DE CLIMA
========================================================= */

function DiaClima({ dia }: { dia: PronosticoDia }) {
  const fecha = new Date(`${dia.fecha}T12:00:00`);

  const probLluvia = dia.probabilidadPrecipitacion ?? 0;

  return (
    <article className="pronostico-dia">
      <div className="dia-fecha">
        <strong>
          {fecha.toLocaleDateString("es-PE", {
            weekday: "short",
          })}
        </strong>

        <span>
          {fecha.toLocaleDateString("es-PE", {
            day: "2-digit",

            month: "short",
          })}
        </span>
      </div>

      <div className="dia-icono">
        {probLluvia >= 50 ? <CloudRain size={28} /> : <CloudSun size={28} />}
      </div>

      <p className="dia-descripcion">{dia.descripcionClima}</p>

      <div className="dia-temperatura">
        <strong>{formatearNumero(dia.temperaturaMaxC)}°</strong>

        <span>{formatearNumero(dia.temperaturaMinC)}°</span>
      </div>

      <div className="dia-dato">
        <Droplets size={13} />

        <span>{formatearNumero(dia.humedadPromedio, 0)}%</span>
      </div>

      <div className="dia-dato">
        <CloudRain size={13} />

        <span>{formatearNumero(dia.probabilidadPrecipitacion, 0)}%</span>
      </div>
    </article>
  );
}

/* =========================================================
   GRÁFICO PRINCIPAL
========================================================= */

function GraficoPrincipal({ datos }: { datos: PronosticoDia[] }) {
  if (datos.length === 0) {
    return null;
  }

  const ancho = 900;

  const alto = 300;

  const paddingX = 30;

  const paddingY = 35;

  const temperaturas = datos.flatMap((dia) => [
    dia.temperaturaMaxC ?? 0,

    dia.temperaturaMinC ?? 0,
  ]);

  const minTemp = Math.min(...temperaturas);

  const maxTemp = Math.max(...temperaturas);

  const rangoTemp = Math.max(maxTemp - minTemp, 1);

  const obtenerX = (indice: number) => {
    if (datos.length === 1) {
      return ancho / 2;
    }

    return paddingX + (indice / (datos.length - 1)) * (ancho - paddingX * 2);
  };

  const obtenerYTemperatura = (valor: number) => {
    return (
      alto - paddingY - ((valor - minTemp) / rangoTemp) * (alto - paddingY * 2)
    );
  };

  const puntosMax = datos
    .map(
      (dia, indice) =>
        `${obtenerX(indice)},${obtenerYTemperatura(
          dia.temperaturaMaxC ?? minTemp,
        )}`,
    )
    .join(" ");

  const puntosMin = datos
    .map(
      (dia, indice) =>
        `${obtenerX(indice)},${obtenerYTemperatura(
          dia.temperaturaMinC ?? minTemp,
        )}`,
    )
    .join(" ");

  return (
    <div className="grafico-principal">
      <div className="grafico-leyenda-superior">
        <span>
          <i className="leyenda-max" />
          Temp. máxima
        </span>

        <span>
          <i className="leyenda-min" />
          Temp. mínima
        </span>

        <span>
          <i className="leyenda-humedad" />
          Humedad
        </span>
      </div>

      <div className="grafico-area">
        <svg
          viewBox={`0 0 ${ancho} ${alto}`}
          preserveAspectRatio="none"
          role="img"
        >
          {[0.25, 0.5, 0.75].map((valor) => (
            <line
              key={valor}
              x1={paddingX}
              x2={ancho - paddingX}
              y1={alto * valor}
              y2={alto * valor}
              className="grafico-guia"
            />
          ))}

          {datos.map((dia, indice) => {
            const humedad = dia.humedadPromedio ?? 0;

            const altura = (humedad / 100) * (alto - paddingY * 2);

            const x = obtenerX(indice);

            const y = alto - paddingY - altura;

            return (
              <g key={`hum-${dia.fecha}`}>
                <rect
                  x={x - 11}
                  y={y}
                  width="22"
                  height={altura}
                  rx="6"
                  className="grafico-humedad-barra"
                />

                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  className="grafico-humedad-label"
                >
                  {formatearNumero(dia.humedadPromedio, 0)}%
                </text>
              </g>
            );
          })}

          <polyline points={puntosMax} className="grafico-linea-max" />

          <polyline points={puntosMin} className="grafico-linea-min" />

          {datos.map((dia, indice) => {
            const x = obtenerX(indice);

            const y = obtenerYTemperatura(dia.temperaturaMaxC ?? minTemp);

            return (
              <g key={`max-${dia.fecha}`}>
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  className="grafico-temp-max-label"
                >
                  {formatearNumero(dia.temperaturaMaxC)}°
                </text>

                <circle cx={x} cy={y} r="5" className="grafico-punto-max" />
              </g>
            );
          })}

          {datos.map((dia, indice) => {
            const x = obtenerX(indice);

            const y = obtenerYTemperatura(dia.temperaturaMinC ?? minTemp);

            return (
              <g key={`min-${dia.fecha}`}>
                <text
                  x={x}
                  y={y + 22}
                  textAnchor="middle"
                  className="grafico-temp-min-label"
                >
                  {formatearNumero(dia.temperaturaMinC)}°
                </text>

                <circle cx={x} cy={y} r="5" className="grafico-punto-min" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grafico-fechas">
        {datos.map((dia) => (
          <span key={dia.fecha}>{formatearFechaCorta(dia.fecha)}</span>
        ))}
      </div>

      <div className="grafico-lluvia-row">
        {datos.map((dia) => (
          <div key={`rain-${dia.fecha}`}>
            <CloudRain size={12} />

            <span>{formatearNumero(dia.probabilidadPrecipitacion, 0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   TOAST
========================================================= */

function ToastClima({
  toast,
  cerrar,
}: {
  toast: Toast;

  cerrar: () => void;
}) {
  return (
    <motion.div
      className={`clima-toast clima-toast-${toast.tipo}`}
      initial={{
        opacity: 0,
        y: -20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
    >
      <div>
        {toast.tipo === "exito" ? (
          <CheckCircle2 size={19} />
        ) : toast.tipo === "error" ? (
          <AlertTriangle size={19} />
        ) : (
          <CloudSun size={19} />
        )}

        <span>{toast.mensaje}</span>
      </div>

      <button type="button" onClick={cerrar}>
        <X size={16} />
      </button>
    </motion.div>
  );
}

/* =========================================================
   CÁLCULO DE RESUMEN
========================================================= */

function calcularResumen(datos: PronosticoDia[]): ResumenPronostico {
  if (datos.length === 0) {
    return {
      temperaturaPromedio: null,

      humedadPromedio: null,

      lluviaMaxima: null,

      precipitacionAcumulada: null,

      vientoMaximo: null,

      diasHumedo: 0,

      diasLluvia: 0,
    };
  }

  const temperaturas = datos
    .flatMap((dia) => [dia.temperaturaMaxC, dia.temperaturaMinC])
    .filter((valor): valor is number => valor !== null);

  const humedades = datos
    .map((dia) => dia.humedadPromedio)
    .filter((valor): valor is number => valor !== null);

  const lluvias = datos
    .map((dia) => dia.probabilidadPrecipitacion)
    .filter((valor): valor is number => valor !== null);

  const precipitaciones = datos
    .map((dia) => dia.precipitacionMm)
    .filter((valor): valor is number => valor !== null);

  const vientos = datos
    .map((dia) => dia.vientoMaxKmh)
    .filter((valor): valor is number => valor !== null);

  return {
    temperaturaPromedio: promedio(temperaturas),

    humedadPromedio: promedio(humedades),

    lluviaMaxima: lluvias.length > 0 ? Math.max(...lluvias) : null,

    precipitacionAcumulada:
      precipitaciones.length > 0
        ? precipitaciones.reduce((suma, valor) => suma + valor, 0)
        : null,

    vientoMaximo: vientos.length > 0 ? Math.max(...vientos) : null,

    diasHumedo: datos.filter((dia) => (dia.humedadPromedio ?? 0) >= 80).length,

    diasLluvia: datos.filter(
      (dia) =>
        (dia.probabilidadPrecipitacion ?? 0) >= 40 ||
        (dia.precipitacionMm ?? 0) > 0,
    ).length,
  };
}

/* =========================================================
   COMPATIBILIDAD CLIMÁTICA

   IMPORTANTE:
   No representa probabilidad real de enfermedad.
   Es un índice orientativo para la interfaz.
========================================================= */

function calcularRiesgos(datos: PronosticoDia[]): RiesgoPlaga[] {
  if (datos.length === 0) {
    return [];
  }

  const resumen = calcularResumen(datos);

  const temperatura = resumen.temperaturaPromedio ?? 0;

  const humedad = resumen.humedadPromedio ?? 0;

  const lluvia = resumen.lluviaMaxima ?? 0;

  const diasHumedo = resumen.diasHumedo;

  /*
   * ROYA
   *
   * Condiciones frescas/moderadas
   * + humedad elevada.
   */
  const roya = limitar100(
    puntuarRango(temperatura, 16, 24, 40) +
      puntuarMinimo(humedad, 80, 35) +
      puntuarMinimo(diasHumedo, 2, 15) +
      puntuarMinimo(lluvia, 30, 10),
  );

  /*
   * MANCHA GRIS
   *
   * Condiciones cálidas
   * + humedad elevada.
   */
  const manchaGris = limitar100(
    puntuarRango(temperatura, 21, 32, 35) +
      puntuarMinimo(humedad, 80, 40) +
      puntuarMinimo(diasHumedo, 2, 15) +
      puntuarMinimo(lluvia, 30, 10),
  );

  /*
   * TIZÓN FOLIAR
   *
   * Temperaturas moderadas
   * + humedad prolongada.
   */
  const tizon = limitar100(
    puntuarRango(temperatura, 18, 27, 40) +
      puntuarMinimo(humedad, 78, 35) +
      puntuarMinimo(diasHumedo, 2, 15) +
      puntuarMinimo(lluvia, 30, 10),
  );

  /*
   * MANCHA DE ASFALTO
   *
   * Condiciones relativamente frescas
   * + humedad.
   */
  const asfalto = limitar100(
    puntuarRango(temperatura, 15, 23, 40) +
      puntuarMinimo(humedad, 80, 35) +
      puntuarMinimo(diasHumedo, 2, 15) +
      puntuarMinimo(lluvia, 30, 10),
  );

  /*
   * COGOLLERO
   *
   * Índice climático orientativo.
   * Se pondera temperatura cálida.
   *
   * Después podemos reemplazarlo
   * por un modelo específico de
   * actividad del insecto.
   */
  const cogollero = limitar100(
    puntuarRango(temperatura, 20, 30, 55) +
      puntuarRango(humedad, 50, 80, 20) +
      (lluvia < 60 ? 15 : 5) +
      (temperatura >= 24 ? 10 : 0),
  );

  return [
    crearRiesgo(
      "Roya común",
      "COMMON_RUST",
      roya,
      "Temperatura fresca y humedad elevada favorecen su desarrollo.",
      "Priorizar inspección de hojas cuando aumente la humedad.",
    ),

    crearRiesgo(
      "Mancha gris foliar",
      "GRAY_LEAF_SPOT",
      manchaGris,
      "El ambiente cálido y húmedo puede aumentar las condiciones favorables.",
      "Vigilar hojas inferiores y zonas con mayor humedad.",
    ),

    crearRiesgo(
      "Tizón foliar",
      "LEAF_BLIGHT",
      tizon,
      "Temperatura moderada y humedad prolongada elevan la vigilancia.",
      "Incrementar revisión visual durante periodos húmedos.",
    ),

    crearRiesgo(
      "Mancha de asfalto",
      "TAR_SPOT",
      asfalto,
      "Los periodos frescos y húmedos son ambientalmente favorables.",
      "Observar hojas durante periodos húmedos continuos.",
    ),

    crearRiesgo(
      "Gusano cogollero",
      "FALL_ARMYWORM",
      cogollero,
      "La temperatura influye en la actividad y desarrollo del insecto.",
      "Inspeccionar cogollos y plantas jóvenes de forma periódica.",
    ),

    {
      nombre: "Necrosis letal del maíz",

      codigo: "LETHAL_NECROSIS",

      valor: null,

      nivel: "No evaluable",

      motivo: "No debe estimarse únicamente a partir del clima.",

      recomendacion:
        "Mantener vigilancia mediante síntomas y diagnóstico por imagen.",
    },
  ];
}

/* =========================================================
   CONSTRUCCIÓN RIESGO
========================================================= */

function crearRiesgo(
  nombre: string,
  codigo: string,
  valor: number,
  motivo: string,
  recomendacion: string,
): RiesgoPlaga {
  return {
    nombre,

    codigo,

    valor,

    nivel: obtenerNombreNivel(valor),

    motivo,

    recomendacion,
  };
}

/* =========================================================
   FUNCIONES DE PUNTUACIÓN
========================================================= */

function puntuarRango(
  valor: number,
  minimo: number,
  maximo: number,
  puntos: number,
) {
  if (valor >= minimo && valor <= maximo) {
    return puntos;
  }

  const margen = 5;

  if (valor >= minimo - margen && valor <= maximo + margen) {
    return puntos * 0.5;
  }

  return 0;
}

function puntuarMinimo(valor: number, minimo: number, puntos: number) {
  if (valor >= minimo) {
    return puntos;
  }

  if (valor >= minimo * 0.85) {
    return puntos * 0.5;
  }

  return 0;
}

function limitar100(valor: number) {
  return Math.min(100, Math.max(0, valor));
}

/* =========================================================
   NIVEL
========================================================= */

function obtenerNombreNivel(
  valor: number,
): "Bajo" | "Moderado" | "Alto" | "Muy alto" {
  if (valor >= 80) {
    return "Muy alto";
  }

  if (valor >= 60) {
    return "Alto";
  }

  if (valor >= 35) {
    return "Moderado";
  }

  return "Bajo";
}

function obtenerClaseNivel(valor: number) {
  if (valor >= 80) {
    return "muy-alto";
  }

  if (valor >= 60) {
    return "alto";
  }

  if (valor >= 35) {
    return "moderado";
  }

  return "bajo";
}

/* =========================================================
   RECOMENDACIÓN GENERAL
========================================================= */

function obtenerRecomendacionGeneral(
  valor: number,
  riesgo: RiesgoPlaga | null,
) {
  if (!riesgo) {
    return {
      titulo: "Sin información suficiente",

      descripcion:
        "No existen datos suficientes para interpretar las condiciones climáticas.",
    };
  }

  if (valor >= 80) {
    return {
      titulo: "Priorizar vigilancia del cultivo",

      descripcion: `Las condiciones meteorológicas presentan una compatibilidad elevada para ${riesgo.nombre}. Conviene incrementar la frecuencia de inspección visual de las plantas.`,
    };
  }

  if (valor >= 60) {
    return {
      titulo: "Incrementar monitoreo preventivo",

      descripcion: `El pronóstico presenta condiciones favorables para ${riesgo.nombre}. Se recomienda mantener vigilancia especialmente durante los días de mayor humedad.`,
    };
  }

  if (valor >= 35) {
    return {
      titulo: "Mantener vigilancia preventiva",

      descripcion: `Existen algunas condiciones compatibles con ${riesgo.nombre}, aunque el escenario climático no es completamente favorable.`,
    };
  }

  return {
    titulo: "Condiciones climáticas de baja alerta",

    descripcion:
      "El pronóstico actual no muestra una compatibilidad climática elevada para las principales enfermedades evaluadas. Se recomienda continuar con el monitoreo habitual.",
  };
}

/* =========================================================
   RECOMENDACIONES
========================================================= */

function generarRecomendaciones(riesgos: RiesgoPlaga[]) {
  const evaluables = riesgos
    .filter((riesgo) => riesgo.valor !== null)
    .sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));

  const principales = evaluables
    .filter((riesgo) => (riesgo.valor ?? 0) >= 35)
    .slice(0, 3);

  if (principales.length === 0) {
    return [
      "Mantener el monitoreo rutinario del cultivo.",
      "Continuar registrando diagnósticos mediante imágenes cuando se observen síntomas.",
      "Revisar nuevamente el pronóstico ante cambios importantes de humedad o precipitación.",
    ];
  }

  return [
    ...principales.map((riesgo) => `${riesgo.nombre}: ${riesgo.recomendacion}`),

    "Las alertas climáticas deben complementarse con inspección visual y diagnóstico mediante el modelo de visión artificial.",
  ];
}

/* =========================================================
   HELPERS
========================================================= */

function promedio(valores: number[]) {
  if (valores.length === 0) {
    return null;
  }

  return valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
}

function formatearNumero(valor: number | null, decimales = 1) {
  if (valor === null || Number.isNaN(valor)) {
    return "--";
  }

  return valor.toFixed(decimales);
}

function formatearFechaCorta(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-PE", {
    weekday: "short",

    day: "2-digit",
  });
}
