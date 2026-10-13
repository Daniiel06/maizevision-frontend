import ResumenCierreModal from "./ResumenCierreModal";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Flag,
  MapPinned,
  Plus,
  Sprout,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  crearCampania,
  crearLote,
  finalizarCampania,
  obtenerCampanias,
  obtenerFundos,
  obtenerLotesPorCampania,
  obtenerVariedades,
} from "../api/campaniasApi";

import type {
  Campania,
  CrearCampaniaRequest,
  CrearLoteRequest,
  Fundo,
  LoteResumen,
  Variedad,
} from "../types/campania.types";

import "./CampaniasPage.css";


const formularioCampaniaInicial: CrearCampaniaRequest = {
  idFundo: "",
  idVariedad: "",
  codigo: "",
  nombre: "",
  fechaInicio: "",
  observaciones: "",
};


const formularioLoteInicial: CrearLoteRequest = {
  codigo: "",
  nombre: "",
  areaM2: 0,
  numeroFilas: 0,
  plantasPorFila: 0,
  fechaSiembra: "",
  observaciones: "",
};


export default function CampaniasPage() {
  const navigate =
    useNavigate();


  const [campanias, setCampanias] =
    useState<Campania[]>([]);

  const [lotes, setLotes] =
    useState<LoteResumen[]>([]);

  const [
    campaniaSeleccionada,
    setCampaniaSeleccionada,
  ] = useState<Campania | null>(null);


  const [fundos, setFundos] =
    useState<Fundo[]>([]);

  const [variedades, setVariedades] =
    useState<Variedad[]>([]);


  const [cargando, setCargando] =
    useState(true);

  const [cargandoLotes, setCargandoLotes] =
    useState(false);

  const [guardandoCampania, setGuardandoCampania] =
    useState(false);

  const [guardandoLote, setGuardandoLote] =
    useState(false);

  const [finalizando, setFinalizando] =
    useState(false);


  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");


  const [
    mostrarModalCampania,
    setMostrarModalCampania,
  ] = useState(false);

  const [
    mostrarModalLote,
    setMostrarModalLote,
  ] = useState(false);

  const [
    mostrarConfirmacionFinalizar,
    setMostrarConfirmacionFinalizar,
  ] = useState(false);


  const [
    formularioCampania,
    setFormularioCampania,
  ] = useState<CrearCampaniaRequest>(
    formularioCampaniaInicial
  );

  const [
    formularioLote,
    setFormularioLote,
  ] = useState<CrearLoteRequest>(
    formularioLoteInicial
  );


  const totalPlantas =
    Math.max(
      0,
      Number(formularioLote.numeroFilas) || 0
    ) *
    Math.max(
      0,
      Number(formularioLote.plantasPorFila) || 0
    );


  const obtenerMensajeError = (
    err: unknown,
    mensajePredeterminado: string
  ) => {
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err
    ) {
      const errorHttp =
        err as {
          response?: {
            data?: {
              mensaje?: string;
            };
          };
        };

      return (
        errorHttp.response?.data?.mensaje ??
        mensajePredeterminado
      );
    }

    return mensajePredeterminado;
  };


  const cargarCampanias =
    async () => {
      try {
        const data =
          await obtenerCampanias();

        setCampanias(data);

        setCampaniaSeleccionada(
          (actual) => {
            if (!actual) {
              return null;
            }

            return (
              data.find(
                (x) =>
                  x.idCampania ===
                  actual.idCampania
              ) ?? null
            );
          }
        );
      } catch {
        setError(
          "No se pudieron cargar las campañas."
        );
      }
    };


  useEffect(() => {
    const cargarInicial =
      async () => {
        try {
          await cargarCampanias();
        } finally {
          setCargando(false);
        }
      };

    cargarInicial();
  }, []);


  const limpiarMensajes = () => {
    setError("");
    setMensaje("");
  };


  const handleVerLotes =
    async (
      campania: Campania
    ) => {
      limpiarMensajes();

      setCampaniaSeleccionada(
        campania
      );

      setCargandoLotes(true);

      try {
        const data =
          await obtenerLotesPorCampania(
            campania.idCampania
          );

        setLotes(data);
      } catch (err) {
        setError(
          obtenerMensajeError(
            err,
            "No se pudieron cargar los lotes."
          )
        );
      } finally {
        setCargandoLotes(false);
      }
    };


  const abrirNuevaCampania =
    async () => {
      limpiarMensajes();

      try {
        const [
          fundosData,
          variedadesData,
        ] = await Promise.all([
          obtenerFundos(),
          obtenerVariedades(),
        ]);

        setFundos(
          fundosData
        );

        setVariedades(
          variedadesData
        );


        setFormularioCampania({
          ...formularioCampaniaInicial,

          idFundo:
            fundosData.length === 1
              ? fundosData[0].idFundo
              : "",

          idVariedad:
            variedadesData.length === 1
              ? variedadesData[0].idVariedad
              : "",
        });


        setMostrarModalCampania(
          true
        );
      } catch (err) {
        setError(
          obtenerMensajeError(
            err,
            "No se pudieron cargar los datos necesarios para crear una campaña."
          )
        );
      }
    };


  const handleCrearCampania =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      limpiarMensajes();


      if (
        !formularioCampania.idFundo ||
        !formularioCampania.idVariedad ||
        !formularioCampania.codigo.trim() ||
        !formularioCampania.nombre.trim() ||
        !formularioCampania.fechaInicio
      ) {
        setError(
          "Completa todos los campos obligatorios."
        );

        return;
      }


      setGuardandoCampania(
        true
      );


      try {
        await crearCampania({
          ...formularioCampania,

          codigo:
            formularioCampania.codigo
              .trim()
              .toUpperCase(),

          nombre:
            formularioCampania.nombre
              .trim(),

          observaciones:
            formularioCampania.observaciones
              ?.trim() || null,
        });


        setMostrarModalCampania(
          false
        );

        setFormularioCampania(
          formularioCampaniaInicial
        );

        await cargarCampanias();

        setMensaje(
          "Campaña creada correctamente."
        );
      } catch (err) {
        setError(
          obtenerMensajeError(
            err,
            "No se pudo crear la campaña."
          )
        );
      } finally {
        setGuardandoCampania(
          false
        );
      }
    };


  const abrirNuevoLote = () => {
    limpiarMensajes();

    setFormularioLote({
      ...formularioLoteInicial,

      fechaSiembra:
        campaniaSeleccionada
          ?.fechaInicio ?? "",
    });

    setMostrarModalLote(
      true
    );
  };


  const handleCrearLote =
    async (
      event: React.FormEvent
    ) => {
      event.preventDefault();

      limpiarMensajes();


      if (!campaniaSeleccionada) {
        return;
      }


      if (
        !formularioLote.codigo.trim() ||
        !formularioLote.nombre.trim() ||
        formularioLote.areaM2 <= 0 ||
        formularioLote.numeroFilas <= 0 ||
        formularioLote.plantasPorFila <= 0
      ) {
        setError(
          "Completa correctamente los datos del lote."
        );

        return;
      }


      setGuardandoLote(
        true
      );


      try {
        await crearLote(
          campaniaSeleccionada.idCampania,
          {
            ...formularioLote,

            codigo:
              formularioLote.codigo
                .trim()
                .toUpperCase(),

            nombre:
              formularioLote.nombre
                .trim(),

            fechaSiembra:
              formularioLote.fechaSiembra ||
              null,

            observaciones:
              formularioLote.observaciones
                ?.trim() || null,
          }
        );


        const lotesActualizados =
          await obtenerLotesPorCampania(
            campaniaSeleccionada.idCampania
          );


        setLotes(
          lotesActualizados
        );

        setMostrarModalLote(
          false
        );

        setFormularioLote(
          formularioLoteInicial
        );

        setMensaje(
          `Lote creado correctamente. Se generaron ${totalPlantas} plantas.`
        );
      } catch (err) {
        setError(
          obtenerMensajeError(
            err,
            "No se pudo crear el lote."
          )
        );
      } finally {
        setGuardandoLote(
          false
        );
      }
    };


  const handleFinalizarCampania =
    async () => {
      if (!campaniaSeleccionada) {
        return;
      }


      limpiarMensajes();

      setFinalizando(
        true
      );


      try {
        await finalizarCampania(
          campaniaSeleccionada.idCampania
        );

        await cargarCampanias();

        setMostrarConfirmacionFinalizar(
          false
        );

        setMensaje(
          "Campaña finalizada correctamente."
        );
      } catch (err) {
        setError(
          obtenerMensajeError(
            err,
            "No se pudo finalizar la campaña."
          )
        );
      } finally {
        setFinalizando(
          false
        );
      }
    };


  if (cargando) {
    return (
      <div className="campanias-loading">
        Cargando campañas...
      </div>
    );
  }


  return (
    <div className="campanias-page">

      <div className="campanias-header">
        <div>
          <h1>
            Campañas agrícolas
          </h1>

          <p>
            Administra las campañas, sus lotes y la
            estructura del cultivo.
          </p>
        </div>


        <button
          className="boton-principal"
          onClick={
            abrirNuevaCampania
          }
        >
          <Plus size={18} />

          Nueva campaña
        </button>
      </div>


      {error && (
        <div className="mensaje mensaje-error">
          <AlertTriangle size={18} />

          {error}
        </div>
      )}


      {mensaje && (
        <div className="mensaje mensaje-exito">
          <CheckCircle2 size={18} />

          {mensaje}
        </div>
      )}


      {campanias.length === 0 ? (
        <div className="estado-vacio">
          <Sprout size={42} />

          <h3>
            Todavía no existen campañas
          </h3>

          <p>
            Crea la primera campaña agrícola para
            comenzar a organizar los lotes.
          </p>
        </div>
      ) : (
        <div className="campanias-grid">

          {campanias.map(
            (campania) => {
              const finalizada =
                campania.estado
                  .toUpperCase() ===
                "FINALIZADA";

              const seleccionada =
                campaniaSeleccionada
                  ?.idCampania ===
                campania.idCampania;


              return (
                <div
                  key={
                    campania.idCampania
                  }
                  className={[
                    "campania-card",

                    finalizada
                      ? "campania-finalizada"
                      : "",

                    seleccionada
                      ? "campania-seleccionada"
                      : "",
                  ].join(" ")}
                >
                  <div className="campania-card-superior">
                    <div className="campania-icono">
                      <Sprout size={25} />
                    </div>

                    <span
                      className={
                        finalizada
                          ? "estado-finalizada"
                          : "estado-activa"
                      }
                    >
                      {campania.estado}
                    </span>
                  </div>


                  <h3>
                    {campania.nombre}
                  </h3>


                  <div className="campania-codigo">
                    {campania.codigo}
                  </div>


                  <div className="campania-info">

                    <span>
                      <CalendarDays
                        size={16}
                      />

                      Inicio:{" "}
                      {campania.fechaInicio ??
                        "Sin fecha"}
                    </span>


                    {finalizada && (
                      <span>
                        <Flag size={16} />

                        Fin:{" "}
                        {campania.fechaFin ??
                          "Sin fecha"}
                      </span>
                    )}

                  </div>


                  <button
                    className="ver-lotes-button"
                    onClick={() =>
                      handleVerLotes(
                        campania
                      )
                    }
                  >
                    Ver lotes
                  </button>
                </div>
              );
            }
          )}

        </div>
      )}


      {campaniaSeleccionada && (
        <section className="lotes-section">

          <div className="lotes-header">

            <div>
              <span className="lotes-etiqueta">
                CAMPAÑA SELECCIONADA
              </span>

              <h2>
                Lotes de{" "}
                {
                  campaniaSeleccionada.nombre
                }
              </h2>

              <p>
                {
                  campaniaSeleccionada.codigo
                }
              </p>
            </div>


            <div className="lotes-acciones">
              {campaniaSeleccionada.estado.toUpperCase() === "FINALIZADA" && <button className="boton-secundario" onClick={() => { limpiarMensajes(); setMostrarConfirmacionFinalizar(true); }}>Ver resumen de campaña</button>}

              {campaniaSeleccionada.estado
                .toUpperCase() ===
                "ACTIVA" && (
                <>
                  <button
                    className="boton-principal"
                    onClick={
                      abrirNuevoLote
                    }
                  >
                    <Plus size={18} />

                    Nuevo lote
                  </button>


                  <button
                    className="boton-finalizar"
                    onClick={() => { limpiarMensajes(); setMostrarConfirmacionFinalizar(true); }}
                  >
                    <Flag size={17} />

                    Finalizar campaña
                  </button>
                </>
              )}

            </div>

          </div>


          {campaniaSeleccionada.estado
            .toUpperCase() ===
            "FINALIZADA" && (
            <div className="aviso-finalizada">
              <Flag size={19} />

              <div>
                <strong>
                  Campaña finalizada
                </strong>

                <span>
                  La información permanece disponible
                  para consulta histórica, pero ya no
                  se pueden agregar nuevos lotes ni diagnósticos. Las revisiones pendientes siguen disponibles.
                </span>
              </div>
            </div>
          )}


          {cargandoLotes ? (
            <p>
              Cargando lotes...
            </p>
          ) : lotes.length === 0 ? (
            <div className="estado-vacio estado-vacio-lotes">
              <MapPinned size={38} />

              <h3>
                Esta campaña todavía no tiene lotes
              </h3>

              {campaniaSeleccionada.estado
                .toUpperCase() ===
                "ACTIVA" && (
                <p>
                  Utiliza “Nuevo lote” para crear
                  la estructura del cultivo.
                </p>
              )}
            </div>
          ) : (
            <div className="lotes-grid">

              {lotes.map(
                (lote) => {
                  const total =
                    (lote.numeroFilasPlan ??
                      0) *
                    (lote.plantasFilaPlan ??
                      0);


                  return (
                    <div
                      key={
                        lote.idLote
                      }
                      className="lote-card"
                    >
                      <div className="lote-card-icono">
                        <MapPinned
                          size={23}
                        />
                      </div>


                      <h3>
                        {lote.nombre}
                      </h3>


                      <span className="lote-codigo">
                        {lote.codigo}
                      </span>


                      <div className="lote-datos">

                        <div>
                          <span>
                            Área
                          </span>

                          <strong>
                            {lote.areaM2 ??
                              0}{" "}
                            m²
                          </strong>
                        </div>


                        <div>
                          <span>
                            Filas
                          </span>

                          <strong>
                            {lote.numeroFilasPlan ??
                              0}
                          </strong>
                        </div>


                        <div>
                          <span>
                            Plantas/fila
                          </span>

                          <strong>
                            {lote.plantasFilaPlan ??
                              0}
                          </strong>
                        </div>


                        <div>
                          <span>
                            Total plantas
                          </span>

                          <strong>
                            {total}
                          </strong>
                        </div>

                      </div>


                      <button className="ver-mapa-button" onClick={() => navigate(`/lotes/${lote.idLote}/grupos`)}>Grupos de plantas</button>
                      <button className="ver-mapa-button" onClick={() => navigate(`/lotes/${lote.idLote}/jornadas`)}>Jornadas diarias</button>
                      <button
                        className="ver-mapa-button"
                        onClick={() =>
                          navigate(
                            `/mapa/${lote.idLote}`
                          )
                        }
                      >
                        <MapPinned
                          size={17}
                        />

                        Ver mapa
                      </button>
                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>
      )}


      {/* MODAL NUEVA CAMPAÑA */}

      {mostrarModalCampania && (
        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">
              <div>
                <span>
                  NUEVA CAMPAÑA
                </span>

                <h2>
                  Crear campaña agrícola
                </h2>
              </div>


              <button
                className="modal-cerrar"
                onClick={() =>
                  setMostrarModalCampania(
                    false
                  )
                }
              >
                <X size={20} />
              </button>
            </div>


            <form
              onSubmit={
                handleCrearCampania
              }
            >

              <div className="form-grid">

                <label className="form-field">
                  <span>
                    Fundo *
                  </span>

                  <select
                    value={
                      formularioCampania.idFundo
                    }
                    onChange={(e) =>
                      setFormularioCampania(
                        (actual) => ({
                          ...actual,
                          idFundo:
                            e.target.value,
                        })
                      )
                    }
                    required
                  >
                    <option value="">
                      Seleccionar fundo
                    </option>

                    {fundos.map(
                      (fundo) => (
                        <option
                          key={
                            fundo.idFundo
                          }
                          value={
                            fundo.idFundo
                          }
                        >
                          {fundo.nombre}
                        </option>
                      )
                    )}
                  </select>
                </label>


                <label className="form-field">
                  <span>
                    Variedad *
                  </span>

                  <select
                    value={
                      formularioCampania.idVariedad
                    }
                    onChange={(e) =>
                      setFormularioCampania(
                        (actual) => ({
                          ...actual,
                          idVariedad:
                            e.target.value,
                        })
                      )
                    }
                    required
                  >
                    <option value="">
                      Seleccionar variedad
                    </option>

                    {variedades.map(
                      (variedad) => (
                        <option
                          key={
                            variedad.idVariedad
                          }
                          value={
                            variedad.idVariedad
                          }
                        >
                          {variedad.nombre}
                        </option>
                      )
                    )}
                  </select>
                </label>


                <label className="form-field">
                  <span>
                    Código *
                  </span>

                  <input
                    type="text"
                    placeholder="CAM-2026-02"
                    value={
                      formularioCampania.codigo
                    }
                    onChange={(e) =>
                      setFormularioCampania(
                        (actual) => ({
                          ...actual,
                          codigo:
                            e.target.value,
                        })
                      )
                    }
                    required
                  />
                </label>


                <label className="form-field">
                  <span>
                    Fecha de inicio *
                  </span>

                  <input
                    type="date"
                    value={
                      formularioCampania.fechaInicio
                    }
                    onChange={(e) =>
                      setFormularioCampania(
                        (actual) => ({
                          ...actual,
                          fechaInicio:
                            e.target.value,
                        })
                      )
                    }
                    required
                  />
                </label>


                <label className="form-field form-field-full">
                  <span>
                    Nombre *
                  </span>

                  <input
                    type="text"
                    placeholder="Campaña Maíz Moche 2026-II"
                    value={
                      formularioCampania.nombre
                    }
                    onChange={(e) =>
                      setFormularioCampania(
                        (actual) => ({
                          ...actual,
                          nombre:
                            e.target.value,
                        })
                      )
                    }
                    required
                  />
                </label>


                <label className="form-field form-field-full">
                  <span>
                    Observaciones
                  </span>

                  <textarea
                    rows={3}
                    placeholder="Información adicional de la campaña..."
                    value={
                      formularioCampania.observaciones ??
                      ""
                    }
                    onChange={(e) =>
                      setFormularioCampania(
                        (actual) => ({
                          ...actual,
                          observaciones:
                            e.target.value,
                        })
                      )
                    }
                  />
                </label>

              </div>


              <div className="modal-acciones">

                <button
                  type="button"
                  className="boton-secundario"
                  onClick={() =>
                    setMostrarModalCampania(
                      false
                    )
                  }
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="boton-principal"
                  disabled={
                    guardandoCampania
                  }
                >
                  {guardandoCampania
                    ? "Creando..."
                    : "Crear campaña"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* MODAL NUEVO LOTE */}

      {mostrarModalLote &&
        campaniaSeleccionada && (
        <div className="modal-overlay">

          <div className="modal-card modal-lote">

            <div className="modal-header">
              <div>
                <span>
                  NUEVO LOTE
                </span>

                <h2>
                  Crear lote
                </h2>

                <p>
                  {
                    campaniaSeleccionada.nombre
                  }
                </p>
              </div>


              <button
                className="modal-cerrar"
                onClick={() =>
                  setMostrarModalLote(
                    false
                  )
                }
              >
                <X size={20} />
              </button>
            </div>


            <form
              onSubmit={
                handleCrearLote
              }
            >

              <div className="form-grid">

                <label className="form-field">
                  <span>
                    Código *
                  </span>

                  <input
                    type="text"
                    placeholder="L02"
                    value={
                      formularioLote.codigo
                    }
                    onChange={(e) =>
                      setFormularioLote(
                        (actual) => ({
                          ...actual,
                          codigo:
                            e.target.value,
                        })
                      )
                    }
                    required
                  />
                </label>


                <label className="form-field">
                  <span>
                    Nombre *
                  </span>

                  <input
                    type="text"
                    placeholder="Lote 02"
                    value={
                      formularioLote.nombre
                    }
                    onChange={(e) =>
                      setFormularioLote(
                        (actual) => ({
                          ...actual,
                          nombre:
                            e.target.value,
                        })
                      )
                    }
                    required
                  />
                </label>


                <label className="form-field">
                  <span>
                    Área (m²) *
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      formularioLote.areaM2 ||
                      ""
                    }
                    onChange={(e) =>
                      setFormularioLote(
                        (actual) => ({
                          ...actual,

                          areaM2:
                            Number(
                              e.target.value
                            ),
                        })
                      )
                    }
                    required
                  />
                </label>


                <label className="form-field">
                  <span>
                    Fecha de siembra
                  </span>

                  <input
                    type="date"
                    value={
                      formularioLote.fechaSiembra ??
                      ""
                    }
                    onChange={(e) =>
                      setFormularioLote(
                        (actual) => ({
                          ...actual,

                          fechaSiembra:
                            e.target.value,
                        })
                      )
                    }
                  />
                </label>


                <label className="form-field">
                  <span>
                    Número de filas *
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={
                      formularioLote.numeroFilas ||
                      ""
                    }
                    onChange={(e) =>
                      setFormularioLote(
                        (actual) => ({
                          ...actual,

                          numeroFilas:
                            Number(
                              e.target.value
                            ),
                        })
                      )
                    }
                    required
                  />
                </label>


                <label className="form-field">
                  <span>
                    Plantas por fila *
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={
                      formularioLote.plantasPorFila ||
                      ""
                    }
                    onChange={(e) =>
                      setFormularioLote(
                        (actual) => ({
                          ...actual,

                          plantasPorFila:
                            Number(
                              e.target.value
                            ),
                        })
                      )
                    }
                    required
                  />
                </label>


                <label className="form-field form-field-full">
                  <span>
                    Observaciones
                  </span>

                  <textarea
                    rows={3}
                    placeholder="Información adicional del lote..."
                    value={
                      formularioLote.observaciones ??
                      ""
                    }
                    onChange={(e) =>
                      setFormularioLote(
                        (actual) => ({
                          ...actual,

                          observaciones:
                            e.target.value,
                        })
                      )
                    }
                  />
                </label>

              </div>


              <div className="vista-previa-lote">

                <div>
                  <span>
                    Filas
                  </span>

                  <strong>
                    {formularioLote.numeroFilas ||
                      0}
                  </strong>
                </div>


                <div>
                  <span>
                    Plantas por fila
                  </span>

                  <strong>
                    {formularioLote.plantasPorFila ||
                      0}
                  </strong>
                </div>


                <div className="vista-previa-total">
                  <span>
                    Plantas que se crearán
                  </span>

                  <strong>
                    {totalPlantas}
                  </strong>
                </div>

              </div>


              <p className="texto-ayuda">
                Las filas y plantas serán generadas
                automáticamente al crear el lote.
              </p>


              <div className="modal-acciones">

                <button
                  type="button"
                  className="boton-secundario"
                  onClick={() =>
                    setMostrarModalLote(
                      false
                    )
                  }
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="boton-principal"
                  disabled={
                    guardandoLote
                  }
                >
                  {guardandoLote
                    ? "Creando..."
                    : "Crear lote"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* CONFIRMACIÓN FINALIZAR */}

      {mostrarConfirmacionFinalizar && campaniaSeleccionada && <ResumenCierreModal
        key={campaniaSeleccionada.idCampania}
        campania={campaniaSeleccionada} finalizando={finalizando} errorCierre={error}
        cancelar={() => setMostrarConfirmacionFinalizar(false)} finalizar={() => { void handleFinalizarCampania(); }}
      />}

    </div>
  );
}