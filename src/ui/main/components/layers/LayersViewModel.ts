import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';


export type Layer = {
  id: number;
  floorId: number;
  type: string;
  note?: string | null;
  pictureUrl?: string | null;
  pictureThumbUrl?: string | null;
  posX: number;
  posY: number;
  rotationDeg?: number;
};

export type Floor = {
  id: number;
  number: number;
  isHalf: boolean;
  isSite: boolean;
  plotUrl: string;
  plotThumbUrl?: string | null;
  application: string;
  description?: string | null;
  width?: number | null;
  scale?: number | null;
  layers?: Layer[];
};

export type AddLayerState =
  | { type: 'HIDDEN' }
  | { type: 'SELECTING_TYPE' }
  | { type: 'POSITIONING'; layerType: string }
  | { type: 'ADDING_IMAGE'; layerType: string; positionX: number; positionY: number }
  | {
      type: 'ADDING_NOTES';
      layerType: string;
      positionX: number;
      positionY: number;
      imageUrl?: string;
      thumbUrl?: string;
      notes?: string;
    }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; message: string };

export type CreateLayerRequest = {
  type: string;
  posX: number;
  posY: number;
  note?: string;
  pictureUrl?: string;
  pictureThumbUrl?: string;
};

export type UploadImageResponse = {
  url: string;
  thumbUrl?: string;
};

export type FloorPlanDetailState = {
  floor: Floor | null;
  layers: Layer[];
  selectedLayer: Layer | null;
  popupPosition: { x: number; y: number } | null;
  isLoading: boolean;
  layerTypes: Record<string, boolean>;
  isLayerTypeSelectorVisible: boolean;
  addLayerState: AddLayerState;
  error: string | null;
};


export const fetchFloorById = async (floorId: number): Promise<Floor> => {
  const response = await api.get(`/floors/${floorId}`);
  return response.data.data;
};

export const fetchCachedBuilding = async (): Promise<{ floors: Floor[] }> => {
  const response = await api.get('/buildings/cached');
  return response.data.data;
};

export const uploadImage = async (imageFile: File): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await api.post('/api/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

export const createLayer = async (
  floorId: number,
  request: CreateLayerRequest
): Promise<Layer> => {
  const response = await api.post(`/floors/${floorId}/layers`, request);
  return response.data.data;
};


const CACHE_PREFIX = 'floor_plan_detail_';

const getCacheKey = (floorId: number) => `${CACHE_PREFIX}${floorId}`;

const cacheFloorData = async (floorId: number, floor: Floor) => {
  try {
    await AsyncStorage.setItem(getCacheKey(floorId), JSON.stringify(floor));
  } catch (error) {
    console.error('Error caching floor data:', error);
  }
};

const getCachedFloorData = async (floorId: number): Promise<Floor | null> => {
  try {
    const cached = await AsyncStorage.getItem(getCacheKey(floorId));
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Error getting cached floor data:', error);
  }
  return null;
};

const clearFloorCache = async (floorId: number) => {
  try {
    await AsyncStorage.removeItem(getCacheKey(floorId));
  } catch (error) {
    console.error('Error clearing floor cache:', error);
  }
};


export type UseFloorPlanDetailParams = {
  floorId: number;
  layerId?: number;
  onLayerClick?: (layerId: number) => void;
};

export type UseFloorPlanDetailReturn = FloorPlanDetailState & {
  onVoidClick: () => void;
  onLayerClickHandler: (layer: Layer, x: number, y: number) => void;
  onLayerTypeClick: (layerType: string) => void;
  onLayerTypesClick: () => void;
  onPopupClose: () => void;

  showAddLayerDialog: () => void;
  selectLayerType: (layerType: string) => void;
  confirmPosition: (position: { x: number; y: number }) => void;
  cancelPositioning: () => void;
  imageFileSelected: (imageFile: File) => Promise<void>;
  updateNotes: (notes: string) => void;
  submitLayer: () => Promise<void>;
  dismissError: () => void;
  resetFlow: () => void;
  skipImage: () => void;

  refresh: () => Promise<void>;
  clearCache: () => Promise<void>;
};

export const useFloorPlanDetail = ({
  floorId,
  layerId,
  onLayerClick,
}: UseFloorPlanDetailParams): UseFloorPlanDetailReturn => {
  const [state, setState] = useState<FloorPlanDetailState>({
    floor: null,
    layers: [],
    selectedLayer: null,
    popupPosition: null,
    isLoading: false,
    layerTypes: {},
    isLayerTypeSelectorVisible: false,
    addLayerState: { type: 'HIDDEN' },
    error: null,
  });

  const loadFloorPlanDetail = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const cached = await getCachedFloorData(floorId);
      if (cached) {
        setState((prev) => ({ ...prev, floor: cached }));
      }

      const floor = await fetchFloorById(floorId);
      const layers = floor.layers || [];

      const layerTypes: Record<string, boolean> = {};
      layers.forEach((layer) => {
        if (layer.type) {
          layerTypes[layer.type] = true;
        }
      });

      const selectedLayer = layerId ? layers.find((l) => l.id === layerId) || null : null;

      setState((prev) => ({
        ...prev,
        floor,
        layers,
        selectedLayer,
        layerTypes,
        isLoading: false,
      }));

      await cacheFloorData(floorId, floor);
    } catch (error: any) {
      console.error('Error loading floor plan detail:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || error.message || 'خطا در بارگذاری نقشه طبقه',
      }));
    }
  }, [floorId, layerId]);

  useEffect(() => {
    loadFloorPlanDetail();
  }, [loadFloorPlanDetail]);

  const onVoidClick = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLayerTypeSelectorVisible: false,
      selectedLayer: null,
      popupPosition: null,
      addLayerState: { type: 'HIDDEN' },
    }));
  }, []);

  const onLayerClickHandler = useCallback(
    (layer: Layer, x: number, y: number) => {
      setState((prev) => ({
        ...prev,
        selectedLayer: layer,
        popupPosition: { x, y },
      }));

      if (onLayerClick) {
        onLayerClick(layer.id);
      }
    },
    [onLayerClick]
  );

  const onLayerTypeClick = useCallback((layerType: string) => {
    setState((prev) => {
      const newLayerTypes = { ...prev.layerTypes };
      newLayerTypes[layerType] = !newLayerTypes[layerType];

      const allLayers = prev.floor?.layers || [];
      const filteredLayers = allLayers.filter((layer) => {
        if (!layer.type) return false;
        return newLayerTypes[layer.type] !== false;
      });

      return {
        ...prev,
        layerTypes: newLayerTypes,
        layers: filteredLayers,
      };
    });
  }, []);

  const onLayerTypesClick = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLayerTypeSelectorVisible: !prev.isLayerTypeSelectorVisible,
    }));
  }, []);

  const onPopupClose = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedLayer: null,
      popupPosition: null,
    }));
  }, []);

  const showAddLayerDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      addLayerState: { type: 'SELECTING_TYPE' },
      isLayerTypeSelectorVisible: false,
    }));
  }, []);

  const selectLayerType = useCallback((layerType: string) => {
    setState((prev) => ({
      ...prev,
      addLayerState: { type: 'POSITIONING', layerType },
    }));
  }, []);

  const confirmPosition = useCallback((position: { x: number; y: number }) => {
    setState((prev) => {
      if (prev.addLayerState.type === 'POSITIONING') {
        return {
          ...prev,
          addLayerState: {
            type: 'ADDING_IMAGE',
            layerType: prev.addLayerState.layerType,
            positionX: position.x,
            positionY: position.y,
          },
        };
      }
      return prev;
    });
  }, []);

  const cancelPositioning = useCallback(() => {
    setState((prev) => ({
      ...prev,
      addLayerState: { type: 'HIDDEN' },
    }));
  }, []);

  const imageFileSelected = useCallback(async (imageFile: File) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const uploadedImage = await uploadImage(imageFile);

      setState((prev) => {
        if (prev.addLayerState.type === 'ADDING_IMAGE') {
          return {
            ...prev,
            addLayerState: {
              type: 'ADDING_NOTES',
              layerType: prev.addLayerState.layerType,
              positionX: prev.addLayerState.positionX,
              positionY: prev.addLayerState.positionY,
              imageUrl: uploadedImage.url,
              thumbUrl: uploadedImage.thumbUrl,
            },
            isLoading: false,
          };
        }
        return { ...prev, isLoading: false };
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        addLayerState: {
          type: 'ERROR',
          message: error.response?.data?.message || error.message || 'خطا در آپلود تصویر',
        },
        isLoading: false,
      }));
    }
  }, []);

  const updateNotes = useCallback((notes: string) => {
    setState((prev) => {
      if (prev.addLayerState.type === 'ADDING_NOTES') {
        return {
          ...prev,
          addLayerState: {
            ...prev.addLayerState,
            notes,
          },
        };
      }
      return prev;
    });
  }, []);

  const submitLayer = useCallback(async () => {
    const currentState = state.addLayerState;
    if (currentState.type !== 'ADDING_NOTES') return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const request: CreateLayerRequest = {
        type: currentState.layerType,
        posX: currentState.positionX,
        posY: currentState.positionY,
        note: currentState.notes,
        pictureUrl: currentState.imageUrl,
        pictureThumbUrl: currentState.thumbUrl,
      };

      await createLayer(floorId, request);

      setState((prev) => ({
        ...prev,
        addLayerState: { type: 'SUCCESS' },
        isLoading: false,
      }));

      await loadFloorPlanDetail();
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        addLayerState: {
          type: 'ERROR',
          message: error.response?.data?.message || error.message || 'خطا در ایجاد لایه',
        },
        isLoading: false,
      }));
    }
  }, [state.addLayerState, floorId, loadFloorPlanDetail]);

  const dismissError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      addLayerState: { type: 'HIDDEN' },
      error: null,
    }));
  }, []);

  const resetFlow = useCallback(() => {
    setState((prev) => ({
      ...prev,
      addLayerState: { type: 'HIDDEN' },
    }));
  }, []);

  const skipImage = useCallback(() => {
    setState((prev) => {
      if (prev.addLayerState.type === 'ADDING_IMAGE') {
        return {
          ...prev,
          addLayerState: {
            type: 'ADDING_NOTES',
            layerType: prev.addLayerState.layerType,
            positionX: prev.addLayerState.positionX,
            positionY: prev.addLayerState.positionY,
            imageUrl: undefined,
          },
        };
      }
      return prev;
    });
  }, []);

  const refresh = useCallback(async () => {
    await loadFloorPlanDetail();
  }, [loadFloorPlanDetail]);

  const clearCache = useCallback(async () => {
    await clearFloorCache(floorId);
  }, [floorId]);

  return {
    ...state,
    onVoidClick,
    onLayerClickHandler,
    onLayerTypeClick,
    onLayerTypesClick,
    onPopupClose,
    showAddLayerDialog,
    selectLayerType,
    confirmPosition,
    cancelPositioning,
    imageFileSelected,
    updateNotes,
    submitLayer,
    dismissError,
    resetFlow,
    skipImage,
    refresh,
    clearCache,
  };
};
