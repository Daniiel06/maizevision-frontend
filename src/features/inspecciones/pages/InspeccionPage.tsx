import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  FileImage,
  ImagePlus,
  Images,
  Info,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  analizarImagen,
  subirImagenInspeccion,
  validarDiagnostico,
  obtenerClasesDiagnostico,
} from "../api/inspeccionesApi";

import type {
  AnalizarImagenResponse,
  SubirImagenResponse,
  ClaseDiagnosticoResponse,
} from "../api/inspeccionesApi";

import "./InspeccionPage.css";


export default function InspeccionPage() {
  const {
    idInspeccion,
  } = useParams();

  const navigate =
    useNavigate();


  /*
   * Inputs ocultos.
   *
   * Uno abre la cámara en dispositivos
   * compatibles y el otro abre galería /
   * explorador de archivos.
   */
  const inputCamaraRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const inputGaleriaRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const [
    archivo,
    setArchivo,
  ] =
    useState<File | null>(
      null
    );


  const [
    preview,
    setPreview,
  ] =
    useState<string | null>(
      null
    );


  const [
    imagenGuardada,
    setImagenGuardada,
  ] =
    useState<SubirImagenResponse | null>(
      null
    );


  const [
    resultado,
    setResultado,
  ] =
    useState<AnalizarImagenResponse | null>(
      null
    );


  const [
    procesando,
    setProcesando,
  ] =
    useState(false);


  const [
    mensaje,
    setMensaje,
  ] =
    useState("");


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    clases,
    setClases,
  ] =
    useState<
      ClaseDiagnosticoResponse[]
    >([]);


  const [
    idClaseReal,
    setIdClaseReal,
  ] =
    useState("");


  const [
    observaciones,
    setObservaciones,
  ] =
    useState("");


  const [
    validando,
    setValidando,
  ] =
    useState(false);


  const [
    validacionExitosa,
    setValidacionExitosa,
  ] =
    useState(false);


  /* =====================================================
     LIBERAR PREVIEW
  ===================================================== */

  useEffect(() => {
    return () => {
      if (
        preview
      ) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [preview]);


  /* =====================================================
     CARGAR CLASES
  ===================================================== */

  useEffect(() => {
    const cargarClases =
      async () => {
        try {
          const data =
            await obtenerClasesDiagnostico();


          setClases(
            data
          );
        } catch (error) {
          console.error(
            "No se pudieron cargar las clases:",
            error
          );
        }
      };


    cargarClases();
  }, []);


  /* =====================================================
     LIMPIAR RESULTADOS DE UNA FOTO ANTERIOR
  ===================================================== */

  const limpiarResultadoAnterior =
    () => {
      setResultado(
        null
      );

      setImagenGuardada(
        null
      );

      setMensaje("");

      setError("");

      setIdClaseReal("");

      setObservaciones("");

      setValidacionExitosa(
        false
      );
    };


  /* =====================================================
     SELECCIONAR IMAGEN
  ===================================================== */

  const handleSeleccionarImagen = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const imagen =
      event.target.files?.[0];


    if (!imagen) {
      return;
    }


    limpiarResultadoAnterior();


    const tiposPermitidos =
      [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];


    if (
      !tiposPermitidos.includes(
        imagen.type
      )
    ) {
      setError(
        "Solo se permiten imágenes JPG, JPEG, PNG o WEBP."
      );

      event.target.value =
        "";

      return;
    }


    const maximoBytes =
      10 *
      1024 *
      1024;


    if (
      imagen.size >
      maximoBytes
    ) {
      setError(
        "La imagen no puede superar los 10 MB."
      );

      event.target.value =
        "";

      return;
    }


    if (
      preview
    ) {
      URL.revokeObjectURL(
        preview
      );
    }


    setArchivo(
      imagen
    );


    setPreview(
      URL.createObjectURL(
        imagen
      )
    );


    /*
     * Permitirá volver a seleccionar
     * exactamente el mismo archivo.
     */
    event.target.value =
      "";
  };


  /* =====================================================
     QUITAR IMAGEN
  ===================================================== */

  const handleQuitarImagen =
    () => {
      if (
        preview
      ) {
        URL.revokeObjectURL(
          preview
        );
      }


      setArchivo(
        null
      );

      setPreview(
        null
      );

      setImagenGuardada(
        null
      );

      setResultado(
        null
      );

      setMensaje("");

      setError("");

      setIdClaseReal("");

      setObservaciones("");

      setValidacionExitosa(
        false
      );
    };


  /* =====================================================
     REPETIR FOTO
  ===================================================== */

  const handleTomarOtraFoto =
    () => {
      handleQuitarImagen();


      window.setTimeout(
        () => {
          inputCamaraRef
            .current
            ?.click();
        },
        50
      );
    };


  /* =====================================================
     ANALIZAR
  ===================================================== */

  const handleAnalizarImagen =
    async () => {
      if (
        !archivo
      ) {
        setError(
          "Debe seleccionar o tomar una fotografía."
        );

        return;
      }


      if (
        !idInspeccion
      ) {
        setError(
          "No se encontró la inspección."
        );

        return;
      }


      try {
        setProcesando(
          true
        );

        setError("");

        setMensaje("");

        setResultado(
          null
        );

        setIdClaseReal("");

        setObservaciones("");

        setValidacionExitosa(
          false
        );


        /*
         * Si la fotografía ya fue guardada
         * y únicamente falló la inferencia,
         * evitamos volver a almacenarla.
         */
        let imagenActual =
          imagenGuardada;


        if (
          !imagenActual
        ) {
          setMensaje(
            "Guardando fotografía de la hoja..."
          );


          imagenActual =
            await subirImagenInspeccion(
              idInspeccion,
              archivo
            );


          setImagenGuardada(
            imagenActual
          );
        }


        setMensaje(
          "Analizando la hoja con EfficientNet..."
        );


        const diagnostico =
          await analizarImagen(
            idInspeccion,
            imagenActual.idImagen,
            archivo
          );


        setResultado(
          diagnostico
        );


        setMensaje(
          "Diagnóstico realizado correctamente."
        );
      } catch (error: any) {
        console.error(
          "Error durante el diagnóstico:",
          error
        );


        console.error(
          "Respuesta backend:",
          error?.response?.data
        );


        const mensajeBackend =
          error?.response?.data
            ?.mensaje ||
          error?.response?.data
            ?.title ||
          error?.response?.data
            ?.detail ||
          error?.message ||
          "No se pudo analizar la imagen.";


        setError(
          mensajeBackend
        );
      } finally {
        setProcesando(
          false
        );
      }
    };


  /* =====================================================
     VALIDAR DIAGNÓSTICO
  ===================================================== */

  const handleValidarDiagnostico =
    async () => {
      if (
        !resultado
      ) {
        setError(
          "No existe un diagnóstico para validar."
        );

        return;
      }


      if (
        !idClaseReal
      ) {
        setError(
          "Debe seleccionar la clase real."
        );

        return;
      }


      try {
        setValidando(
          true
        );

        setError("");

        setValidacionExitosa(
          false
        );


        const response =
          await validarDiagnostico(
            resultado.idDiagnostico,
            {
              idClaseReal,

              observaciones:
                observaciones.trim() ||
                undefined,
            }
          );


        setMensaje(
          response.mensaje
        );


        setValidacionExitosa(
          true
        );
      } catch (error: any) {
        console.error(
          "Error validando diagnóstico:",
          error
        );


        const mensajeBackend =
          error?.response?.data
            ?.mensaje ||
          error?.response?.data
            ?.title ||
          error?.response?.data
            ?.detail ||
          error?.message ||
          "No se pudo validar el diagnóstico.";


        setError(
          mensajeBackend
        );
      } finally {
        setValidando(
          false
        );
      }
    };


  /* =====================================================
     DATOS RESULTADO
  ===================================================== */

  const porcentajeConfianza =
    resultado
      ? resultado.confianza *
        100
      : 0;


  const confianzaBaja =
    resultado &&
    porcentajeConfianza <
      60;


  const confianzaMedia =
    resultado &&
    porcentajeConfianza >=
      60 &&
    porcentajeConfianza <
      80;


  const nivelConfianza =
    porcentajeConfianza >=
    80
      ? "Alta"
      : porcentajeConfianza >=
        60
      ? "Media"
      : "Baja";


  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="inspeccion-page">

      {/* Inputs ocultos */}

      <input
        ref={
          inputCamaraRef
        }
        className="input-imagen-oculto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={
          handleSeleccionarImagen
        }
        disabled={
          procesando
        }
      />


      <input
        ref={
          inputGaleriaRef
        }
        className="input-imagen-oculto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={
          handleSeleccionarImagen
        }
        disabled={
          procesando
        }
      />


      {/* ================================================
          HEADER
      ================================================ */}

      <header className="inspeccion-header">

        <button
          type="button"
          className="inspeccion-volver"
          onClick={() =>
            navigate(-1)
          }
        >
          <ArrowLeft
            size={17}
          />

          Volver
        </button>


        <div className="inspeccion-header-titulo">

          <span>
            INSPECCIÓN FITOSANITARIA
          </span>

          <h1>
            Diagnóstico de planta
          </h1>

          <p>
            Captura una fotografía clara de la hoja
            de maíz y analiza posibles síntomas
            mediante inteligencia artificial.
          </p>

        </div>

      </header>


      {/* ================================================
          PASOS
      ================================================ */}

      <section className="inspeccion-pasos">

        <Paso
          numero="1"
          titulo="Capturar"
          descripcion="Fotografía de la hoja"
          activo={
            !archivo
          }
          completado={
            !!archivo
          }
        />


        <div className="paso-linea" />


        <Paso
          numero="2"
          titulo="Analizar"
          descripcion="Procesamiento IA"
          activo={
            !!archivo &&
            !resultado
          }
          completado={
            !!resultado
          }
        />


        <div className="paso-linea" />


        <Paso
          numero="3"
          titulo="Resultado"
          descripcion="Diagnóstico"
          activo={
            !!resultado
          }
          completado={
            !!resultado
          }
        />

      </section>


      {/* ================================================
          CAPTURA
      ================================================ */}

      <section className="inspeccion-card captura-card">

        <div className="card-titulo">

          <div className="card-icono">
            <Camera
              size={22}
            />
          </div>


          <div>

            <span>
              PASO 1
            </span>

            <h2>
              Fotografía de la hoja
            </h2>

            <p>
              Procura que la hoja ocupe gran parte de
              la imagen, esté enfocada y tenga buena
              iluminación.
            </p>

          </div>

        </div>


        {!preview ? (
          <div className="captura-area">

            <div className="captura-ilustracion">

              <div className="captura-icono-principal">
                <ImagePlus
                  size={48}
                />
              </div>


              <h3>
                Agrega una fotografía
              </h3>


              <p>
                Puedes tomarla en este momento con
                la cámara trasera del celular o
                seleccionar una imagen existente.
              </p>

            </div>


            <div className="captura-botones">

              <button
                type="button"
                className="boton-camara"
                onClick={() =>
                  inputCamaraRef
                    .current
                    ?.click()
                }
                disabled={
                  procesando
                }
              >
                <Camera
                  size={21}
                />

                <div>
                  <strong>
                    Tomar foto
                  </strong>

                  <span>
                    Usar cámara trasera
                  </span>
                </div>
              </button>


              <button
                type="button"
                className="boton-galeria"
                onClick={() =>
                  inputGaleriaRef
                    .current
                    ?.click()
                }
                disabled={
                  procesando
                }
              >
                <Images
                  size={21}
                />

                <div>
                  <strong>
                    Subir imagen
                  </strong>

                  <span>
                    Elegir desde galería
                  </span>
                </div>
              </button>

            </div>


            <div className="consejos-captura">

              <Consejo
                texto="Hoja completa o área afectada visible"
              />

              <Consejo
                texto="Imagen enfocada y sin movimiento"
              />

              <Consejo
                texto="Buena iluminación y sin sombras fuertes"
              />

            </div>

          </div>
        ) : (
          <div className="captura-con-preview">

            <div className="imagen-preview">

              <img
                src={
                  preview
                }
                alt="Hoja de maíz seleccionada"
              />


              <div className="imagen-preview-badge">

                <CheckCircle2
                  size={15}
                />

                Fotografía lista

              </div>

            </div>


            <aside className="preview-panel">

              <div className="preview-panel-header">

                <FileImage
                  size={20}
                />

                <div>
                  <strong>
                    Imagen seleccionada
                  </strong>

                  <span>
                    Lista para análisis
                  </span>
                </div>

              </div>


              {archivo && (
                <div className="archivo-datos">

                  <DatoArchivo
                    titulo="Archivo"
                    valor={
                      archivo.name
                    }
                  />


                  <DatoArchivo
                    titulo="Tamaño"
                    valor={`${(
                      archivo.size /
                      1024 /
                      1024
                    ).toFixed(
                      2
                    )} MB`}
                  />


                  <DatoArchivo
                    titulo="Formato"
                    valor={
                      obtenerNombreFormato(
                        archivo.type
                      )
                    }
                  />

                </div>
              )}


              {!resultado && (
                <div className="preview-checklist">

                  <strong>
                    Antes de analizar
                  </strong>


                  <Consejo
                    texto="Verifica que la hoja esté visible"
                  />

                  <Consejo
                    texto="Confirma que la fotografía esté enfocada"
                  />

                  <Consejo
                    texto="Evita objetos que oculten la lesión"
                  />

                </div>
              )}


              <div className="preview-acciones">

                <button
                  type="button"
                  className="boton-quitar"
                  onClick={
                    handleQuitarImagen
                  }
                  disabled={
                    procesando
                  }
                >
                  <Trash2
                    size={16}
                  />

                  Quitar
                </button>


                <button
                  type="button"
                  className="boton-repetir"
                  onClick={
                    handleTomarOtraFoto
                  }
                  disabled={
                    procesando
                  }
                >
                  <RefreshCw
                    size={16}
                  />

                  Otra foto
                </button>

              </div>

            </aside>

          </div>
        )}


        {/* ================================================
            ANALIZAR
        ================================================ */}

        {archivo && (
          <div className="analizar-zona">

            <div>

              <span>
                PASO 2
              </span>

              <strong>
                Analizar con inteligencia artificial
              </strong>

              <p>
                EfficientNet procesará la imagen para
                identificar la clase con mayor
                confianza.
              </p>

            </div>


            <button
              type="button"
              className="boton-analizar"
              onClick={
                handleAnalizarImagen
              }
              disabled={
                procesando
              }
            >

              {procesando ? (
                <>
                  <RefreshCw
                    size={19}
                    className="icono-girando"
                  />

                  Procesando...
                </>
              ) : (
                <>
                  <ScanSearch
                    size={19}
                  />

                  Analizar hoja
                </>
              )}

            </button>

          </div>
        )}


        {/* ================================================
            ESTADO PROCESAMIENTO
        ================================================ */}

        {procesando && (
          <div className="procesando-card">

            <div className="procesando-icono">

              <Sparkles
                size={22}
              />

            </div>


            <div className="procesando-contenido">

              <strong>
                Analizando fotografía
              </strong>

              <span>
                {mensaje ||
                  "Procesando imagen..."}
              </span>


              <div className="procesando-barra">

                <div />

              </div>

            </div>

          </div>
        )}


        {/* ================================================
            MENSAJE
        ================================================ */}

        {mensaje &&
          !procesando &&
          !resultado && (
          <div className="mensaje mensaje-exito">

            <CheckCircle2
              size={18}
            />

            <span>
              {mensaje}
            </span>

          </div>
        )}


        {/* ================================================
            ERROR
        ================================================ */}

        {error && (
          <div className="mensaje mensaje-error">

            <XCircle
              size={18}
            />

            <span>
              {error}
            </span>

          </div>
        )}

      </section>


      {/* ================================================
          RESULTADO IA
      ================================================ */}

      {resultado && (
        <section className="resultado-card">

          <div className="resultado-header">

            <div className="resultado-header-icono">

              <ScanSearch
                size={26}
              />

            </div>


            <div>

              <span>
                RESULTADO DEL MODELO
              </span>

              <h2>
                Diagnóstico por inteligencia artificial
              </h2>

              <p>
                Resultado obtenido a partir de la
                fotografía registrada.
              </p>

            </div>

          </div>


          <div className="resultado-grid">

            <div className="resultado-principal">

              <span>
                Clase identificada
              </span>


              <h3>
                {resultado.nombreClase}
              </h3>


              <div
                className={`confianza-badge confianza-${obtenerClaseConfianza(
                  porcentajeConfianza
                )}`}
              >

                <ShieldCheck
                  size={17}
                />

                Confianza {nivelConfianza}

              </div>

            </div>


            <div className="resultado-confianza">

              <div className="confianza-circulo">

                <strong>
                  {porcentajeConfianza.toFixed(
                    1
                  )}
                  %
                </strong>

                <span>
                  confianza
                </span>

              </div>


              <div className="confianza-barra">

                <div
                  className={`confianza-progreso confianza-progreso-${obtenerClaseConfianza(
                    porcentajeConfianza
                  )}`}
                  style={{
                    width: `${Math.min(
                      100,
                      porcentajeConfianza
                    )}%`,
                  }}
                />

              </div>

            </div>

          </div>


          {/* BAJA CONFIANZA */}

          {confianzaBaja && (
            <div className="alerta-confianza alerta-baja">

              <AlertTriangle
                size={21}
              />

              <div>

                <strong>
                  Confianza baja
                </strong>

                <p>
                  Se recomienda tomar otra fotografía
                  más cercana, enfocada y con mejor
                  iluminación antes de utilizar este
                  resultado.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  handleTomarOtraFoto
                }
              >

                <Camera
                  size={16}
                />

                Repetir foto

              </button>

            </div>
          )}


          {/* CONFIANZA MEDIA */}

          {confianzaMedia && (
            <div className="alerta-confianza alerta-media">

              <Info
                size={20}
              />

              <div>

                <strong>
                  Confianza moderada
                </strong>

                <p>
                  El resultado es utilizable, aunque
                  una fotografía más clara podría
                  mejorar la confianza del diagnóstico.
                </p>

              </div>

            </div>
          )}


          {/* TIEMPOS */}

          <div className="resultado-metricas">

            <div>

              <Clock
                size={18}
              />

              <span>
                Inferencia
              </span>

              <strong>
                {
                  resultado
                    .tiempoInferenciaMs
                }{" "}
                ms
              </strong>

            </div>


            <div>

              <Clock
                size={18}
              />

              <span>
                Tiempo total
              </span>

              <strong>
                {
                  resultado
                    .tiempoTotalMs
                }{" "}
                ms
              </strong>

            </div>


            <div>

              <CheckCircle2
                size={18}
              />

              <span>
                Estado
              </span>

              <strong>
                Analizado
              </strong>

            </div>

          </div>


          {/* ================================================
              VALIDACIÓN
          ================================================ */}

          <div className="validacion-card">

            <div className="validacion-header">

              <div className="validacion-icono">

                <ShieldCheck
                  size={22}
                />

              </div>


              <div>

                <span>
                  VALIDACIÓN PARA INVESTIGACIÓN
                </span>

                <h3>
                  Comparar con la clase real
                </h3>

                <p>
                  Registra la clase observada por el
                  evaluador para comparar el resultado
                  de la IA.
                </p>

              </div>

            </div>


            <div className="validacion-grid">

              <label className="campo-validacion">

                <span>
                  Clase real
                </span>


                <select
                  value={
                    idClaseReal
                  }
                  onChange={(event) =>
                    setIdClaseReal(
                      event.target.value
                    )
                  }
                  disabled={
                    validando ||
                    validacionExitosa
                  }
                >

                  <option value="">
                    Seleccionar clase real
                  </option>


                  {clases.map(
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
                        {" — "}
                        {clase.tipo}
                      </option>
                    )
                  )}

                </select>

              </label>


              <label className="campo-validacion">

                <span>
                  Observaciones
                </span>


                <textarea
                  value={
                    observaciones
                  }
                  onChange={(event) =>
                    setObservaciones(
                      event.target.value
                    )
                  }
                  disabled={
                    validando ||
                    validacionExitosa
                  }
                  placeholder="Observación opcional del evaluador..."
                  rows={4}
                />

              </label>

            </div>


            <div className="validacion-acciones">

              <button
                type="button"
                className="boton-validar"
                onClick={
                  handleValidarDiagnostico
                }
                disabled={
                  !idClaseReal ||
                  validando ||
                  validacionExitosa
                }
              >

                {validacionExitosa ? (
                  <>
                    <Check
                      size={17}
                    />

                    Diagnóstico validado
                  </>
                ) : validando ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="icono-girando"
                    />

                    Validando...
                  </>
                ) : (
                  <>
                    <ShieldCheck
                      size={17}
                    />

                    Validar diagnóstico
                  </>
                )}

              </button>

            </div>


            {validacionExitosa && (
              <div className="validacion-exito">

                <CheckCircle2
                  size={18}
                />

                <span>
                  La clase real fue registrada
                  correctamente.
                </span>

              </div>
            )}

          </div>


          <div className="resultado-id">

            ID diagnóstico:{" "}

            <span>
              {resultado.idDiagnostico}
            </span>

          </div>

        </section>
      )}


      {/* ================================================
          ID INSPECCIÓN
      ================================================ */}

      <footer className="inspeccion-footer">

        Inspección:{" "}

        <span>
          {idInspeccion}
        </span>

      </footer>

    </div>
  );
}


/* =====================================================
   COMPONENTES PEQUEÑOS
===================================================== */

function Paso({
  numero,
  titulo,
  descripcion,
  activo,
  completado,
}: {
  numero: string;
  titulo: string;
  descripcion: string;
  activo: boolean;
  completado: boolean;
}) {
  return (
    <div
      className={[
        "paso",

        activo
          ? "paso-activo"
          : "",

        completado
          ? "paso-completado"
          : "",
      ].join(" ")}
    >

      <div className="paso-numero">

        {completado ? (
          <Check
            size={15}
          />
        ) : (
          numero
        )}

      </div>


      <div>

        <strong>
          {titulo}
        </strong>

        <span>
          {descripcion}
        </span>

      </div>

    </div>
  );
}


function Consejo({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="consejo-item">

      <CheckCircle2
        size={15}
      />

      <span>
        {texto}
      </span>

    </div>
  );
}


function DatoArchivo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="archivo-dato">

      <span>
        {titulo}
      </span>

      <strong>
        {valor}
      </strong>

    </div>
  );
}


/* =====================================================
   HELPERS
===================================================== */

function obtenerNombreFormato(
  tipo: string
) {
  if (
    tipo ===
    "image/jpeg"
  ) {
    return "JPEG";
  }


  if (
    tipo ===
    "image/png"
  ) {
    return "PNG";
  }


  if (
    tipo ===
    "image/webp"
  ) {
    return "WEBP";
  }


  return tipo;
}


function obtenerClaseConfianza(
  porcentaje: number
) {
  if (
    porcentaje >= 80
  ) {
    return "alta";
  }


  if (
    porcentaje >= 60
  ) {
    return "media";
  }


  return "baja";
}