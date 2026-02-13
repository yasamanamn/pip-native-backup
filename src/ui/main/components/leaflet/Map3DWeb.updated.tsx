import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, ActivityIndicator } from 'react-native';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';



type StoryInfo = {
  buildingId: number;
  projectName: string;
  renovationCode: string;
  storyIndex: number;
  storyCount: number;
  height: number;
  baseHeight: number;
  displayHeight: number;
  displayBaseHeight: number;
  floorNumber: number | null;
  isUnderground: boolean;
  isSite: boolean;
  storyKey: string;
};

type LayerInfo = {
  id: number;
  type: string;
  note?: string | null;
  pictureUrl?: string | null;
  posX: number;
  posY: number;
  rotationDeg?: number | null;
};

type FloorInfo = {
  id: number;
  number: number;
  isHalf: boolean;
  isSite: boolean;
  plotUrl: string;
  plotThumbUrl?: string | null;
  application: string;
  layers?: LayerInfo[];
};

type BuildingInfo = {
  id: number;
  projectName: string;
  renovationCode: string;
  address: string;
  aboveFloors: number;
  subFloors: number;
  halfFloors: number;
  floors: FloorInfo[];
};



const CurrentPositionIcon = ({ style }: { style?: any }) => (
  <View style={[styles.icon, style]}>
    <Text style={styles.iconText}>📍</Text>
  </View>
);

const EyeIcon = ({ style }: { style?: any }) => (
  <View style={[styles.icon, style]}>
    <Text style={styles.iconText}>👁</Text>
  </View>
);

const EyeOffIcon = ({ style }: { style?: any }) => (
  <View style={[styles.icon, style]}>
    <Text style={styles.iconText}>🚫</Text>
  </View>
);

const LayersIcon = ({ style }: { style?: any }) => (
  <View style={[styles.icon, style]}>
    <Text style={styles.iconText}>📚</Text>
  </View>
);

const RefreshIcon = ({ style }: { style?: any }) => (
  <View style={[styles.icon, style]}>
    <Text style={styles.iconText}>🔄</Text>
  </View>
);

const ResetIcon = ({ style }: { style?: any }) => (
  <View style={[styles.icon, style]}>
    <Text style={styles.iconText}>↺</Text>
  </View>
);



const DEFAULT_CENTER: [number, number] = [59.59, 36.31];
const DEFAULT_ZOOM = 12;

const TILE_SERVERS = {
  MASHHAD: 'https://sditile2.mashhad.ir/geoserver/gwc/service/tms/1.0.0/MashhadBaseMap1401@WebMercatorQuad@png/{z}/{x}/{y}.png',
  OSM: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  CARTO_LIGHT: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  CARTO_DARK: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

const FLOOR_APPLICATION_FA: Record<string, string> = {
  RESIDENTIAL: 'مسکونی',
  COMMERCIAL: 'تجاری',
  OFFICE: 'اداری',
  INDUSTRIAL: 'صنعتی',
  PARKING: 'پارکینگ',
  STORAGE: 'انبار',
  OTHER: 'سایر',
};

const LAYER_FA: Record<string, string> = {
  FIRE_EXTINGUISHER: 'کپسول آتش نشانی',
  FIRE_ALARM: 'دتکتور دود',
  SPRINKLER: 'اسپرینکلر',
  EMERGENCY_EXIT: 'خروج اضطراری',
  FIRE_HOSE: 'شیلنگ آتش نشانی',
  HYDRANT: 'هیدرانت',
  OTHER: 'سایر',
};

const LAYER_ICON_SRC: Record<string, string> = {
  FIRE_EXTINGUISHER: '/icons/fire-extinguisher.svg',
  FIRE_ALARM: '/icons/fire-alarm.svg',
  SPRINKLER: '/icons/sprinkler.svg',
  EMERGENCY_EXIT: '/icons/emergency-exit.svg',
  FIRE_HOSE: '/icons/fire-hose.svg',
  HYDRANT: '/icons/hydrant.svg',
  OTHER: '/icons/other.svg',
};

const createBaseStyle = (tileUrl: string, scheme: string = 'xyz'): maplibregl.StyleSpecification => ({
  version: 8,
  sources: {
    'base-tiles': {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      scheme: scheme,
      attribution: scheme === 'tms' ? 'Mashhad Municipality' : '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'base-tiles',
      type: 'raster',
      source: 'base-tiles',
    },
  ],
});



export default function Map3DWeb() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const selectedIdRef = useRef<string | null>(null);
  const floorListRef = useRef<ScrollView | null>(null);
  const floorButtonRefs = useRef<Map<number, TouchableOpacity | null>>(new Map());

  const [selectedStory, setSelectedStory] = useState<StoryInfo | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);
  const [loadingBuilding, setLoadingBuilding] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hiddenStoryKeys, setHiddenStoryKeys] = useState<Set<string>>(new Set());
  const [baseMapError, setBaseMapError] = useState(false);
  const [currentTileServer, setCurrentTileServer] = useState<string>('OSM');

  const buildingCacheRef = useRef<Map<string, BuildingInfo>>(new Map());

  

  const applySelectionStyle = (selectedKey: string | null) => {
    const map = mapRef.current;
    if (!map || !map.getLayer('building-story-highlight')) return;

    if (!selectedKey || hiddenStoryKeys.has(selectedKey)) {
      map.setFilter('building-story-highlight', ['==', ['get', 'storyKey'], '']);
      return;
    }

    map.setFilter('building-story-highlight', ['==', ['get', 'storyKey'], selectedKey]);
  };

  const storyLink = useMemo(() => {
    if (!selectedStory) return null;
    return `/projects/${encodeURIComponent(selectedStory.renovationCode)}`;
  }, [selectedStory]);

  const getStoryKeyForFloor = (buildingId: number, floor: FloorInfo) => {
    if (floor.isHalf) return null;
    if (floor.isSite) return `${buildingId}:site:${floor.number}`;
    if (floor.number < 0) return `${buildingId}:sub:${floor.number}`;
    return `${buildingId}:above:${floor.number}`;
  };

  const applyStorySelectionByKey = (storyKey: string) => {
    applySelectionStyle(storyKey);
    selectedIdRef.current = storyKey;

    const map = mapRef.current;
    if (!map) return;
    const matches = map.querySourceFeatures('buildings', {
      filter: ['==', ['get', 'storyKey'], storyKey],
    });
    if (!matches.length) return;

    const props = matches[0].properties as unknown as StoryInfo;
    setSelectedStory({
      buildingId: Number(props.buildingId),
      projectName: props.projectName,
      renovationCode: props.renovationCode,
      storyIndex: Number(props.storyIndex),
      storyCount: Number(props.storyCount),
      height: Number(props.height),
      baseHeight: Number(props.baseHeight),
      displayHeight: Number(props.displayHeight ?? props.height),
      displayBaseHeight: Number(props.displayBaseHeight ?? props.baseHeight),
      floorNumber: props.floorNumber != null ? Number(props.floorNumber) : null,
      isUnderground: Boolean(props.isUnderground),
      isSite: Boolean(props.isSite),
      storyKey: props.storyKey,
    });
  };

  

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapRef.current || !mapContainerRef.current) return;

    const baseStyle = createBaseStyle(TILE_SERVERS.OSM, 'xyz');

    const map = new maplibregl.Map({
      container: mapContainerRef.current as any,
      style: baseStyle,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 55,
      bearing: 0,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-left');
    mapRef.current = map;

    const ensureBuildingsLayers = () => {
      if (!map.isStyleLoaded()) return;

      if (!map.getSource('buildings')) {
        const mockBuildingsData = {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: '1:above:0',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [59.59, 36.31],
                    [59.591, 36.31],
                    [59.591, 36.311],
                    [59.59, 36.311],
                    [59.59, 36.31],
                  ],
                ],
              },
              properties: {
                buildingId: 1,
                projectName: 'ساختمان نمونه 1',
                renovationCode: 'REN-001',
                storyIndex: 1,
                storyCount: 5,
                height: 3.5,
                baseHeight: 0,
                displayHeight: 3.5,
                displayBaseHeight: 0,
                floorNumber: 0,
                isUnderground: false,
                isSite: false,
                storyKey: '1:above:0',
              },
            },
            {
              type: 'Feature',
              id: '1:above:1',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [59.59, 36.31],
                    [59.591, 36.31],
                    [59.591, 36.311],
                    [59.59, 36.311],
                    [59.59, 36.31],
                  ],
                ],
              },
              properties: {
                buildingId: 1,
                projectName: 'ساختمان نمونه 1',
                renovationCode: 'REN-001',
                storyIndex: 2,
                storyCount: 5,
                height: 7,
                baseHeight: 3.5,
                displayHeight: 7,
                displayBaseHeight: 3.5,
                floorNumber: 1,
                isUnderground: false,
                isSite: false,
                storyKey: '1:above:1',
              },
            },
            {
              type: 'Feature',
              id: '2:above:0',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [59.592, 36.312],
                    [59.593, 36.312],
                    [59.593, 36.313],
                    [59.592, 36.313],
                    [59.592, 36.312],
                  ],
                ],
              },
              properties: {
                buildingId: 2,
                projectName: 'ساختمان نمونه 2',
                renovationCode: 'REN-002',
                storyIndex: 1,
                storyCount: 3,
                height: 3,
                baseHeight: 0,
                displayHeight: 3,
                displayBaseHeight: 0,
                floorNumber: 0,
                isUnderground: false,
                isSite: false,
                storyKey: '2:above:0',
              },
            },
          ],
        };

        map.addSource('buildings', {
          type: 'geojson',
          data: mockBuildingsData as any,
        });
      }

      if (!map.getLayer('building-stories-above')) {
        map.addLayer({
          id: 'building-stories-above',
          type: 'fill-extrusion',
          source: 'buildings',
          filter: ['==', ['get', 'isUnderground'], false],
          paint: {
            'fill-extrusion-color': [
              'case',
              ['==', ['get', 'isSite'], true],
              '#16a34a',
              ['case', ['==', ['%', ['get', 'storyIndex'], 2], 0], '#f97316', '#db2777'],
            ],
            'fill-extrusion-height': ['get', 'displayHeight'],
            'fill-extrusion-base': ['get', 'displayBaseHeight'],
            'fill-extrusion-opacity': 0.85,
          },
        });
      }

      if (!map.getLayer('building-stories-underground')) {
        map.addLayer({
          id: 'building-stories-underground',
          type: 'fill-extrusion',
          source: 'buildings',
          filter: ['==', ['get', 'isUnderground'], true],
          paint: {
            'fill-extrusion-color': [
              'case',
              ['==', ['%', ['get', 'storyIndex'], 2], 0],
              '#1d4ed8',
              '#2563eb',
            ],
            'fill-extrusion-height': ['get', 'displayHeight'],
            'fill-extrusion-base': ['get', 'displayBaseHeight'],
            'fill-extrusion-opacity': 0.6,
          },
        });
      }

      if (!map.getLayer('building-story-highlight')) {
        map.addLayer({
          id: 'building-story-highlight',
          type: 'fill-extrusion',
          source: 'buildings',
          filter: ['==', ['get', 'storyKey'], ''],
          paint: {
            'fill-extrusion-color': '#0ea5e9',
            'fill-extrusion-height': ['get', 'displayHeight'],
            'fill-extrusion-base': ['get', 'displayBaseHeight'],
            'fill-extrusion-opacity': 0.95,
          },
        });
      }

      mapReadyRef.current = true;
    };

    map.on('load', () => {
      ensureBuildingsLayers();
      setBaseMapError(false);
    });
    
    map.on('styledata', ensureBuildingsLayers);
    
    map.on('error', (e: any) => {
      console.error('Map error:', e);
      setBaseMapError(true);
    });

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      if (!mapReadyRef.current) return;
      const features = map.queryRenderedFeatures(event.point, {
        layers: ['building-stories-above', 'building-stories-underground'],
      });
      if (!features.length) {
        handleCloseModal();
        return;
      }
      const feature = features[0];
      const props = feature.properties as unknown as StoryInfo;

      setSelectedLayer(null);
      setAuthRequired(false);
      setPermissionDenied(false);
      setFetchError(null);
      setSelectedFloorId(null);
      setSelectedStory({
        buildingId: Number(props.buildingId),
        projectName: props.projectName,
        renovationCode: props.renovationCode,
        storyIndex: Number(props.storyIndex),
        storyCount: Number(props.storyCount),
        height: Number(props.height),
        baseHeight: Number(props.baseHeight),
        displayHeight: Number(props.displayHeight ?? props.height),
        displayBaseHeight: Number(props.displayBaseHeight ?? props.baseHeight),
        floorNumber: props.floorNumber != null ? Number(props.floorNumber) : null,
        isUnderground: Boolean(props.isUnderground),
        isSite: Boolean(props.isSite),
        storyKey: props.storyKey,
      });

      if (feature.id != null) {
        const nextKey = String(props.storyKey ?? feature.id);
        selectedIdRef.current = nextKey;
        applySelectionStyle(nextKey);
      }

      const mockBuilding: BuildingInfo = {
        id: Number(props.buildingId),
        projectName: props.projectName,
        renovationCode: props.renovationCode,
        address: 'آدرس نمونه',
        aboveFloors: 5,
        subFloors: 0,
        halfFloors: 0,
        floors: [
          {
            id: 1,
            number: 0,
            isHalf: false,
            isSite: false,
            plotUrl: 'https://via.placeholder.com/600x400?text=Floor+Plan',
            application: 'RESIDENTIAL',
            layers: [],
          },
        ],
      };

      buildingCacheRef.current.set(props.renovationCode, mockBuilding);
      setSelectedBuilding(mockBuilding);
    };

    const handleMove = (event: maplibregl.MapMouseEvent) => {
      if (!map.isStyleLoaded() || !map.getLayer('building-stories-above')) {
        map.getCanvas().style.cursor = '';
        return;
      }

      const features = map.queryRenderedFeatures(event.point, {
        layers: ['building-stories-above', 'building-stories-underground'],
      });
      map.getCanvas().style.cursor = features.length ? 'pointer' : '';
    };

    map.on('click', handleClick);
    map.on('mousemove', handleMove);

    return () => {
      map.off('click', handleClick);
      map.off('mousemove', handleMove);
      map.remove();
      mapRef.current = null;
    };
  }, []);


  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer('building-stories-above')) return;
    const hidden = Array.from(hiddenStoryKeys);
    const hiddenFilter = hidden.length
      ? (['!', ['in', ['get', 'storyKey'], ['literal', hidden]]] as maplibregl.FilterSpecification)
      : null;
    const aboveFilter = hiddenFilter
      ? (['all', ['==', ['get', 'isUnderground'], false], hiddenFilter] as maplibregl.FilterSpecification)
      : (['==', ['get', 'isUnderground'], false] as maplibregl.FilterSpecification);
    const undergroundFilter = hiddenFilter
      ? (['all', ['==', ['get', 'isUnderground'], true], hiddenFilter] as maplibregl.FilterSpecification)
      : (['==', ['get', 'isUnderground'], true] as maplibregl.FilterSpecification);

    map.setFilter('building-stories-above', aboveFilter);
    map.setFilter('building-stories-underground', undergroundFilter);
    if (selectedIdRef.current && hiddenStoryKeys.has(selectedIdRef.current)) {
      applySelectionStyle(null);
    }
  }, [hiddenStoryKeys]);



  const handleFitToFeatures = async () => {
    const map = mapRef.current;
    if (!map) return;

    try {
      map.fitBounds(
        [
          [59.58, 36.30],
          [59.60, 36.32],
        ],
        { padding: 60, duration: 800 }
      );
    } catch (error) {
      map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, pitch: 55, bearing: 0 });
    }
  };

  const handleHideSelected = () => {
    if (!selectedStory) return;
    setHiddenStoryKeys((prev) => {
      const next = new Set(prev);
      next.add(selectedStory.storyKey);
      return next;
    });
  };

  const handleUnhideSelected = () => {
    if (!selectedStory) return;
    setHiddenStoryKeys((prev) => {
      const next = new Set(prev);
      next.delete(selectedStory.storyKey);
      return next;
    });
    applySelectionStyle(selectedStory.storyKey);
  };

  const handleResetHidden = () => {
    setHiddenStoryKeys(new Set());
    if (selectedStory) applySelectionStyle(selectedStory.storyKey);
  };

  const handleResetMap = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, pitch: 55, bearing: 0 });
    applySelectionStyle(null);
    selectedIdRef.current = null;
    setSelectedStory(null);
    setSelectedBuilding(null);
    setSelectedFloorId(null);
    setSelectedLayer(null);
    setBaseMapError(false);
  };

  const handleReloadGeometry = () => {
    const map = mapRef.current;
    if (!map) return;
    console.log('Reloading geometry data...');
  };

  const handleCloseModal = () => {
    const map = mapRef.current;
    if (!map || !selectedStory) {
      applySelectionStyle(null);
      setSelectedStory(null);
      return;
    }

    selectedIdRef.current = null;
    applySelectionStyle(null);
    setSelectedBuilding(null);
    setSelectedFloorId(null);
    setSelectedLayer(null);
    setSelectedStory(null);
  };

  const selectedFloor = useMemo(() => {
    if (!selectedBuilding) return null;
    if (selectedFloorId) {
      return selectedBuilding.floors.find((f) => f.id === selectedFloorId) ?? null;
    }

    if (!selectedStory) return null;

    if (selectedStory.isSite) {
      return selectedBuilding.floors.find((f) => f.isSite) ?? null;
    }

    const targetNumber = selectedStory.floorNumber ?? selectedStory.storyIndex - 1;
    const exact = selectedBuilding.floors.find((f) => !f.isHalf && f.number === targetNumber && !f.isSite);
    return exact ?? null;
  }, [selectedBuilding, selectedFloorId, selectedStory]);

  useEffect(() => {
    if (!selectedFloor) return;
    setSelectedFloorId(selectedFloor.id);
  }, [selectedFloor]);

  

  return (
    <View style={styles.container}>
      {/* Map Container */}
      <View style={styles.mapContainer} ref={mapContainerRef as any} />

      {/* Base Map Error Badge */}
      {baseMapError && (
        <View style={styles.errorBadge}>
          <Text style={styles.errorText}>نقشه پایه از OpenStreetMap</Text>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlButtons}>
        <TouchableOpacity style={styles.controlButton} onPress={handleFitToFeatures}>
          <CurrentPositionIcon style={styles.controlIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, !selectedStory && styles.controlButtonDisabled]}
          onPress={handleHideSelected}
          disabled={!selectedStory}
        >
          <EyeOffIcon style={styles.controlIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, !selectedStory && styles.controlButtonDisabled]}
          onPress={handleUnhideSelected}
          disabled={!selectedStory}
        >
          <EyeIcon style={styles.controlIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleResetHidden}>
          <LayersIcon style={styles.controlIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleResetMap}>
          <ResetIcon style={styles.controlIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleReloadGeometry}>
          <RefreshIcon style={styles.controlIcon} />
        </TouchableOpacity>
      </View>

      {/* Info Panel */}
      {selectedStory && (
        <View style={styles.infoPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Building Info */}
            <View style={styles.buildingInfo}>
              <View style={styles.buildingHeader}>
                <View style={styles.buildingDetails}>
                  <Text style={styles.buildingLabel}>ساختمان انتخاب‌شده</Text>
                  <Text style={styles.buildingName}>{selectedStory.projectName}</Text>
                  <Text style={styles.buildingCode}>کد پروژه: {selectedStory.renovationCode}</Text>
                </View>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Text style={styles.closeButton}>بستن</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statText}>
                    طبقه {selectedStory.storyIndex} از {selectedStory.storyCount}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statText}>ارتفاع تا این طبقه: {Math.round(selectedStory.height)} متر</Text>
                </View>
              </View>
            </View>

            {/* Floor Details */}
            <View style={styles.floorDetails}>
              <View style={styles.floorHeader}>
                <Text style={styles.floorTitle}>نمای طبقه</Text>
                {loadingBuilding && <ActivityIndicator size="small" color="#0ea5e9" />}
              </View>

              {selectedBuilding && (
                <>
                  {/* Floor Buttons */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorButtons}>
                    {selectedBuilding.floors.map((floor) => (
                      <TouchableOpacity
                        key={floor.id}
                        style={[styles.floorButton, selectedFloorId === floor.id && styles.floorButtonActive]}
                        onPress={() => {
                          setSelectedFloorId(floor.id);
                          setSelectedLayer(null);
                          const key = getStoryKeyForFloor(selectedBuilding.id, floor);
                          if (key) applyStorySelectionByKey(key);
                        }}
                      >
                        <Text
                          style={[styles.floorButtonText, selectedFloorId === floor.id && styles.floorButtonTextActive]}
                        >
                          {floor.isSite
                            ? 'سایت'
                            : floor.isHalf
                            ? `نیم‌طبقه ${floor.number}`
                            : floor.number === 0
                            ? 'همکف'
                            : `طبقه ${floor.number}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Floor Plan Image */}
                  {selectedFloor && (
                    <View style={styles.floorPlanContainer}>
                      <Text style={styles.floorPlanLabel}>
                        {selectedFloor.isSite
                          ? 'سایت'
                          : selectedFloor.isHalf
                          ? `نیم‌طبقه ${selectedFloor.number}`
                          : `طبقه ${selectedFloor.number}`}{' '}
                        • {FLOOR_APPLICATION_FA[selectedFloor.application] || selectedFloor.application}
                      </Text>

                      <View style={styles.floorPlanImageContainer}>
                        <Image source={{ uri: selectedFloor.plotUrl }} style={styles.floorPlanImage} resizeMode="contain" />
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: '100vh',
    width: '100%',
  },
  mapContainer: {
    height: '100%',
    width: '100%',
  },
  errorBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  controlButtons: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlIcon: {
    width: 20,
    height: 20,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  infoPanel: {
    position: 'absolute',
    right: 24,
    top: 24,
    zIndex: 20,
    width: 420,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buildingInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
  },
  buildingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  buildingDetails: {
    flex: 1,
  },
  buildingLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  buildingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  buildingCode: {
    fontSize: 12,
    color: '#374151',
    marginTop: 2,
  },
  closeButton: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  floorDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  floorButtons: {
    marginTop: 12,
    flexDirection: 'row',
  },
  floorButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  floorButtonActive: {
    borderColor: '#0284C7',
    backgroundColor: '#EFF6FF',
  },
  floorButtonText: {
    fontSize: 12,
    color: '#374151',
  },
  floorButtonTextActive: {
    color: '#0C4A6E',
  },
  floorPlanContainer: {
    marginTop: 12,
  },
  floorPlanLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  floorPlanImageContainer: {
    position: 'relative',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  floorPlanImage: {
    width: '100%',
    height: 300,
  },
});
