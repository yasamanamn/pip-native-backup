import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getBuildings3D, getBuildingByCode, BuildingInfo, StoryInfo, LayerInfo } from '../../../../services/buildings.service3D';

const FLOOR_APPLICATION_FA: Record<string, string> = { residential: 'مسکونی', commercial: 'تجاری', office: 'اداری' };
const LAYER_FA: Record<string, string> = { default: 'لایه' };
const LAYER_ICON_COLOR: Record<string, string> = { default: '#0ea5e9' };

const DEFAULT_CENTER: [number, number] = [59.59, 36.31];
const DEFAULT_ZOOM = 12;
const BASE_TMS_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const baseStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: { 'mashhad-base': { type: 'raster', tiles: [BASE_TMS_URL], tileSize: 256 } },
  layers: [{ id: 'mashhad-base', type: 'raster', source: 'mashhad-base' }],
};



export default function Map3DWeb() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const selectedIdRef = useRef<string | null>(null);
  const buildingCacheRef = useRef<Map<string, BuildingInfo>>(new Map());

  const [selectedStory, setSelectedStory] = useState<StoryInfo | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);
  const [loadingBuilding, setLoadingBuilding] = useState(false);

  const storyLink = useMemo(() => selectedStory ? `/projects/${encodeURIComponent(selectedStory.renovationCode)}` : null, [selectedStory]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: baseStyle,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 55,
      bearing: 0,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left');
    mapRef.current = map;

    map.on('load', async () => {
      const buildingsData = await getBuildings3D();
      map.addSource('buildings', { type: 'geojson', data: buildingsData });

      map.addLayer({
        id: 'building-stories',
        type: 'fill-extrusion',
        source: 'buildings',
        paint: {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#0ea5e9',
            [
              'case',
              ['==', ['%', ['get', 'storyIndex'], 2], 0],
              '#f97316',
              '#db2777',
            ],
          ],
          'fill-extrusion-height': ['*', ['get', 'height'], 3],
          'fill-extrusion-base': ['get', 'baseHeight'],
          'fill-extrusion-opacity': 0.85,
        },
      });

      mapReadyRef.current = true;
    });

    const handleClick = async (event: maplibregl.MapMouseEvent) => {
      if (!mapReadyRef.current) return;
      const features = map.queryRenderedFeatures(event.point, { layers: ['building-stories'] });
      if (!features.length) return;
      const feature = features[0];
      const props = feature.properties as unknown as StoryInfo;

      setSelectedLayer(null);
      setSelectedStory({ ...props });

      if (selectedIdRef.current) map.setFeatureState({ source: 'buildings', id: selectedIdRef.current }, { selected: false });
      if (feature.id != null) {
        selectedIdRef.current = String(feature.id);
        map.setFeatureState({ source: 'buildings', id: selectedIdRef.current }, { selected: true });
      }

      const cacheKey = props.renovationCode;
      const cached = buildingCacheRef.current.get(cacheKey);
      if (cached) { setSelectedBuilding(cached); return; }

      setLoadingBuilding(true);
      try {
        const building = await getBuildingByCode(cacheKey);
        buildingCacheRef.current.set(cacheKey, building);
        setSelectedBuilding(building);
      } finally { setLoadingBuilding(false); }
    };

    const handleMove = (event: maplibregl.MapMouseEvent) => {
      if (!map.isStyleLoaded() || !map.getLayer('building-stories')) {
        map.getCanvas().style.cursor = '';
        return;
      }
      const features = map.queryRenderedFeatures(event.point, { layers: ['building-stories'] });
      map.getCanvas().style.cursor = features.length ? 'pointer' : '';
    };

    map.on('click', handleClick);
    map.on('mousemove', handleMove);

    return () => { map.off('click', handleClick); map.off('mousemove', handleMove); map.remove(); mapRef.current = null; };
  }, []);

  const handleResetView = () => mapRef.current?.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, pitch: 45, bearing: 0 });

  const handleCloseModal = () => {
    const map = mapRef.current;
    if (!map) { setSelectedStory(null); return; }
    if (selectedIdRef.current) map.setFeatureState({ source: 'buildings', id: selectedIdRef.current }, { selected: false });
    selectedIdRef.current = null;
    setSelectedBuilding(null);
    setSelectedFloorId(null);
    setSelectedLayer(null);
    setSelectedStory(null);
  };

  const selectedFloor = useMemo(() => {
    if (!selectedBuilding) return null;
    if (selectedFloorId) return selectedBuilding.floors.find(f => f.id === selectedFloorId) ?? null;
    const aboveFloors = selectedBuilding.floors.filter(f => !f.isSite && !f.isHalf && f.number >= 0).sort((a, b) => a.number - b.number);
    if (!selectedStory || !aboveFloors.length) return null;
    const idx = Math.max(0, Math.min(aboveFloors.length - 1, selectedStory.storyIndex - 1));
    return aboveFloors[idx] ?? null;
  }, [selectedBuilding, selectedFloorId, selectedStory]);

  useEffect(() => { if (selectedFloor) setSelectedFloorId(selectedFloor.id); }, [selectedFloor]);

  const getFloorApplicationLabel = (app: string) => FLOOR_APPLICATION_FA[app] ?? String(app ?? '');
  const getLayerLabel = (type: string) => LAYER_FA[type] ?? 'لایه';
  const getLayerColor = (type: string) => LAYER_ICON_COLOR[type] ?? LAYER_ICON_COLOR.default;

  return (
    <div className="relative h-full min-h-screen">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }} />
      <button title="بازگشت به مرکز نقشه" onClick={handleResetView} className="absolute bottom-4 left-4 z-20 rounded-3xl border bg-white p-2 shadow">
        <CurrentPositionIcon />
      </button>

      {selectedStory && (
        <div className="absolute right-6 top-6 z-30 flex max-h-[80vh] w-[420px] flex-col gap-4 overflow-y-auto rounded-2xl border bg-white p-4 shadow-xl">
          {/* Story Panel */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-600">ساختمان انتخاب‌شده</div>
                <div className="text-base font-semibold text-gray-900">{selectedStory.projectName}</div>
                <div className="text-xs text-gray-700">کد پروژه: {selectedStory.renovationCode}</div>
              </div>
              <button className="text-xs text-gray-600 hover:text-gray-900" onClick={handleCloseModal}>بستن</button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-white p-2 text-center text-gray-800 shadow-sm">طبقه {selectedStory.storyIndex} از {selectedStory.storyCount}</div>
              <div className="rounded-lg bg-white p-2 text-center text-gray-800 shadow-sm">ارتفاع تا این طبقه: {Math.round(selectedStory.height)} متر</div>
            </div>
            {storyLink && <a href={storyLink} className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-sky-600 px-3 py-2 text-xs text-white hover:bg-sky-700">مشاهده جزئیات پروژه</a>}
          </div>

          {/* Floor Panel */}
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">نمای طبقه</div>
              {loadingBuilding && <div className="text-xs text-gray-500">در حال دریافت اطلاعات...</div>}
            </div>

            {!selectedBuilding && !loadingBuilding && <div className="mt-3 text-xs text-gray-600">برای مشاهده جزئیات طبقه، یک ساختمان را انتخاب کنید.</div>}

            {selectedBuilding && selectedFloor && (
              <>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {selectedBuilding.floors.map(floor => (
                    <button key={floor.id} onClick={() => setSelectedFloorId(floor.id)}
                      className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${selectedFloorId === floor.id ? 'border-sky-600 bg-sky-50 text-sky-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                      {floor.isSite ? 'سایت' : floor.isHalf ? `نیم‌طبقه ${floor.number}` : floor.number === 0 ? 'همکف' : `طبقه ${floor.number}`}
                    </button>
                  ))}
                </div>

                <div className="relative mt-2 overflow-hidden rounded-lg border bg-gray-50">
                  <img src={selectedFloor.plotUrl} alt="floor-plan" className="w-full object-contain" />
                  {(selectedFloor.layers || []).map(layer => (
                    <button key={layer.id} onClick={() => setSelectedLayer(layer)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow"
                      style={{ left: `${layer.posX * 100}%`, top: `${layer.posY * 100}%` }}>
                      <span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: 999, backgroundColor: getLayerColor(layer.type), border: '2px solid white' }} />
                    </button>
                  ))}
                </div>

                {selectedLayer && (
                  <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-gray-800">
                    <div className="font-semibold text-sky-800">{getLayerLabel(selectedLayer.type)}</div>
                    {selectedLayer.note && <div className="mt-1 text-gray-700">{selectedLayer.note}</div>}
                    {selectedLayer.pictureUrl && <div className="mt-2"><img src={selectedLayer.pictureUrl} alt="layer" className="w-full rounded-md border bg-white" /></div>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
