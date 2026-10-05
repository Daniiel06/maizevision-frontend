import {
  CheckCircle2,
  CircleAlert,
  Edit3,
  MapPinned,
  Plus,
  Power,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { motion } from "framer-motion";

import {
  actualizarFundo,
  buscarUbicaciones,
  cambiarEstadoFundo,
  crearFundo,
  obtenerFundos,
} from "../api/fundosApi";

import UbicacionMapa from "../components/UbicacionMapa";

import type {
  Fundo,
  GuardarFundoRequest,
  ResultadoUbicacion,
} from "../types/fundo.types";

import "./FundosPage.css";


interface Toast {
  tipo:
    | "error"
    | "exito"
    | "info";

  mensaje: string;
}


const formularioInicial:
  GuardarFundoRequest = {
    nombre: "",
    descripcion: "",
    ubicacionReferencia: "",
    latitud: null,
    longitud: null,
  };


export default function FundosPage() {
  const [
    fundos,
    setFundos,
  ] = useState<Fundo[]>([]);


  const [
    cargando,
    setCargando,
  ] = useState(true);


  const [
    guardando,
    setGuardando,
  ] = useState(false);


  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);


  const [
    fundoEditando,
    setFundoEditando,
  ] = useState<Fundo | null>(
    null
  );


  const [
    formulario,
    setFormulario,
  ] =
    useState<GuardarFundoRequest>(
      formularioInicial
    );


  const [
    busqueda,
    setBusqueda,
  ] = useState("");


  const [
    buscando,
    setBuscando,
  ] = useState(false);


  const [
    resultados,
    setResultados,
  ] =
    useState<ResultadoUbicacion[]>(
      []
    );


  const [
    toast,
    setToast,
  ] = useState<Toast | null>(
    null
  );


  const mostrarToast = (
    mensaje: string,
    tipo: Toast["tipo"]
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
        () =>
          setToast(null),
        4000
      );


    return () =>
      window.clearTimeout(
        timer
      );
  }, [toast]);


  const cargarFundos =
    async () => {
      try {
        const data =
          await obtenerFundos();

        setFundos(
          data
        );
      } catch (error) {
        console.error(
          error
        );

        mostrarToast(
          "No se pudieron cargar los fundos.",
          "error"
        );
      }
    };


  useEffect(() => {
    const cargar =
      async () => {
        try {
          await cargarFundos();
        } finally {
          setCargando(
            false
          );
        }
      };


    cargar();
  }, []);


  /*
   * NUEVO FUNDO
   */
  const abrirNuevo = () => {
    setFundoEditando(
      null
    );

    setFormulario({
      ...formularioInicial,
    });

    setBusqueda("");

    setResultados([]);

    setModalAbierto(
      true
    );
  };


  /*
   * EDITAR
   */
  const abrirEditar = (
    fundo: Fundo
  ) => {
    setFundoEditando(
      fundo
    );


    setFormulario({
      nombre:
        fundo.nombre,

      descripcion:
        fundo.descripcion ?? "",

      ubicacionReferencia:
        fundo.ubicacionReferencia ??
        "",

      latitud:
        fundo.latitud,

      longitud:
        fundo.longitud,
    });


    setBusqueda(
      fundo.ubicacionReferencia ??
      ""
    );


    setResultados([]);

    setModalAbierto(
      true
    );
  };


  /*
   * BUSCAR LUGAR
   */
  const handleBuscar =
    async () => {
      if (
        busqueda.trim().length <
        2
      ) {
        mostrarToast(
          "Escribe una ciudad, distrito o lugar.",
          "info"
        );

        return;
      }


      try {
        setBuscando(
          true
        );


        const data =
          await buscarUbicaciones(
            busqueda
          );


        setResultados(
          data
        );


        if (
          data.length === 0
        ) {
          mostrarToast(
            "No se encontraron ubicaciones.",
            "info"
          );
        }
      } catch (error) {
        console.error(
          error
        );

        mostrarToast(
          "No se pudo realizar la búsqueda.",
          "error"
        );
      } finally {
        setBuscando(
          false
        );
      }
    };


  /*
   * SELECCIONAR RESULTADO
   */
  const seleccionarResultado = (
    resultado:
      ResultadoUbicacion
  ) => {
    setFormulario(
      actual => ({
        ...actual,

        latitud:
          resultado.latitud,

        longitud:
          resultado.longitud,

        ubicacionReferencia:
          resultado.textoCompleto,
      })
    );


    setBusqueda(
      resultado.textoCompleto
    );


    setResultados([]);
  };


  /*
   * CLICK DIRECTO EN MAPA
   */
  const seleccionarMapa = (
    latitud: number,
    longitud: number
  ) => {
    setFormulario(
      actual => ({
        ...actual,
        latitud,
        longitud,
      })
    );


    mostrarToast(
      "Ubicación del fundo seleccionada en el mapa.",
      "exito"
    );
  };


  /*
   * GUARDAR
   */
  const handleGuardar =
    async (
      event:
        React.FormEvent
    ) => {
      event.preventDefault();


      if (
        !formulario.nombre.trim()
      ) {
        mostrarToast(
          "El nombre del fundo es obligatorio.",
          "error"
        );

        return;
      }


      if (
        formulario.latitud ===
          null ||
        formulario.longitud ===
          null
      ) {
        mostrarToast(
          "Selecciona la ubicación del fundo en el mapa.",
          "error"
        );

        return;
      }


      try {
        setGuardando(
          true
        );


        const datos:
          GuardarFundoRequest =
        {
          nombre:
            formulario.nombre.trim(),

          descripcion:
            formulario.descripcion
              ?.trim() ||
            null,

          ubicacionReferencia:
            formulario
              .ubicacionReferencia
              ?.trim() ||
            busqueda.trim() ||
            "Ubicación seleccionada en mapa",

          latitud:
            formulario.latitud,

          longitud:
            formulario.longitud,
        };


        if (
          fundoEditando
        ) {
          await actualizarFundo(
            fundoEditando.idFundo,
            datos
          );


          mostrarToast(
            "Fundo actualizado correctamente.",
            "exito"
          );
        } else {
          await crearFundo(
            datos
          );


          mostrarToast(
            "Fundo creado correctamente.",
            "exito"
          );
        }


        setModalAbierto(
          false
        );


        await cargarFundos();
      } catch (error: any) {
        console.error(
          error
        );


        mostrarToast(
          error?.response
            ?.data?.mensaje ??
          "No se pudo guardar el fundo.",
          "error"
        );
      } finally {
        setGuardando(
          false
        );
      }
    };


  /*
   * ACTIVAR / DESACTIVAR
   */
  const handleCambiarEstado =
    async (
      fundo: Fundo
    ) => {
      try {
        await cambiarEstadoFundo(
          fundo.idFundo,
          !fundo.activo
        );


        mostrarToast(
          fundo.activo
            ? "Fundo desactivado correctamente."
            : "Fundo activado correctamente.",
          "exito"
        );


        await cargarFundos();
      } catch (error) {
        console.error(
          error
        );

        mostrarToast(
          "No se pudo cambiar el estado del fundo.",
          "error"
        );
      }
    };


  if (cargando) {
    return (
      <p>
        Cargando fundos...
      </p>
    );
  }


  return (
    <div className="fundos-page">

      {toast && (
        <ToastMensaje
          toast={toast}
          cerrar={() =>
            setToast(null)
          }
        />
      )}


      <header className="fundos-header">

        <div>
          <h1>
            Fundos agrícolas
          </h1>

          <p>
            Administra los lugares donde se encuentran
            los cultivos.
          </p>
        </div>


        <button
          className="fundo-boton-principal"
          onClick={
            abrirNuevo
          }
        >
          <Plus
            size={18}
          />

          Nuevo fundo
        </button>

      </header>


      {fundos.length === 0 ? (
        <div className="fundos-vacio">

          <MapPinned
            size={42}
          />

          <h3>
            No existen fundos
          </h3>

          <p>
            Crea el primer fundo para comenzar.
          </p>

        </div>
      ) : (
        <div className="fundos-grid">

          {fundos.map(
            fundo => (
              <article
                key={
                  fundo.idFundo
                }
                className={[
                  "fundo-card",

                  !fundo.activo
                    ? "fundo-inactivo"
                    : "",
                ].join(" ")}
              >

                <div className="fundo-card-header">

                  <div className="fundo-icono">
                    <MapPinned
                      size={22}
                    />
                  </div>


                  <span
                    className={
                      fundo.activo
                        ? "fundo-estado fundo-activo"
                        : "fundo-estado fundo-desactivado"
                    }
                  >
                    {fundo.activo
                      ? "ACTIVO"
                      : "INACTIVO"}
                  </span>

                </div>


                <h3>
                  {fundo.nombre}
                </h3>


                <p className="fundo-ubicacion">
                  {fundo
                    .ubicacionReferencia ??
                    "Ubicación no configurada"}
                </p>


                {fundo.descripcion && (
                  <p className="fundo-descripcion">
                    {fundo.descripcion}
                  </p>
                )}


                <div className="fundo-coordenadas">

                  <span>
                    Ubicación del clima
                  </span>

                  <strong>
                    {fundo.latitud !==
                      null &&
                    fundo.longitud !==
                      null
                      ? "Configurada"
                      : "Pendiente"}
                  </strong>

                </div>


                <div className="fundo-acciones">

                  <button
                    className="fundo-editar"
                    onClick={() =>
                      abrirEditar(
                        fundo
                      )
                    }
                  >
                    <Edit3
                      size={16}
                    />

                    Editar
                  </button>


                  <button
                    className={
                      fundo.activo
                        ? "fundo-desactivar"
                        : "fundo-activar"
                    }
                    onClick={() =>
                      handleCambiarEstado(
                        fundo
                      )
                    }
                  >
                    <Power
                      size={16}
                    />

                    {fundo.activo
                      ? "Desactivar"
                      : "Activar"}
                  </button>

                </div>

              </article>
            )
          )}

        </div>
      )}


      {/* MODAL */}

      {modalAbierto && (
        <div className="fundo-modal-overlay">

          <motion.div
            className="fundo-modal"
            initial={{
              opacity: 0,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
          >

            <div className="fundo-modal-header">

              <div>

                <span>
                  {fundoEditando
                    ? "EDITAR FUNDO"
                    : "NUEVO FUNDO"}
                </span>


                <h2>
                  {fundoEditando
                    ? fundoEditando.nombre
                    : "Crear fundo agrícola"}
                </h2>

              </div>


              <button
                onClick={() =>
                  setModalAbierto(
                    false
                  )
                }
              >
                <X
                  size={20}
                />
              </button>

            </div>


            <form
              onSubmit={
                handleGuardar
              }
            >

              <div className="fundo-form-grid">

                <label className="fundo-form-field">

                  <span>
                    Nombre *
                  </span>

                  <input
                    type="text"
                    placeholder="Fundo Santa Rosa"
                    value={
                      formulario.nombre
                    }
                    onChange={(e) =>
                      setFormulario(
                        actual => ({
                          ...actual,

                          nombre:
                            e.target.value,
                        })
                      )
                    }
                  />

                </label>


                <label className="fundo-form-field">

                  <span>
                    Descripción
                  </span>

                  <textarea
                    rows={3}
                    placeholder="Descripción del fundo..."
                    value={
                      formulario.descripcion ??
                      ""
                    }
                    onChange={(e) =>
                      setFormulario(
                        actual => ({
                          ...actual,

                          descripcion:
                            e.target.value,
                        })
                      )
                    }
                  />

                </label>

              </div>


              <div className="ubicacion-seccion">

                <div className="ubicacion-titulo">

                  <div>
                    <h3>
                      Ubicación del fundo
                    </h3>

                    <p>
                      Busca la zona y luego ajusta el
                      marcador haciendo clic en el mapa.
                    </p>
                  </div>

                </div>


                <div className="ubicacion-buscador">

                  <Search
                    size={18}
                  />

                  <input
                    type="text"
                    value={
                      busqueda
                    }
                    onChange={(e) =>
                      setBusqueda(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                        "Enter"
                      ) {
                        e.preventDefault();

                        handleBuscar();
                      }
                    }}
                    placeholder="Ej. Moche, La Libertad"
                  />


                  <button
                    type="button"
                    onClick={
                      handleBuscar
                    }
                    disabled={
                      buscando
                    }
                  >
                    {buscando
                      ? "Buscando..."
                      : "Buscar"}
                  </button>

                </div>


                {resultados.length >
                  0 && (
                  <div className="ubicacion-resultados">

                    {resultados.map(
                      resultado => (
                        <button
                          key={
                            resultado.id
                          }
                          type="button"
                          onClick={() =>
                            seleccionarResultado(
                              resultado
                            )
                          }
                        >
                          <MapPinned
                            size={16}
                          />

                          <span>
                            {
                              resultado
                                .textoCompleto
                            }
                          </span>
                        </button>
                      )
                    )}

                  </div>
                )}


                <div className="mapa-contenedor">

                  <UbicacionMapa
                    latitud={
                      formulario.latitud
                    }
                    longitud={
                      formulario.longitud
                    }
                    onSeleccionar={
                      seleccionarMapa
                    }
                  />

                </div>


                <div className="ubicacion-seleccionada">

                  <MapPinned
                    size={18}
                  />

                  <div>

                    <span>
                      Ubicación seleccionada
                    </span>

                    <strong>
                      {formulario
                        .ubicacionReferencia ||
                        busqueda ||
                        "Selecciona un lugar en el mapa"}
                    </strong>

                  </div>

                </div>

              </div>


              <div className="fundo-modal-acciones">

                <button
                  type="button"
                  className="fundo-cancelar"
                  onClick={() =>
                    setModalAbierto(
                      false
                    )
                  }
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="fundo-boton-principal"
                  disabled={
                    guardando
                  }
                >
                  {guardando
                    ? "Guardando..."
                    : fundoEditando
                    ? "Guardar cambios"
                    : "Crear fundo"}
                </button>

              </div>

            </form>

          </motion.div>

        </div>
      )}

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
      className={`fundo-toast fundo-toast-${toast.tipo}`}
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

        {toast.tipo ===
        "exito" ? (
          <CheckCircle2
            size={19}
          />
        ) : (
          <CircleAlert
            size={19}
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
      >
        <X
          size={16}
        />
      </button>

    </motion.div>
  );
}