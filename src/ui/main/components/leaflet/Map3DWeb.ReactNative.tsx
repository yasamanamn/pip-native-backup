import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, ActivityIndicator } from 'react-native';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getBuildings3D, getBuildingByCode } from '../../../../services/buildings.service3D.ts';
import LayersScreen from '../layers/layers';
import { LAYER_ICON_SRC } from '../../../../constants/layerIcons';

// Types
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

// Constants
const DEFAULT_CENTER: [number, number] = [59.59, 36.31];
const DEFAULT_ZOOM = 12;
const BASE_TMS_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const baseStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'base-tiles': {
      type: 'raster',
      tiles: [BASE_TMS_URL],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'base-tiles',
      type: 'raster',
      source: 'base-tiles',
    },
  ],
};

type Map3DWebProps = {
  flyToLocation?: {
    latitude: number;
    longitude: number;
    renovationCode?: string;
  } | null;
  onBuildingSelect?: (building: BuildingInfo | null, story: StoryInfo | null, floor: FloorInfo | null) => void;
  selectedBuilding?: BuildingInfo | null;
  selectedStory?: StoryInfo | null;
  selectedFloorId?: number | null;
};

export default function Map3DWeb({ 
  flyToLocation, 
  onBuildingSelect,
  selectedBuilding: externalSelectedBuilding,
  selectedStory: externalSelectedStory,
  selectedFloorId: externalSelectedFloorId 
}: Map3DWebProps) {
  // Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const selectedIdRef = useRef<string | null>(null);
  const buildingCacheRef = useRef<Map<string, BuildingInfo>>(new Map());

  // State
  const [selectedStory, setSelectedStory] = useState<StoryInfo | null>(externalSelectedStory || null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(externalSelectedBuilding || null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(externalSelectedFloorId || null);
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);
  const [loadingBuilding, setLoadingBuilding] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hiddenStoryKeys, setHiddenStoryKeys] = useState<Set<string>>(new Set());
  const [baseMapError, setBaseMapError] = useState(false);
  const [showLayersModal, setShowLayersModal] = useState(false);

  // Sync with props
  useEffect(() => {
    if (externalSelectedStory !== undefined) {
      setSelectedStory(externalSelectedStory);
    }
  }, [externalSelectedStory]);

  useEffect(() => {
    if (externalSelectedBuilding !== undefined) {
      setSelectedBuilding(externalSelectedBuilding);
    }
  }, [externalSelectedBuilding]);

  useEffect(() => {
    if (externalSelectedFloorId !== undefined) {
      setSelectedFloorId(externalSelectedFloorId);
    }
  }, [externalSelectedFloorId]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onBuildingSelect) {
      onBuildingSelect(selectedBuilding, selectedStory, selectedFloor);
    }
  }, [selectedBuilding, selectedStory, selectedFloorId]);

  // Apply selection style to map
  const applySelectionStyle = (selectedKey: string | null) => {
    const map = mapRef.current;
    if (!map || !map.getLayer('building-story-highlight')) return;

    if (!selectedKey || hiddenStoryKeys.has(selectedKey)) {
      map.setFilter('building-story-highlight', ['==', ['get', 'storyKey'], '']);
      return;
    }

    map.setFilter('building-story-highlight', ['==', ['get', 'storyKey'], selectedKey]);
  };

  // Get story key for floor
  const getStoryKeyForFloor = (buildingId: number, floor: FloorInfo) => {
    if (floor.isHalf) return null;
    if (floor.isSite) return `${buildingId}:site:${floor.number}`;
    if (floor.number < 0) return `${buildingId}:sub:${floor.number}`;
    return `${buildingId}:above:${floor.number}`;
  };

  // Apply story selection by key
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
    const newStory = {
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
    };
    setSelectedStory(newStory);
  };

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapRef.current || !mapContainerRef.current) return;

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

    // Ensure buildings layers exist
    const ensureBuildingsLayers = () => {
      if (!map.isStyleLoaded()) return;

      if (!map.getSource('buildings')) {
        map.addSource('buildings', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
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

    // Base map timeout
    const baseMapTimeout = window.setTimeout(() => {
      if (!map.isSourceLoaded('base-tiles')) setBaseMapError(true);
    }, 4000);

    // Load buildings data
    map.on('load', async () => {
      ensureBuildingsLayers();

      try {
        const geojson = await getBuildings3D();
        const source = map.getSource('buildings') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(geojson);
        }
      } catch (err) {
        console.error('Error loading buildings 3D:', err);
      }
    });

    map.on('styledata', ensureBuildingsLayers);

    map.on('sourcedata', (e) => {
      if (e.sourceId === 'base-tiles' && map.isSourceLoaded('base-tiles')) {
        setBaseMapError(false);
      }
    });

    map.on('error', (e: any) => {
      console.error('Map error:', e);
      if (e?.sourceId === 'base-tiles') {
        setBaseMapError(true);
      }
    });

    // Click handler
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
      
      const newStory = {
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
      };
      setSelectedStory(newStory);

      if (feature.id != null) {
        const nextKey = String(props.storyKey ?? feature.id);
        selectedIdRef.current = nextKey;
        applySelectionStyle(nextKey);
      }

      // Load building details from cache or API
      const cache = buildingCacheRef.current;
      const cacheKey = props.renovationCode;
      const cached = cache.get(cacheKey);
      
      if (cached) {
        setSelectedBuilding(cached);
        return;
      }

      setLoadingBuilding(true);

      getBuildingByCode(cacheKey)
        .then((building) => {
          if (!building) return;
          buildingCacheRef.current.set(cacheKey, building);
          setSelectedBuilding(building);
        })
        .catch((error: any) => {
          if (error.message === 'Unauthorized') {
            setAuthRequired(true);
            setPermissionDenied(false);
          } else if (error.message === 'Permission denied') {
            setAuthRequired(false);
            setPermissionDenied(true);
          } else {
            setFetchError('خطا در دریافت اطلاعات');
          }
        })
        .finally(() => setLoadingBuilding(false));
    };

    // Mouse move handler for cursor change
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

    // Cleanup
    return () => {
      window.clearTimeout(baseMapTimeout);
      map.off('click', handleClick);
      map.off('mousemove', handleMove);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update filters when hidden stories change
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

  // Fly to location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToLocation) return;

    map.flyTo({
      center: [flyToLocation.longitude, flyToLocation.latitude],
      zoom: 18,
      pitch: 60,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [flyToLocation]);

  // Get selected floor
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
    return selectedBuilding.floors.find((f) => !f.isHalf && f.number === targetNumber && !f.isSite) ?? null;
  }, [selectedBuilding, selectedFloorId, selectedStory]);

  // Auto-select floor when story changes
  useEffect(() => {
    if (selectedFloor && selectedFloor.id !== selectedFloorId) {
      setSelectedFloorId(selectedFloor.id);
    }
  }, [selectedFloor]);

  // Handlers
  const handleFitToFeatures = async () => {
    const map = mapRef.current;
    if (!map) return;

    try {
      if (selectedStory && map.isSourceLoaded('buildings')) {
        const matches = map.querySourceFeatures('buildings', {
          filter: ['==', ['get', 'buildingId'], selectedStory.buildingId],
        });
        
        if (matches.length) {
          let minLng = Infinity;
          let minLat = Infinity;
          let maxLng = -Infinity;
          let maxLat = -Infinity;
          let maxHeight = 0;
          
          matches.forEach((feature) => {
            const geom = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
            const rings = geom?.type === 'Polygon'
              ? geom.coordinates
              : geom?.type === 'MultiPolygon'
                ? geom.coordinates.flat()
                : [];
            
            rings.forEach((ring) => {
              ring.forEach(([lng, lat]) => {
                minLng = Math.min(minLng, lng);
                minLat = Math.min(minLat, lat);
                maxLng = Math.max(maxLng, lng);
                maxLat = Math.max(maxLat, lat);
              });
            });
            
            const props = feature.properties as unknown as StoryInfo;
            const height = Number(props.displayHeight ?? props.height);
            if (Number.isFinite(height)) maxHeight = Math.max(maxHeight, height);
          });
          
          if (Number.isFinite(minLng) && Number.isFinite(minLat)) {
            const centerLat = (minLat + maxLat) / 2;
            const metersPerDegLat = 111_320;
            const metersPerDegLng = metersPerDegLat * Math.cos((centerLat * Math.PI) / 180);
            const bufferMeters = Math.max(maxHeight * 0.6, 20);
            const bufferLat = bufferMeters / metersPerDegLat;
            const bufferLng = bufferMeters / (metersPerDegLng || metersPerDegLat);
            
            minLng -= bufferLng;
            maxLng += bufferLng;
            minLat -= bufferLat;
            maxLat += bufferLat;
            
            map.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
              { padding: 80, duration: 2000 }
            );
            return;
          }
        }
      }

      // Fallback to all buildings
      const res = await fetch(`${API_BASE_URL}/buildings/3d_new`, { cache: 'no-store' });
      const json = await res.json();
      const features = (json?.features ?? []) as Array<{
        geometry?: { coordinates?: number[][][] };
        properties?: { storyKey?: string };
      }>;
      
      if (!features.length) {
        map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, pitch: 55, bearing: 0 });
        return;
      }

      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;
      let hasBounds = false;

      features.forEach((feature) => {
        const storyKey = feature.properties?.storyKey;
        if (storyKey && hiddenStoryKeys.has(storyKey)) return;
        
        const rings = feature.geometry?.coordinates ?? [];
        rings.forEach((ring) => {
          ring.forEach(([lng, lat]) => {
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
            hasBounds = true;
          });
        });
      });

      if (!hasBounds) {
        map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, pitch: 55, bearing: 0 });
        return;
      }

      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 60, duration: 800 }
      );
    } catch (error) {
      console.error('Fit to features error:', error);
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

  const handleReloadGeometry = async () => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource('buildings') as maplibregl.GeoJSONSource | undefined;
    if (!source?.setData) return;

    try {
      const geojson = await getBuildings3D();
      source.setData(geojson);
    } catch (error) {
      console.error('Reload geometry error:', error);
    }
  };

  const handleCloseModal = () => {
    const map = mapRef.current;
    if (!map || !selectedStory) {
      applySelectionStyle(null);
      setSelectedStory(null);
      setSelectedBuilding(null);
      setSelectedFloorId(null);
      setSelectedLayer(null);
      return;
    }

    selectedIdRef.current = null;
    applySelectionStyle(null);
    setSelectedBuilding(null);
    setSelectedFloorId(null);
    setSelectedLayer(null);
    setSelectedStory(null);
  };

  const handleRetryFetch = () => {
    if (!selectedStory) return;
    
    const cacheKey = selectedStory.renovationCode;
    setFetchError(null);
    setLoadingBuilding(true);
    
    fetch(`${API_BASE_URL}/buildings/${encodeURIComponent(cacheKey)}`)
      .then(async (res) => {
        if (res.status === 401) {
          setAuthRequired(true);
          setPermissionDenied(false);
          setSelectedBuilding(null);
          return null;
        }
        if (res.status === 403) {
          setAuthRequired(false);
          setPermissionDenied(true);
          setSelectedBuilding(null);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!json?.data) return;
        const building = json.data as BuildingInfo;
        buildingCacheRef.current.set(cacheKey, building);
        setSelectedBuilding(building);
      })
      .catch(() => setFetchError('خطا در دریافت اطلاعات'))
      .finally(() => setLoadingBuilding(false));
  };

  return (
    <View style={styles.container}>
      {/* Map Container */}
      <View style={styles.mapContainer} ref={mapContainerRef as any} />

      {/* Base Map Error Overlay */}
      {baseMapError && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorBackground} />
          <View style={styles.errorBadge}>
            <Text style={styles.errorText}>نقشه پایه در دسترس نیست</Text>
          </View>
        </View>
      )}

    

      {/* Layers Modal */}
      <LayersScreen
        visible={showLayersModal}
        onClose={() => setShowLayersModal(false)}
        imageUrl={selectedFloor?.plotUrl}
        layers={selectedFloor?.layers ?? []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  mapContainer: {
    height: '100%',
    width: '100%',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
  errorBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  errorBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#374151',
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
  iconText: {
    fontSize: 18,
  },
});