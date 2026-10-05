import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  History,
  Leaf,
  MapPinned,
  RotateCcw,
  Rows3,
  Search,
  User,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { motion } from "framer-motion";

import {
  obtenerHistorialPlanta,
  obtenerMapaLote,
  obtenerUltimaInspeccionPlanta,
} from "../api/mapaApi";

import {
  iniciarInspeccion,
  obtenerClasesDiagnostico,
  validarDiagnostico,
} from "../../inspecciones/api/inspeccionesApi";

import type {
  ClaseDiagnosticoResponse,
} from "../../inspecciones/api/inspeccionesApi";

import type {
  LoteMapa,
  PlantaMapa,
} from "../types/mapa.types";

import type {
  HistorialDiagnostico,
  HistorialPlanta,
  UltimaInspeccionPlanta,
} from "../api/mapaApi";

import "./MapaLotePage.css";


type TipoToast =
  | "error"
  | "exito"
  | "info";


interface Toast {
  tipo: TipoToast;
  mensaje: string;
}

interface ImagenAmpliada {
  url: string;
  nombre: string;
}

const FILAS_POR_PAGINA = 8;


export default function MapaLotePage() {
  const { idLote } =
    useParams();

  const navigate =
    useNavigate();


  const [
    lote,
    setLote,
  ] = useState<LoteMapa | null>(
    null
  );


  const [
    plantaSeleccionada,
    setPlantaSeleccionada,
  ] = useState<PlantaMapa | null>(
    null
  );


  const [
    historial,
    setHistorial,
  ] = useState<HistorialPlanta | null>(
    null
  );


  const [
    ultimaInspeccion,
    setUltimaInspeccion,
  ] =
    useState<UltimaInspeccionPlanta | null>(
      null
    );


  const [
    cargando,
    setCargando,
  ] = useState(true);


  const [
    iniciandoInspeccion,
    setIniciandoInspeccion,
  ] = useState(false);


  const [
    cargandoHistorial,
    setCargandoHistorial,
  ] = useState(false);


  const [
    cargandoUltimaInspeccion,
    setCargandoUltimaInspeccion,
  ] = useState(false);


  const [
    mostrandoHistorial,
    setMostrandoHistorial,
  ] = useState(false);


  const [
    busquedaPlanta,
    setBusquedaPlanta,
  ] = useState("");


  const [
    filaSeleccionada,
    setFilaSeleccionada,
  ] = useState<number | null>(
    null
  );


  const [
    paginaFilas,
    setPaginaFilas,
  ] = useState(0);


  const [
    toast,
    setToast,
  ] = useState<Toast | null>(
    null
  );

  const [
    clasesDiagnostico,
    setClasesDiagnostico,
  ] = useState<ClaseDiagnosticoResponse[]>([]);

  const [
    cargandoClases,
    setCargandoClases,
  ] = useState(false);

  const [
    diagnosticoIncorrectoId,
    setDiagnosticoIncorrectoId,
  ] = useState<string | null>(null);

  const [
    claseRealSeleccionada,
    setClaseRealSeleccionada,
  ] = useState("");

  const [
    diagnosticoValidandoId,
    setDiagnosticoValidandoId,
  ] = useState<string | null>(null);

  const [
    imagenAmpliada,
    setImagenAmpliada,
  ] = useState<ImagenAmpliada | null>(null);

  const [
    zoomImagen,
    setZoomImagen,
  ] = useState(1);


  /*
   * =====================================================
   * NOTIFICACIONES FLOTANTES
   * =====================================================
   */

  const mostrarToast = (
    mensaje: string,
    tipo: TipoToast = "info"
  ) => {
    setToast({
      mensaje,
      tipo,
    });
  };


  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setToast(null);
        },
        4000
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [toast]);


  /*
   * =====================================================
   * CARGAR MAPA
   * =====================================================
   */

  useEffect(() => {
    const cargarMapa =
      async () => {
        if (!idLote) {
          mostrarToast(
            "No se recibió el identificador del lote.",
            "error"
          );

          setCargando(false);

          return;
        }

        try {
          const data =
            await obtenerMapaLote(
              idLote
            );

          setLote(
            data
          );
        } catch (error) {
          console.error(
            "Error cargando mapa:",
            error
          );

          mostrarToast(
            "No se pudo cargar el mapa del lote.",
            "error"
          );
        } finally {
          setCargando(
            false
          );
        }
      };

    cargarMapa();
  }, [idLote]);


  /*
   * =====================================================
   * SELECCIONAR PLANTA
   * =====================================================
   */

  const handleSeleccionarPlanta =
    async (
      planta: PlantaMapa
    ) => {
      setPlantaSeleccionada(
        planta
      );

      setHistorial(
        null
      );

      setMostrandoHistorial(
        false
      );

      setUltimaInspeccion(
        null
      );


      if (
        planta.estadoInspeccion ===
          "SIN_INSPECCION" ||
        planta.estadoInspeccion ===
          "PENDIENTE_DIAGNOSTICO"
      ) {
        return;
      }


      try {
        setCargandoUltimaInspeccion(
          true
        );

        const data =
          await obtenerUltimaInspeccionPlanta(
            planta.idPlanta
          );

        setUltimaInspeccion(
          data
        );
      } catch (error) {
        console.error(
          "Error cargando última inspección:",
          error
        );

        mostrarToast(
          "No se pudo cargar la última inspección.",
          "error"
        );
      } finally {
        setCargandoUltimaInspeccion(
          false
        );
      }
    };


  /*
   * =====================================================
   * INICIAR INSPECCIÓN
   * =====================================================
   */

  const handleIniciarInspeccion =
    async () => {
      if (!plantaSeleccionada) {
        return;
      }

      try {
        setIniciandoInspeccion(
          true
        );

        const inspeccion =
          await iniciarInspeccion({
            idPlanta:
              plantaSeleccionada
                .idPlanta,

            observaciones:
              "Inspección iniciada desde el mapa",
          });

        navigate(
          `/inspecciones/${inspeccion.idInspeccion}`
        );
      } catch (error) {
        console.error(
          "Error iniciando inspección:",
          error
        );

        mostrarToast(
          "No se pudo iniciar la inspección.",
          "error"
        );
      } finally {
        setIniciandoInspeccion(
          false
        );
      }
    };


  /*
   * =====================================================
   * HISTORIAL
   * =====================================================
   */

  const handleVerHistorial =
    async () => {
      if (!plantaSeleccionada) {
        return;
      }

      try {
        setCargandoHistorial(
          true
        );

        const data =
          await obtenerHistorialPlanta(
            plantaSeleccionada
              .idPlanta
          );

        setHistorial(
          data
        );

        setMostrandoHistorial(
          true
        );

        if (clasesDiagnostico.length === 0) {
          try {
            setCargandoClases(true);

            const clases =
              await obtenerClasesDiagnostico();

            setClasesDiagnostico(clases);
          } catch (error) {
            console.error(
              "Error cargando clases diagnósticas:",
              error
            );
          } finally {
            setCargandoClases(false);
          }
        }
      } catch (error) {
        console.error(
          "Error cargando historial:",
          error
        );

        mostrarToast(
          "No se pudo cargar el historial de la planta.",
          "error"
        );
      } finally {
        setCargandoHistorial(
          false
        );
      }
    };


  const recargarHistorial =
    async () => {
      if (!plantaSeleccionada) {
        return;
      }

      const data =
        await obtenerHistorialPlanta(
          plantaSeleccionada.idPlanta
        );

      setHistorial(data);
    };


  const handleValidarCorrecto =
    async (
      diagnostico: HistorialDiagnostico
    ) => {
      try {
        setDiagnosticoValidandoId(
          diagnostico.idDiagnostico
        );

        await validarDiagnostico(
          diagnostico.idDiagnostico,
          {
            idClaseReal:
              diagnostico.idClasePredicha,
          }
        );

        await recargarHistorial();

        setDiagnosticoIncorrectoId(null);
        setClaseRealSeleccionada("");

        mostrarToast(
          "Validación guardada como correcta.",
          "exito"
        );
      } catch (error) {
        console.error(
          "Error validando diagnóstico:",
          error
        );

        mostrarToast(
          "No se pudo guardar la validación.",
          "error"
        );
      } finally {
        setDiagnosticoValidandoId(null);
      }
    };


  const handleMarcarIncorrecto = (
    idDiagnostico: string
  ) => {
    setDiagnosticoIncorrectoId(
      idDiagnostico
    );

    setClaseRealSeleccionada("");
  };


  const handleGuardarIncorrecto =
    async (
      diagnostico: HistorialDiagnostico
    ) => {
      if (!claseRealSeleccionada) {
        mostrarToast(
          "Selecciona la identificación correcta.",
          "info"
        );

        return;
      }

      if (
        claseRealSeleccionada ===
        diagnostico.idClasePredicha
      ) {
        mostrarToast(
          "Para marcarlo como incorrecto, selecciona una clase diferente a la predicción de la IA.",
          "info"
        );

        return;
      }

      try {
        setDiagnosticoValidandoId(
          diagnostico.idDiagnostico
        );

        await validarDiagnostico(
          diagnostico.idDiagnostico,
          {
            idClaseReal:
              claseRealSeleccionada,
          }
        );

        await recargarHistorial();

        setDiagnosticoIncorrectoId(null);
        setClaseRealSeleccionada("");

        mostrarToast(
          "Validación guardada como incorrecta.",
          "exito"
        );
      } catch (error) {
        console.error(
          "Error guardando validación incorrecta:",
          error
        );

        mostrarToast(
          "No se pudo guardar la validación.",
          "error"
        );
      } finally {
        setDiagnosticoValidandoId(null);
      }
    };


  const abrirImagen = (
    url: string,
    nombre: string
  ) => {
    setImagenAmpliada({
      url,
      nombre,
    });

    setZoomImagen(1);
  };


  const cerrarImagen = () => {
    setImagenAmpliada(null);
    setZoomImagen(1);
  };


  const aumentarZoom = () => {
    setZoomImagen(
      actual =>
        Math.min(3, actual + 0.25)
    );
  };


  const disminuirZoom = () => {
    setZoomImagen(
      actual =>
        Math.max(0.5, actual - 0.25)
    );
  };


  /*
   * =====================================================
   * ESTADOS
   * =====================================================
   */

  const obtenerTextoEstado = (
    planta: PlantaMapa
  ) => {
    switch (
      planta.estadoInspeccion
    ) {
      case "PENDIENTE_DIAGNOSTICO":
        return "Pendiente de diagnóstico";

      case "SALUDABLE":
        return "Saludable";

      case "PROBLEMA_DETECTADO":
        return "Problema detectado";

      default:
        return "Sin inspeccionar";
    }
  };


  const obtenerClaseEstado = (
    planta: PlantaMapa
  ) => {
    switch (
      planta.estadoInspeccion
    ) {
      case "PENDIENTE_DIAGNOSTICO":
        return "planta-pendiente-diagnostico";

      case "SALUDABLE":
        return "planta-saludable";

      case "PROBLEMA_DETECTADO":
        return "planta-problema";

      default:
        return "planta-sin-inspeccion";
    }
  };


  /*
   * =====================================================
   * FORMATOS
   * =====================================================
   */

  const formatearFecha = (
    fecha: string | null
  ) => {
    if (!fecha) {
      return "Sin registro";
    }

    return new Date(
      fecha
    ).toLocaleString(
      "es-PE",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    );
  };


  const formatearConfianza = (
    confianza: number | null
  ) => {
    if (
      confianza === null
    ) {
      return "Sin dato";
    }

    return `${(
      confianza * 100
    ).toFixed(2)} %`;
  };


  /*
   * =====================================================
   * PLANTAS Y RESUMEN
   * =====================================================
   */

  const todasLasPlantas =
    useMemo(
      () =>
        lote?.filas.flatMap(
          fila =>
            fila.plantas
        ) ?? [],
      [lote]
    );


  const totalSinInspeccionar =
    todasLasPlantas.filter(
      planta =>
        planta.estadoInspeccion ===
        "SIN_INSPECCION"
    ).length;


  const totalPendientes =
    todasLasPlantas.filter(
      planta =>
        planta.estadoInspeccion ===
        "PENDIENTE_DIAGNOSTICO"
    ).length;


  const totalSaludables =
    todasLasPlantas.filter(
      planta =>
        planta.estadoInspeccion ===
        "SALUDABLE"
    ).length;


  const totalProblemas =
    todasLasPlantas.filter(
      planta =>
        planta.estadoInspeccion ===
        "PROBLEMA_DETECTADO"
    ).length;


  const totalInspeccionadas =
    totalSaludables +
    totalProblemas;


  /*
   * =====================================================
   * FILAS / PAGINACIÓN
   * =====================================================
   */

  const filasOrdenadas =
    useMemo(
      () =>
        [...(lote?.filas ?? [])]
          .sort(
            (a, b) =>
              a.numero -
              b.numero
          ),
      [lote]
    );


  const totalPaginasFilas =
    Math.max(
      1,
      Math.ceil(
        filasOrdenadas.length /
        FILAS_POR_PAGINA
      )
    );


  const filasVisibles =
    filaSeleccionada !== null
      ? filasOrdenadas.filter(
          fila =>
            fila.numero ===
            filaSeleccionada
        )
      : filasOrdenadas.slice(
          paginaFilas *
            FILAS_POR_PAGINA,

          paginaFilas *
            FILAS_POR_PAGINA +
            FILAS_POR_PAGINA
        );


  /*
   * =====================================================
   * BUSCAR PLANTA
   * =====================================================
   */

  const handleBuscarPlanta =
    async () => {
      if (!lote) {
        return;
      }


      const termino =
        busquedaPlanta
          .trim()
          .toLowerCase();


      if (!termino) {
        mostrarToast(
          "Escribe el código de una planta.",
          "info"
        );

        return;
      }


      let plantaEncontrada:
        PlantaMapa | null = null;

      let filaEncontrada:
        number | null = null;


      for (
        const fila of lote.filas
      ) {
        const encontrada =
          fila.plantas.find(
            planta =>
              planta.codigo
                .toLowerCase() ===
                termino ||
              planta.codigo
                .toLowerCase()
                .includes(
                  termino
                )
          );


        if (encontrada) {
          plantaEncontrada =
            encontrada;

          filaEncontrada =
            fila.numero;

          break;
        }
      }


      if (
        !plantaEncontrada ||
        filaEncontrada === null
      ) {
        mostrarToast(
          "No se encontró una planta con ese código.",
          "error"
        );

        return;
      }


      setFilaSeleccionada(
        filaEncontrada
      );


      await handleSeleccionarPlanta(
        plantaEncontrada
      );


      mostrarToast(
        `Planta ${plantaEncontrada.codigo} localizada.`,
        "exito"
      );
    };


  /*
   * =====================================================
   * CARGANDO
   * =====================================================
   */

  if (cargando) {
    return (
      <div className="mapa-loading">
        Cargando mapa del lote...
      </div>
    );
  }


  /*
   * =====================================================
   * LOTE NO ENCONTRADO
   * =====================================================
   */

  if (!lote) {
    return (
      <>
        <div className="mapa-no-encontrado">

          <MapPinned size={42} />

          <h2>
            Lote no disponible
          </h2>

          <p>
            No fue posible cargar la información del lote.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/campanias"
              )
            }
          >
            <ArrowLeft
              size={17}
            />

            Volver a campañas
          </button>

        </div>


        {toast && (
          <ToastMensaje
            toast={toast}
            cerrar={() =>
              setToast(null)
            }
          />
        )}
      </>
    );
  }


  return (
    <div className="mapa-page">

      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (
        <ToastMensaje
          toast={toast}
          cerrar={() =>
            setToast(null)
          }
        />
      )}


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="mapa-header">

        <div className="mapa-titulo">

          <button
            type="button"
            className="mapa-volver"
            onClick={() =>
              navigate(
                "/campanias"
              )
            }
          >
            <ArrowLeft
              size={16}
            />

            Volver
          </button>


          <h1>
            {lote.nombre}
          </h1>


          <p>
            Monitoreo y diagnóstico de las plantas
            del lote{" "}

            <strong>
              {lote.codigo}
            </strong>.
          </p>

        </div>


        <div className="mapa-resumen">

          <ResumenItem
            titulo="Área"
            valor={`${lote.areaM2 ?? 0} m²`}
          />

          <ResumenItem
            titulo="Filas"
            valor={lote.totalFilas}
          />

          <ResumenItem
            titulo="Plantas"
            valor={lote.totalPlantas}
          />

          <ResumenItem
            titulo="Estado"
            valor={lote.estado}
          />

        </div>

      </header>


      {/* =================================================
          RESUMEN OPERATIVO
      ================================================= */}

      <section className="resumen-operativo">

        <EstadoResumen
          titulo="Total"
          valor={lote.totalPlantas}
          clase="resumen-total"
        />

        <EstadoResumen
          titulo="Inspeccionadas"
          valor={totalInspeccionadas}
          clase="resumen-inspeccionadas"
        />

        <EstadoResumen
          titulo="Sin inspeccionar"
          valor={totalSinInspeccionar}
          clase="resumen-sin-inspeccion"
        />

        <EstadoResumen
          titulo="Pendientes"
          valor={totalPendientes}
          clase="resumen-pendiente"
        />

        <EstadoResumen
          titulo="Saludables"
          valor={totalSaludables}
          clase="resumen-saludable"
        />

        <EstadoResumen
          titulo="Problemas"
          valor={totalProblemas}
          clase="resumen-problema"
        />

      </section>


      {/* =================================================
          CONTROLES
      ================================================= */}

      <section className="mapa-controles">

        <div className="mapa-buscador">

          <Search
            size={18}
          />

          <input
            type="text"
            value={
              busquedaPlanta
            }
            onChange={(e) =>
              setBusquedaPlanta(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key ===
                "Enter"
              ) {
                handleBuscarPlanta();
              }
            }}
            placeholder="Buscar planta. Ej: L01-F12-P087"
          />


          <button
            type="button"
            onClick={
              handleBuscarPlanta
            }
          >
            Buscar
          </button>

        </div>


        <div className="mapa-selector-fila">

          <Rows3
            size={18}
          />

          <select
            value={
              filaSeleccionada ??
              ""
            }
            onChange={(e) => {
              const valor =
                e.target.value;

              if (!valor) {
                setFilaSeleccionada(
                  null
                );

                setPaginaFilas(
                  0
                );

                return;
              }

              setFilaSeleccionada(
                Number(
                  valor
                )
              );
            }}
          >
            <option value="">
              Todas por bloques
            </option>

            {filasOrdenadas.map(
              fila => (
                <option
                  key={
                    fila.idFila
                  }
                  value={
                    fila.numero
                  }
                >
                  Fila {fila.numero}
                </option>
              )
            )}

          </select>

        </div>

      </section>


      {/* =================================================
          LEYENDA
      ================================================= */}

      <section className="mapa-leyenda">

        <Leyenda
          clase="leyenda-gris"
          texto="Sin inspeccionar"
        />

        <Leyenda
          clase="leyenda-amarillo"
          texto="Pendiente"
        />

        <Leyenda
          clase="leyenda-verde"
          texto="Saludable"
        />

        <Leyenda
          clase="leyenda-rojo"
          texto="Problema detectado"
        />

      </section>


      {/* =================================================
          MAPA + PANEL
      ================================================= */}

      <div className="mapa-trabajo">

        {/* ===============================================
            MAPA
        =============================================== */}

        <div className="mapa-zona">

          <section className="lote-panel">

            <div className="lote-grid">

              {filasVisibles.map(
                fila => (
                  <div
                    key={
                      fila.idFila
                    }
                    className="fila-lote"
                  >

                    <div className="fila-label">
                      Fila {fila.numero}
                    </div>


                    <div className="plantas-row">

                      {fila.plantas.map(
                        planta => {
                          const seleccionada =
                            plantaSeleccionada
                              ?.idPlanta ===
                            planta.idPlanta;


                          return (
                            <motion.button
                              key={
                                planta.idPlanta
                              }
                              type="button"
                              className={[
                                "planta-node",

                                obtenerClaseEstado(
                                  planta
                                ),

                                seleccionada
                                  ? "planta-seleccionada"
                                  : "",
                              ].join(" ")}
                              onClick={() =>
                                handleSeleccionarPlanta(
                                  planta
                                )
                              }
                              whileHover={{
                                scale: 1.18,
                              }}
                              whileTap={{
                                scale: 0.92,
                              }}
                              title={
                                `${planta.codigo} · ${obtenerTextoEstado(
                                  planta
                                )}`
                              }
                            >
                              {planta.numero}
                            </motion.button>
                          );
                        }
                      )}

                    </div>

                  </div>
                )
              )}

            </div>

          </section>


          {/* PAGINACIÓN */}

          {filaSeleccionada ===
            null && (
            <div className="paginacion-filas">

              <button
                type="button"
                disabled={
                  paginaFilas ===
                  0
                }
                onClick={() =>
                  setPaginaFilas(
                    actual =>
                      Math.max(
                        0,
                        actual - 1
                      )
                  )
                }
              >
                <ChevronLeft
                  size={17}
                />

                Anterior
              </button>


              <span>
                Filas{" "}

                <strong>
                  {filasOrdenadas.length ===
                  0
                    ? 0
                    : paginaFilas *
                        FILAS_POR_PAGINA +
                      1}
                </strong>

                {" - "}

                <strong>
                  {Math.min(
                    (
                      paginaFilas +
                      1
                    ) *
                      FILAS_POR_PAGINA,

                    filasOrdenadas.length
                  )}
                </strong>

                {" de "}

                <strong>
                  {filasOrdenadas.length}
                </strong>
              </span>


              <button
                type="button"
                disabled={
                  paginaFilas >=
                  totalPaginasFilas -
                    1
                }
                onClick={() =>
                  setPaginaFilas(
                    actual =>
                      Math.min(
                        totalPaginasFilas -
                          1,

                        actual + 1
                      )
                  )
                }
              >
                Siguiente

                <ChevronRight
                  size={17}
                />
              </button>

            </div>
          )}

        </div>


        {/* ===============================================
            PANEL LATERAL
        =============================================== */}

        <aside className="planta-sidebar">

          {!plantaSeleccionada ? (
            <div className="sidebar-vacio">

              <Leaf
                size={38}
              />

              <h3>
                Selecciona una planta
              </h3>

              <p>
                Haz clic sobre una planta del mapa para
                consultar su estado, diagnóstico y
                registros de inspección.
              </p>

            </div>
          ) : (
            <>

              {/* =========================================
                  DETALLE
              ========================================= */}

              <motion.section
                className="planta-detalle"
                initial={{
                  opacity: 0,
                  x: 12,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
              >

                <div className="detalle-header">

                  <div>

                    <span className="detalle-etiqueta">
                      PLANTA SELECCIONADA
                    </span>

                    <h3>
                      <Leaf
                        size={19}
                      />

                      {
                        plantaSeleccionada
                          .codigo
                      }
                    </h3>

                  </div>

                </div>


                <div className="planta-detalle-grid">

                  <DetalleItem
                    titulo="Número"
                    valor={
                      plantaSeleccionada
                        .numero
                    }
                  />

                  <DetalleItem
                    titulo="Estado"
                    valor={
                      obtenerTextoEstado(
                        plantaSeleccionada
                      )
                    }
                  />

                </div>


                {/* SIN INSPECCIÓN */}

                {plantaSeleccionada
                  .estadoInspeccion ===
                  "SIN_INSPECCION" && (
                  <div className="estado-aviso estado-aviso-neutro">
                    Esta planta todavía no tiene
                    diagnósticos registrados.
                  </div>
                )}


                {/* PENDIENTE */}

                {plantaSeleccionada
                  .estadoInspeccion ===
                  "PENDIENTE_DIAGNOSTICO" && (
                  <div className="estado-aviso estado-aviso-pendiente">

                    <CircleAlert
                      size={17}
                    />

                    Existe una inspección iniciada,
                    pero todavía no se ha generado
                    un diagnóstico con IA.

                  </div>
                )}


                {/* CARGANDO */}

                {cargandoUltimaInspeccion && (
                  <div className="ultima-cargando">
                    Cargando última inspección...
                  </div>
                )}


                {/* =======================================
                    ÚLTIMA INSPECCIÓN
                ======================================= */}

                {ultimaInspeccion && (
                  <div className="ultima-inspeccion">

                    <h4>
                      Última inspección
                    </h4>


                    <div className="ultima-imagen">

                      {ultimaInspeccion.urlImagen ? (
                        <img
                          src={
                            ultimaInspeccion
                              .urlImagen
                          }
                          alt={
                            ultimaInspeccion
                              .nombreImagen ||
                            "Fotografía analizada"
                          }
                        />
                      ) : (
                        <div className="imagen-no-disponible">

                          <Camera
                            size={28}
                          />

                          Imagen no disponible

                        </div>
                      )}

                    </div>


                    <div className="ultima-datos">

                      <DatoIcono
                        icono={
                          <Search
                            size={16}
                          />
                        }
                        titulo="Diagnóstico IA"
                        valor={
                          ultimaInspeccion
                            .diagnostico
                        }
                      />


                      <DatoIcono
                        icono={
                          <Activity
                            size={16}
                          />
                        }
                        titulo="Confianza"
                        valor={
                          formatearConfianza(
                            ultimaInspeccion
                              .confianza
                          )
                        }
                      />


                      <DatoIcono
                        icono={
                          <User
                            size={16}
                          />
                        }
                        titulo="Inspeccionado por"
                        valor={
                          ultimaInspeccion
                            .nombreUsuario
                        }
                      />


                      <DatoIcono
                        icono={
                          <Clock3
                            size={16}
                          />
                        }
                        titulo="Fecha"
                        valor={
                          formatearFecha(
                            ultimaInspeccion
                              .fechaDiagnostico
                          )
                        }
                      />


                      <DatoIcono
                        icono={
                          <BrainCircuit
                            size={16}
                          />
                        }
                        titulo="Modelo"
                        valor={
                          `${ultimaInspeccion.modelo}${
                            ultimaInspeccion.arquitectura
                              ? ` · ${ultimaInspeccion.arquitectura}`
                              : ""
                          }`
                        }
                      />


                      {ultimaInspeccion
                        .tiempoInferenciaMs !==
                        null && (
                        <DatoIcono
                          icono={
                            <Clock3
                              size={16}
                            />
                          }
                          titulo="Inferencia"
                          valor={
                            `${ultimaInspeccion.tiempoInferenciaMs} ms`
                          }
                        />
                      )}

                    </div>


                    {ultimaInspeccion
                      .codigoDiagnostico ===
                      "HEALTHY" ? (
                      <div className="resultado resultado-saludable">

                        <CheckCircle2
                          size={17}
                        />

                        La IA clasificó esta planta
                        como saludable.

                      </div>
                    ) : (
                      <div className="resultado resultado-problema">

                        <CircleAlert
                          size={17}
                        />

                        La IA detectó un problema
                        foliar en esta planta.

                      </div>
                    )}

                  </div>
                )}


                {/* BOTONES */}

                <div className="acciones-planta">

                  {plantaSeleccionada
                    .estadoInspeccion !==
                    "SIN_INSPECCION" &&
                    plantaSeleccionada
                      .estadoInspeccion !==
                    "PENDIENTE_DIAGNOSTICO" && (
                    <button
                      type="button"
                      className="boton-historial"
                      onClick={
                        handleVerHistorial
                      }
                      disabled={
                        cargandoHistorial
                      }
                    >
                      <History
                        size={17}
                      />

                      {cargandoHistorial
                        ? "Cargando..."
                        : "Ver historial"}
                    </button>
                  )}


                  <button
                    type="button"
                    className="boton-inspeccionar"
                    onClick={
                      handleIniciarInspeccion
                    }
                    disabled={
                      iniciandoInspeccion
                    }
                  >
                    <Camera
                      size={17}
                    />

                    {iniciandoInspeccion
                      ? "Iniciando..."
                      : plantaSeleccionada
                            .estadoInspeccion ===
                          "SIN_INSPECCION"
                      ? "Inspeccionar planta"
                      : "Nueva inspección"}
                  </button>

                </div>

              </motion.section>


              {/* =========================================
                  HISTORIAL
              ========================================= */}

              {mostrandoHistorial &&
                historial && (
                <motion.section
                  className="historial-panel"
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                >

                  <div className="historial-header">

                    <div>

                      <span>
                        HISTORIAL
                      </span>

                      <h3>
                        <History
                          size={18}
                        />

                        Inspecciones
                      </h3>

                      <p>
                        {
                          historial
                            .totalInspecciones
                        }{" "}
                        diagnóstico(s)
                      </p>

                    </div>


                    <button
                      type="button"
                      className="historial-cerrar"
                      onClick={() =>
                        setMostrandoHistorial(
                          false
                        )
                      }
                    >
                      <X
                        size={18}
                      />
                    </button>

                  </div>


                  {historial
                    .inspecciones
                    .length === 0 ? (
                    <div className="historial-vacio">
                      No existen diagnósticos registrados.
                    </div>
                  ) : (
                    <div className="historial-lista">

                      {historial
                        .inspecciones
                        .map(
                          (
                            inspeccion,
                            indice
                          ) => (
                            <article
                              key={
                                inspeccion
                                  .idInspeccion
                              }
                              className="historial-inspeccion"
                            >

                              <div className="historial-inspeccion-header">

                                <strong>
                                  Inspección{" "}
                                  {
                                    historial
                                      .inspecciones
                                      .length -
                                    indice
                                  }
                                </strong>

                                <span>
                                  {formatearFecha(
                                    inspeccion
                                      .fechaInicio
                                  )}
                                </span>

                              </div>


                              <div className="historial-inspector">

                                <User
                                  size={15}
                                />

                                <span>
                                  Realizado por{" "}

                                  <strong>
                                    {
                                      inspeccion
                                        .nombreUsuario
                                    }
                                  </strong>
                                </span>

                              </div>


                              {inspeccion
                                .observaciones && (
                                <div className="historial-observacion">

                                  <strong>
                                    Observaciones
                                  </strong>

                                  <span>
                                    {
                                      inspeccion
                                        .observaciones
                                    }
                                  </span>

                                </div>
                              )}


                              {inspeccion
                                .diagnosticos
                                .map(
                                  diagnostico => {

                                    const imagenDiagnostico =
                                      inspeccion
                                        .imagenes
                                        .find(
                                          imagen =>
                                            imagen
                                              .idImagen ===
                                            diagnostico
                                              .idImagen
                                        );


                                    return (
                                      <div
                                        key={
                                          diagnostico
                                            .idDiagnostico
                                        }
                                        className={[
                                          "historial-diagnostico",

                                          diagnostico
                                            .codigoClasePredicha ===
                                          "HEALTHY"
                                            ? "historial-diagnostico-saludable"
                                            : "historial-diagnostico-problema",
                                        ].join(
                                          " "
                                        )}
                                      >

                                        <div className="historial-foto">

                                          {imagenDiagnostico
                                            ?.urlImagen ? (
                                            <button
                                              type="button"
                                              className="historial-foto-boton"
                                              onClick={() =>
                                                abrirImagen(
                                                  imagenDiagnostico.urlImagen!,
                                                  imagenDiagnostico.nombreOriginal
                                                )
                                              }
                                              title="Ampliar imagen"
                                            >
                                              <img
                                                src={
                                                  imagenDiagnostico
                                                    .urlImagen
                                                }
                                                alt={
                                                  imagenDiagnostico
                                                    .nombreOriginal
                                                }
                                              />

                                              <span className="historial-foto-zoom">
                                                <ZoomIn size={15} />
                                                Ampliar
                                              </span>
                                            </button>
                                          ) : (
                                            <div className="historial-sin-foto">

                                              <Camera
                                                size={24}
                                              />

                                              Sin imagen

                                            </div>
                                          )}

                                        </div>


                                        <div className="historial-diagnostico-info">

                                          <div>
                                            <span>
                                              Resultado
                                            </span>

                                            <strong>
                                              {
                                                diagnostico
                                                  .clasePredicha
                                              }
                                            </strong>
                                          </div>


                                          <div>
                                            <span>
                                              Confianza
                                            </span>

                                            <strong>
                                              {formatearConfianza(
                                                diagnostico
                                                  .confianza
                                              )}
                                            </strong>
                                          </div>


                                          <div>
                                            <span>
                                              Modelo
                                            </span>

                                            <strong>
                                              {
                                                diagnostico
                                                  .modelo
                                              }
                                            </strong>
                                          </div>


                                          <div>
                                            <span>
                                              Arquitectura
                                            </span>

                                            <strong>
                                              {
                                                diagnostico
                                                  .arquitectura
                                              }
                                            </strong>
                                          </div>


                                          <div>
                                            <span>
                                              Inferencia
                                            </span>

                                            <strong>
                                              {
                                                diagnostico
                                                  .tiempoInferenciaMs ??
                                                "Sin dato"
                                              }{" "}
                                              ms
                                            </strong>
                                          </div>


                                          <div>
                                            <span>
                                              Tiempo total
                                            </span>

                                            <strong>
                                              {
                                                diagnostico
                                                  .tiempoTotalMs ??
                                                "Sin dato"
                                              }{" "}
                                              ms
                                            </strong>
                                          </div>

                                        </div>


                                        {diagnostico.validado ? (
                                          <div className="validacion-especialista validacion-completada">
                                            <div className="validacion-especialista-titulo">
                                              <CheckCircle2 size={17} />
                                              Validado por especialista
                                            </div>

                                            <div className="validacion-resumen">
                                              <span>
                                                Evaluación profesional
                                              </span>
                                              <strong>
                                                {diagnostico.claseReal ??
                                                  "Sin dato"}
                                              </strong>
                                            </div>

                                            <div
                                              className={
                                                diagnostico.codigoClaseReal ===
                                                diagnostico.codigoClasePredicha
                                                  ? "validacion-resultado correcto"
                                                  : "validacion-resultado incorrecto"
                                              }
                                            >
                                              {diagnostico.codigoClaseReal ===
                                              diagnostico.codigoClasePredicha ? (
                                                <>
                                                  <CheckCircle2 size={16} />
                                                  Diagnóstico correcto
                                                </>
                                              ) : (
                                                <>
                                                  <XCircle size={16} />
                                                  Diagnóstico incorrecto
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="validacion-especialista">
                                            <div className="validacion-especialista-titulo">
                                              Validación del especialista
                                            </div>

                                            <p>
                                              ¿La detección realizada por la IA es correcta?
                                            </p>

                                            <div className="validacion-opciones">
                                              <button
                                                type="button"
                                                className="validacion-si"
                                                disabled={
                                                  diagnosticoValidandoId ===
                                                  diagnostico.idDiagnostico
                                                }
                                                onClick={() =>
                                                  handleValidarCorrecto(
                                                    diagnostico
                                                  )
                                                }
                                              >
                                                <CheckCircle2 size={17} />
                                                Sí, es correcto
                                              </button>

                                              <button
                                                type="button"
                                                className="validacion-no"
                                                disabled={
                                                  diagnosticoValidandoId ===
                                                  diagnostico.idDiagnostico
                                                }
                                                onClick={() =>
                                                  handleMarcarIncorrecto(
                                                    diagnostico.idDiagnostico
                                                  )
                                                }
                                              >
                                                <XCircle size={17} />
                                                No
                                              </button>
                                            </div>

                                            {diagnosticoIncorrectoId ===
                                              diagnostico.idDiagnostico && (
                                              <div className="validacion-correccion">
                                                <label>
                                                  Identificación correcta
                                                </label>

                                                <select
                                                  value={
                                                    claseRealSeleccionada
                                                  }
                                                  onChange={(e) =>
                                                    setClaseRealSeleccionada(
                                                      e.target.value
                                                    )
                                                  }
                                                  disabled={
                                                    cargandoClases ||
                                                    diagnosticoValidandoId ===
                                                      diagnostico.idDiagnostico
                                                  }
                                                >
                                                  <option value="">
                                                    {cargandoClases
                                                      ? "Cargando clases..."
                                                      : "Selecciona la clase real"}
                                                  </option>

                                                  {clasesDiagnostico
                                                    .filter(
                                                      clase =>
                                                        clase.idClase !==
                                                        diagnostico.idClasePredicha
                                                    )
                                                    .map(
                                                      clase => (
                                                        <option
                                                          key={
                                                            clase.idClase
                                                          }
                                                          value={
                                                            clase.idClase
                                                          }
                                                        >
                                                          {clase.nombre}
                                                        </option>
                                                      )
                                                    )}
                                                </select>

                                                <div className="validacion-correccion-acciones">
                                                  <button
                                                    type="button"
                                                    className="validacion-cancelar"
                                                    onClick={() => {
                                                      setDiagnosticoIncorrectoId(
                                                        null
                                                      );
                                                      setClaseRealSeleccionada(
                                                        ""
                                                      );
                                                    }}
                                                  >
                                                    Cancelar
                                                  </button>

                                                  <button
                                                    type="button"
                                                    className="validacion-guardar"
                                                    disabled={
                                                      !claseRealSeleccionada ||
                                                      diagnosticoValidandoId ===
                                                        diagnostico.idDiagnostico
                                                    }
                                                    onClick={() =>
                                                      handleGuardarIncorrecto(
                                                        diagnostico
                                                      )
                                                    }
                                                  >
                                                    {diagnosticoValidandoId ===
                                                    diagnostico.idDiagnostico
                                                      ? "Guardando..."
                                                      : "Guardar validación"}
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                      </div>
                                    );
                                  }
                                )}

                            </article>
                          )
                        )}

                    </div>
                  )}

                </motion.section>
              )}

            </>
          )}

        </aside>

      </div>

      {imagenAmpliada && (
        <div
          className="imagen-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de la imagen"
        >
          <div className="imagen-modal-barra">
            <div>
              <strong>Imagen de inspección</strong>
              <span>{imagenAmpliada.nombre}</span>
            </div>

            <button
              type="button"
              className="imagen-modal-cerrar"
              onClick={cerrarImagen}
              aria-label="Cerrar imagen"
            >
              <X size={22} />
            </button>
          </div>

          <div
            className="imagen-modal-contenido"
            onWheel={(e) => {
              e.preventDefault();

              if (e.deltaY < 0) {
                setZoomImagen(
                  actual =>
                    Math.min(3, actual + 0.1)
                );
              } else {
                setZoomImagen(
                  actual =>
                    Math.max(0.5, actual - 0.1)
                );
              }
            }}
          >
            <img
              src={imagenAmpliada.url}
              alt={imagenAmpliada.nombre}
              style={{
                transform: `scale(${zoomImagen})`,
              }}
            />
          </div>

          <div className="imagen-modal-controles">
            <button
              type="button"
              onClick={disminuirZoom}
              disabled={zoomImagen <= 0.5}
            >
              <ZoomOut size={18} />
            </button>

            <span>
              {Math.round(zoomImagen * 100)} %
            </span>

            <button
              type="button"
              onClick={aumentarZoom}
              disabled={zoomImagen >= 3}
            >
              <ZoomIn size={18} />
            </button>

            <button
              type="button"
              onClick={() =>
                setZoomImagen(1)
              }
            >
              <RotateCcw size={17} />
              Restablecer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}


/* =========================================================
   COMPONENTES PEQUEÑOS
========================================================= */


function ResumenItem({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="mapa-resumen-item">

      <span>
        {titulo}
      </span>

      <strong>
        {valor}
      </strong>

    </div>
  );
}


function EstadoResumen({
  titulo,
  valor,
  clase,
}: {
  titulo: string;
  valor: number;
  clase: string;
}) {
  return (
    <div
      className={`estado-resumen-card ${clase}`}
    >
      <span>
        {titulo}
      </span>

      <strong>
        {valor}
      </strong>
    </div>
  );
}


function Leyenda({
  clase,
  texto,
}: {
  clase: string;
  texto: string;
}) {
  return (
    <span>
      <i
        className={`leyenda-punto ${clase}`}
      />

      {texto}
    </span>
  );
}


function DetalleItem({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="planta-detalle-item">

      <span>
        {titulo}
      </span>

      <strong>
        {valor}
      </strong>

    </div>
  );
}


function DatoIcono({
  icono,
  titulo,
  valor,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="dato-icono">

      <div className="dato-icono-icono">
        {icono}
      </div>

      <div>
        <span>
          {titulo}
        </span>

        <strong>
          {valor}
        </strong>
      </div>

    </div>
  );
}


function ToastMensaje({
  toast,
  cerrar,
}: {
  toast: Toast;
  cerrar: () => void;
}) {
  return (
    <motion.div
      className={`toast-mensaje toast-${toast.tipo}`}
      initial={{
        opacity: 0,
        y: -20,
        x: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
        x: 0,
      }}
      exit={{
        opacity: 0,
      }}
    >
      <div className="toast-contenido">

        {toast.tipo ===
        "exito" ? (
          <CheckCircle2
            size={20}
          />
        ) : toast.tipo ===
          "error" ? (
          <CircleAlert
            size={20}
          />
        ) : (
          <Leaf
            size={20}
          />
        )}


        <span>
          {toast.mensaje}
        </span>

      </div>


      <button
        type="button"
        onClick={
          cerrar
        }
        aria-label="Cerrar mensaje"
      >
        <X
          size={17}
        />
      </button>

    </motion.div>
  );
}