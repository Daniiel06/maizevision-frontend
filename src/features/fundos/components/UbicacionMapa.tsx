import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import {
  useEffect,
} from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";


const marcadorIcono =
  L.icon({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [
      25,
      41,
    ],

    iconAnchor: [
      12,
      41,
    ],

    popupAnchor: [
      1,
      -34,
    ],

    shadowSize: [
      41,
      41,
    ],
  });


interface Props {
  latitud: number | null;
  longitud: number | null;

  onSeleccionar: (
    latitud: number,
    longitud: number
  ) => void;
}


function ControlMapa({
  latitud,
  longitud,
}: {
  latitud: number | null;
  longitud: number | null;
}) {
  const map =
    useMap();


  useEffect(() => {
    if (
      latitud === null ||
      longitud === null
    ) {
      return;
    }


    map.flyTo(
      [
        latitud,
        longitud,
      ],
      15,
      {
        duration: 0.8,
      }
    );
  }, [
    latitud,
    longitud,
    map,
  ]);


  return null;
}


function ClickMapa({
  onSeleccionar,
}: {
  onSeleccionar: (
    latitud: number,
    longitud: number
  ) => void;
}) {
  useMapEvents({
    click(event) {
      onSeleccionar(
        event.latlng.lat,
        event.latlng.lng
      );
    },
  });


  return null;
}


export default function UbicacionMapa({
  latitud,
  longitud,
  onSeleccionar,
}: Props) {
  /*
   * Centro inicial aproximado:
   * costa norte del Perú.
   *
   * Solo se usa mientras todavía
   * no existe una ubicación elegida.
   */
  const centroInicial:
    [number, number] =
    latitud !== null &&
    longitud !== null
      ? [
          latitud,
          longitud,
        ]
      : [
          -8.1,
          -79.0,
        ];


  return (
    <div className="ubicacion-mapa">

      <MapContainer
        center={
          centroInicial
        }
        zoom={
          latitud !== null
            ? 15
            : 9
        }
        scrollWheelZoom={
          true
        }
        style={{
          width: "100%",
          height: "100%",
        }}
      >

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        <ControlMapa
          latitud={
            latitud
          }
          longitud={
            longitud
          }
        />


        <ClickMapa
          onSeleccionar={
            onSeleccionar
          }
        />


        {latitud !== null &&
          longitud !== null && (
          <Marker
            position={[
              latitud,
              longitud,
            ]}
            icon={
              marcadorIcono
            }
          />
        )}

      </MapContainer>

    </div>
  );
}