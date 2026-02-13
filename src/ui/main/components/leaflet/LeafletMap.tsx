import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Props = {
  lat?: number;
  lng?: number;
  zoom?: number;
};

export interface LeafletMapHandle {
  setCamera?(lat: number, lng: number, zoom: number, animate?: boolean): void;
  zoomIn?(): void;
  zoomOut?(): void;
  recenterToMashhad?(): void;
}

const DEFAULT_LAT = 36.297;
const DEFAULT_LNG = 59.605;
const DEFAULT_ZOOM = 12;

function LeafletMapInner(
  { lat = DEFAULT_LAT, lng = DEFAULT_LNG, zoom = DEFAULT_ZOOM }: Props,
  ref: React.Ref<LeafletMapHandle>,
) {
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [markerPos, setMarkerPos] = useState<[number, number]>([lat, lng]);

  useImperativeHandle(
    ref,
    () => ({
      setCamera(newLat: number, newLng: number, newZoom: number, animate = true) {
        if (!mapInstanceRef.current) return;
        const target: L.LatLngExpression = [newLat, newLng];
        if (animate) {
          mapInstanceRef.current.flyTo(target, newZoom);
        } else {
          mapInstanceRef.current.setView(target, newZoom);
        }
        setMarkerPos([newLat, newLng]);
      },
      zoomIn() {
        mapInstanceRef.current?.zoomIn();
      },
      zoomOut() {
        mapInstanceRef.current?.zoomOut();
      },
      recenterToMashhad() {
        if (!mapInstanceRef.current) return;
        const target: L.LatLngExpression = [DEFAULT_LAT, DEFAULT_LNG];
        mapInstanceRef.current.flyTo(target, DEFAULT_ZOOM);
        setMarkerPos([DEFAULT_LAT, DEFAULT_LNG]);
      },
    }),
    [],
  );

  useEffect(() => {
    if (!mapInstanceRef.current) {
      setMarkerPos([lat, lng]);
      return;
    }
    const target: L.LatLngExpression = [lat, lng];
    mapInstanceRef.current.flyTo(target, zoom);
    setMarkerPos([lat, lng]);
  }, [lat, lng, zoom]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        whenCreated={map => {
          mapInstanceRef.current = map;
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={markerPos}>
          <Popup>Mashhad City</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

const LeafletMapWeb = forwardRef<LeafletMapHandle, Props>(LeafletMapInner);

export default LeafletMapWeb;
