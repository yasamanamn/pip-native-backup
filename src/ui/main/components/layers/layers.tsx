import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TextInput
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { uploadPicture } from '../../../../services/uploads.api';

import { LAYER_ICON_SRC, LAYER_FA } from "../../../../constants/layerIcons";
import { Platform } from 'react-native';
import { addLayer as apiAddLayer, updateLayer as apiUpdateLayer, deleteLayer as apiDeleteLayer, } from '../../../../services/addLayers.api';

interface LayerType {
  type: string;
  count: number;
}

interface LayersInfo {
  totalLayers: number;
  layerTypes: LayerType[];
}

interface Layer {
  id: string | number;
  type?: string;
  posX: number;
  posY: number;
  description?: string;
  note?: string;
  imageUrl?: string;
  pictureUrl?: string;
}

interface FloorInfo {
  id: number;
  number: number;
  isHalf: boolean;
  isSite: boolean;
  plotUrl: string;
  plotThumbUrl?: string | null;
  application: string;
  layers?: any[];
}

interface LayersScreenProps {
  visible?: boolean;
  onClose?: (updatedLayers?: Layer[]) => void;
  imageUrl?: string | null;
  layers?: Layer[];
  floorId: string;
  onImageUpload?: (imageUri: string) => void;
  floors?: FloorInfo[];
  currentFloor?: FloorInfo;
  onFloorSelect?: (floor: FloorInfo) => void;
}

const FLOOR_APPLICATION_FA: Record<string, string> = {
  RESIDENTIAL: 'مسکونی',
  COMMERCIAL: 'تجاری',
  OFFICE: 'اداری',
  INDUSTRIAL: 'صنعتی',
  PARKING: 'پارکینگ',
  STORAGE: 'انبار',
  OTHER: 'سایر',
};

const normalizeLayers = (rawLayers: any[]): Layer[] =>
  (rawLayers || []).map(l => ({
    ...l,
    imageUrl: l.imageUrl || l.pictureUrl || '',
    description: l.description || l.note || '',
  }));

const DRAG_THRESHOLD = 5;

const LAYER_CSS = `
  @keyframes pulse-ring {
    0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.55; }
    70%  { transform: translate(-50%, -50%) scale(2.4); opacity: 0;    }
    100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0;    }
  }

  @keyframes marker-bounce {
    0%, 100% { transform: translate(-50%, -50%) translateY(0px);  }
    50%       { transform: translate(-50%, -50%) translateY(-5px); }
  }

  @keyframes hint-fade-in {
    from { opacity: 0; transform: translateX(-50%) translateY(6px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0);   }
  }

  @keyframes hint-fade-out {
    from { opacity: 1; transform: translateX(-50%) translateY(0);    }
    to   { opacity: 0; transform: translateX(-50%) translateY(-6px); }
  }

  .layer-pulse::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(62, 92, 118, 0.3);
    animation: pulse-ring 2.2s ease-out infinite;
    pointer-events: none;
  }

  .layer-pulse.clicked::before {
    display: none;
  }

  .layer-marker-web {
    animation: marker-bounce 3.5s ease-in-out infinite;
    animation-delay: var(--bounce-delay, 0s);
  }

  .layer-marker-web.clicked {
    animation: none;
    transform: translate(-50%, -50%) !important;
  }

  .layer-marker-web:hover .layer-tooltip {
    opacity: 1 !important;
    transform: translateX(-50%) translateY(-6px) !important;
  }

  .layer-tooltip {
    opacity: 0;
    transform: translateX(-50%) translateY(0px);
    transition: opacity 0.18s ease, transform 0.18s ease;
  }

  .onboarding-hint-anim {
    animation: hint-fade-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .onboarding-hint-anim.hiding {
    animation: hint-fade-out 0.35s ease forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1);   }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0);    }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
`;

const OnboardingHint: React.FC<{ visible: boolean; onDismiss: () => void }> = ({
  visible,
  onDismiss,
}) => {
  const [hiding, setHiding] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => dismiss(), 5000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible || gone) return null;

  const dismiss = () => {
    if (hiding) return;
    setHiding(true);
    setTimeout(() => { setGone(true); onDismiss(); }, 380);
  };

  return (
    <div
      className={`onboarding-hint-anim ${hiding ? 'hiding' : ''}`}
      onClick={dismiss}
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        zIndex: 400,
        background: 'linear-gradient(135deg, #3e5c76 0%, #3e5c76 100%)',
        color: '#ffffff',
        borderRadius: 14,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 10px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.14)',
        cursor: 'pointer',
        direction: 'rtl',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span style={{ fontSize: 18 }}>💡</span>
      <span style={{ fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>
        روی مارکرها کلیک کنید تا بتوانید ویرایش کنید
      </span>
      <span style={{
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 8,
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: '700',
        border: '1px solid rgba(255,255,255,0.25)',
        letterSpacing: 0.5,
      }}>
        فهمیدم ✓
      </span>
    </div>
  );
};

const PlacedLayerMarker: React.FC<{
  layer: Layer;
  onDelete: (id: string) => void;
  onMove: (newPosX: number, newPosY: number) => void;
  onSelect: (id: string) => void;
  index?: number;
}> = ({ layer, onDelete, onMove, onSelect, index = 0 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;

    const markerRect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - markerRect.left - 18,
      y: e.clientY - markerRect.top - 18,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseDownPos.current) return;
      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        if (!hasDragged.current) { hasDragged.current = true; setIsDragging(true); }
      }
      if (hasDragged.current) {
        const imageContainer = document.querySelector('[data-image-container="true"]');
        if (!imageContainer) return;
        const rect = imageContainer.getBoundingClientRect();
        const newPosX = (e.clientX - rect.left - dragOffset.current.x) / rect.width;
        const newPosY = (e.clientY - rect.top - dragOffset.current.y) / rect.height;
        if (newPosX >= 0 && newPosX <= 1 && newPosY >= 0 && newPosY <= 1) onMove(newPosX, newPosY);
      }
    };

    const handleMouseUp = () => {
      if (mouseDownPos.current) {
        if (!hasDragged.current) {
          setHasBeenClicked(true);
          onSelect(String(layer.id));
        }
        mouseDownPos.current = null;
        hasDragged.current = false;
        setIsDragging(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onMove, onSelect, layer.id]);

  const bounceDelay = `${(index % 5) * 0.35}s`;
  const layerName = LAYER_FA[layer.type as keyof typeof LAYER_FA] || layer.type || 'لایه';

  return (
    <div
      className={`layer-pulse layer-marker-web ${hasBeenClicked ? 'clicked' : ''}`}
      style={{
        position: 'absolute',
        left: `${layer.posX * 100}%`,
        top: `${layer.posY * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 100,
        cursor: isDragging ? 'grabbing' : 'pointer',
        // @ts-ignore
        '--bounce-delay': bounceDelay,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        style={{
          width: 38,
          height: 38,
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          boxShadow: '0 3px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
          border: '2.5px solid #e0ebf4',
          transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease, border-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.22)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(62,92,118,0.3), 0 2px 8px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = '#3e5c76';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)';
          e.currentTarget.style.borderColor = '#e0ebf4';
        }}
      >
        <img
          src={LAYER_ICON_SRC[layer.type as keyof typeof LAYER_ICON_SRC] || LAYER_ICON_SRC.OTHER}
          style={{ width: 22, height: 22, pointerEvents: 'none' }}
          alt={layerName}
        />

        {/* دکمه حذف */}
        <div
          onClick={(e) => { e.stopPropagation(); onDelete(String(layer.id)); }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            color: 'white',
            fontSize: 10,
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            border: '2.5px solid white',
            transition: 'all 0.18s ease',
            boxShadow: '0 2px 8px rgba(239,68,68,0.45)',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.transform = 'scale(1.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕
        </div>

        {/* تصویر پیش‌نمایش کوچک */}
        {(layer.imageUrl || layer.pictureUrl) && (
          <img
            src={layer.imageUrl || layer.pictureUrl}
            style={{
              position: 'absolute',
              bottom: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 26,
              height: 26,
              borderRadius: 5,
              objectFit: 'cover',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
            }}
          />
        )}
      </div>

      <div
        className="layer-tooltip"
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          left: '50%',
          transform: 'translateX(-50%) translateY(0px)',
          backgroundColor: '#3e5c76',
          color: '#ffffff',
          fontSize: 11.5,
          fontWeight: '600',
          padding: '6px 12px',
          borderRadius: 9,
          whiteSpace: 'nowrap',
          direction: 'rtl',
          pointerEvents: 'none',
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          zIndex: 200,
          letterSpacing: 0.2,
        }}
      >
        <span style={{ marginLeft: 4 }}>✏️</span>
        {layerName} — کلیک برای ویرایش
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #3e5c76',
        }} />
      </div>
    </div>
  );
};



const LayersScreen: React.FC<LayersScreenProps> = ({
  visible = false,
  onClose,
  imageUrl: initialImageUrl,
  layers = [],
  floorId,
  onImageUpload,
  floors = [],
  currentFloor: initialCurrentFloor,
  onFloorSelect,
}) => {
  const [draggingType, setDraggingType] = useState<string | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pendingImages, setPendingImages] = useState<Record<string, File>>({});

  const [showPopup, setShowPopup] = useState(visible);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null);

  const [showOnboardingHint, setShowOnboardingHint] = useState(true);

  const [internalCurrentFloor, setInternalCurrentFloor] = useState<FloorInfo | null>(initialCurrentFloor || null);
  const [internalFloorId, setInternalFloorId] = useState<string>(floorId);
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialCurrentFloor?.plotUrl || initialImageUrl || null
  );
  const [localLayers, setLocalLayers] = useState<Layer[]>(
    normalizeLayers((initialCurrentFloor?.layers as any[]) || layers)
  );

  const imageContainerRef = useRef<any>(null);
  const [webDragging, setWebDragging] = useState(false);
  const [webDragPos, setWebDragPos] = useState({ x: 0, y: 0 });
  const [webDragType, setWebDragType] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedLayerId) {
      const layer = localLayers.find(l => String(l.id) === selectedLayerId) || null;
      setSelectedLayer(layer);
    } else {
      setSelectedLayer(null);
    }
  }, [selectedLayerId, localLayers]);

  useEffect(() => {
    if (visible) {
      setInternalCurrentFloor(initialCurrentFloor || null);
      setInternalFloorId(floorId);
      setImageUrl(initialCurrentFloor?.plotUrl || initialImageUrl || null);
      setLocalLayers(normalizeLayers((initialCurrentFloor?.layers as any[]) || layers));
      setShowOnboardingHint(true);
    }
  }, [visible]);

  const handleInternalFloorSelect = async (floor: FloorInfo) => {
    setInternalCurrentFloor(floor);
    setInternalFloorId(String(floor.id));
    setImageUrl(floor.plotUrl || null);
    setLocalLayers(normalizeLayers((floor.layers as any[]) || []));
    setShowOnboardingHint(true); 
  };

  const addLayerToState = (newLayer: Layer) => {
    setLocalLayers(prev => [...prev, newLayer]);
  };

  const handleSaveAll = async () => {
    if (!internalFloorId) return;
    setIsSaving(true);
    try {
      const updatedLayers: Layer[] = [];
      for (const layer of localLayers) {
        const layerIdStr = String(layer.id);
        let finalImageUrl = layer.imageUrl || layer.pictureUrl || '';
        if (pendingImages[layerIdStr]) {
          try {
            const uploaded = await uploadPicture(pendingImages[layerIdStr]);
            finalImageUrl = uploaded.original?.url || uploaded.url || '';
          } catch (err) {
            console.error('خطا در آپلود تصویر:', err);
            alert('آپلود یکی از تصاویر ناموفق بود');
          }
        }
        if (layerIdStr.startsWith('temp_')) {
          const response = await apiAddLayer(Number(internalFloorId), {
            type: layer.type, posX: layer.posX, posY: layer.posY,
            note: layer.description || layer.note || '', pictureUrl: finalImageUrl || null,
          });
          const savedLayer = response.data.data;
          updatedLayers.push({
            ...layer, id: savedLayer.id,
            imageUrl: savedLayer.pictureUrl || savedLayer.imageUrl || '',
            pictureUrl: savedLayer.pictureUrl || '',
            description: savedLayer.note || savedLayer.description || '',
            note: savedLayer.note || '',
          });
        } else {
          await apiUpdateLayer(Number(internalFloorId), Number(layer.id), {
            type: layer.type, posX: layer.posX, posY: layer.posY,
            note: layer.description || layer.note || '', pictureUrl: finalImageUrl || null,
          });
          updatedLayers.push({ ...layer, imageUrl: finalImageUrl, pictureUrl: finalImageUrl });
        }
      }
      const normalized = normalizeLayers(updatedLayers);
      setLocalLayers(normalized);
      setPendingImages({});
      alert('تغییرات با موفقیت ذخیره شد');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => { setShowFilters(true); }, []);
  useEffect(() => { setShowPopup(visible); }, [visible]);

  const handleClosePopup = () => {
    if (onClose) onClose(localLayers);
    setShowPopup(false);
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!webDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      setWebDragPos({ x: e.clientX - 20, y: e.clientY - 20 });
    };
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      if (webDragType && imageContainerRef.current) {
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = rect.left, y = rect.top, width = rect.width, height = rect.height;
        if (e.clientX > x && e.clientX < x + width && e.clientY > y && e.clientY < y + height) {
          const posX = (e.clientX - x) / width;
          const posY = (e.clientY - y) / height;
          const newLayer: Layer = { id: `temp_${Date.now()}`, type: webDragType, posX, posY, description: '', imageUrl: '' };
          addLayerToState(newLayer);
        }
      }
      setWebDragging(false);
      setWebDragType(null);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [webDragging, webDragType, internalFloorId]);

  const DraggableIcon = ({ type }: { type: string }) => {
    const isWeb = Platform.OS === "web";
    if (isWeb) {
      const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        setWebDragging(true); setWebDragType(type);
        setWebDragPos({ x: e.clientX - 20, y: e.clientY - 20 });
      };
      return (
        <div
          style={{
            padding: '12px 16px', cursor: 'grab', userSelect: 'none',
            transition: 'all 0.2s ease', borderRadius: '8px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <img
            src={LAYER_ICON_SRC[type as keyof typeof LAYER_ICON_SRC]}
            style={{ width: 24, height: 24, pointerEvents: 'none' }}
            draggable={false} alt={type}
          />
          <span style={{
            fontSize: 14, color: '#333333', fontWeight: '500',
            pointerEvents: 'none', fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            {LAYER_FA[type as keyof typeof LAYER_FA]}
          </span>
        </div>
      );
    } else {
      const gesture = Gesture.Pan()
        .onBegin((e) => {
          isDragging.value = true;
          runOnJS(setDraggingType)(type);
          dragX.value = e.absoluteX - 20;
          dragY.value = e.absoluteY - 20;
        })
        .onUpdate((e) => { dragX.value = e.absoluteX - 20; dragY.value = e.absoluteY - 20; })
        .onEnd((e) => {
          if (imageContainerRef.current) {
            imageContainerRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
              if (e.absoluteX > px && e.absoluteX < px + width && e.absoluteY > py && e.absoluteY < py + height) {
                const posX = (e.absoluteX - px) / width;
                const posY = (e.absoluteY - py) / height;
                const newLayer: Layer = { id: `temp_${Date.now()}`, type, posX, posY, description: '', imageUrl: '' };
                runOnJS(addLayerToState)(newLayer);
              }
            });
          }
          isDragging.value = false;
          runOnJS(setDraggingType)(null);
        });
      return (
        <GestureDetector gesture={gesture}>
          <View style={styles.addMenuItem}>
            <View style={styles.addMenuRow}>
              <Image source={LAYER_ICON_SRC[type as keyof typeof LAYER_ICON_SRC]} style={styles.addMenuIcon} />
              <Text style={styles.addMenuText}>{LAYER_FA[type as keyof typeof LAYER_FA]}</Text>
            </View>
          </View>
        </GestureDetector>
      );
    }
  };

  const handleDeleteLayer = async (layerId: string) => {
    try {
      setLocalLayers(prev => prev.filter(l => String(l.id) !== layerId));
      if (!layerId.startsWith('temp_') && internalFloorId) {
        await apiDeleteLayer(Number(internalFloorId), String(layerId));
      }
    } catch (err) {
      console.error('خطا در حذف لایه:', err);
      setLocalLayers(prev => [...prev]);
      alert('حذف لایه موفق نبود. دوباره تلاش کنید.');
    }
  };

  const dragStyle = useAnimatedStyle(() => ({
    position: 'absolute', left: dragX.value, top: dragY.value,
    width: 40, height: 40, zIndex: 9999,
    opacity: isDragging.value ? 0.8 : 0,
  }));

  const { width, height } = Dimensions.get('window');
  const uniqueLayerTypes = Array.from(
    new Map(localLayers.filter(l => l.type).map(l => [l.type, l])).values()
  );

  return (
    <View style={styles.container}>
      <Modal visible={showPopup} transparent animationType="fade" onRequestClose={handleClosePopup}>
        <View style={styles.modalOverlay}>
          <View style={[styles.popupContainer, { width: '100%', maxWidth: Math.min(width * 0.92, 980) }]}>

            {Platform.OS !== 'web' && draggingType && (
              <Animated.View style={dragStyle} pointerEvents="none">
                <Image source={LAYER_ICON_SRC[draggingType as keyof typeof LAYER_ICON_SRC]} style={{ width: 40, height: 40 }} resizeMode="contain" />
              </Animated.View>
            )}

            {Platform.OS === 'web' && webDragging && webDragType && (
              <div style={{
                position: "fixed", left: webDragPos.x, top: webDragPos.y,
                width: 40, height: 40, zIndex: 99999, pointerEvents: "none", opacity: 0.9,
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))',
              }}>
                <img src={LAYER_ICON_SRC[webDragType as keyof typeof LAYER_ICON_SRC]} style={{ width: 40, height: 40 }} draggable={false} />
              </div>
            )}

            <View style={styles.popupHeader}>
              <View style={styles.headerContent}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.popupTitle}>مدیریت لایه‌ها</Text>
                  {internalCurrentFloor && (
                    <Text style={styles.popupSubtitle}>
                      {internalCurrentFloor.isSite ? 'سایت' : internalCurrentFloor.isHalf ? `نیم‌طبقه ${internalCurrentFloor.number}` : internalCurrentFloor.number === 0 ? 'همکف' : `طبقه ${internalCurrentFloor.number}`}
                      {' • '}
                      {FLOOR_APPLICATION_FA[internalCurrentFloor.application] || internalCurrentFloor.application}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClosePopup}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {floors.length > 0 && (
              <View style={styles.floorSelectorSection}>
                <View style={styles.floorSelectorHeader}>
                  <Text style={styles.floorScrollHint}>← کشیدن برای مشاهده بیشتر</Text>
                  {floors.length > 3 && <Text style={styles.floorSelectorTitle}>نمای طبقه</Text>}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorButtonsScroll} contentContainerStyle={styles.floorButtonsContent}>
                  {floors.map((floorItem) => (
                    <TouchableOpacity
                      key={floorItem.id}
                      style={[styles.floorButton, internalCurrentFloor?.id === floorItem.id && styles.floorButtonActive]}
                      onPress={() => handleInternalFloorSelect(floorItem)}
                    >
                      <Text style={[styles.floorButtonText, internalCurrentFloor?.id === floorItem.id && styles.floorButtonTextActive]}>
                        {floorItem.isSite ? 'سایت' : floorItem.isHalf ? `نیم‌طبقه ${floorItem.number}` : floorItem.number === 0 ? 'همکف' : `طبقه ${floorItem.number}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.popupContent}>
              {/* ─── بخش عکس ─── */}
              <View style={styles.imageSection}>
                {Platform.OS === 'web' ? (
                  <div
                    ref={imageContainerRef}
                    data-image-container="true"
                    style={{
                      width: '100%', aspectRatio: 1, backgroundColor: '#fafafa',
                      borderRadius: '16px', display: 'flex', justifyContent: 'center',
                      alignItems: 'center', border: '2px solid #eaeaea',
                      position: 'relative', overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="پلان طبقه" />

                        {/* ─── Onboarding Hint ─── */}
                        <OnboardingHint
                          visible={showOnboardingHint && localLayers.length > 0}
                          onDismiss={() => setShowOnboardingHint(false)}
                        />

                        {/* ─── مارکرها با index ─── */}
                        {localLayers.map((layer, idx) => {
                          if (layer.posX == null || layer.posY == null || !layer.type) return null;
                          return (
                            <PlacedLayerMarker
                              key={layer.id}
                              layer={layer}
                              index={idx}
                              onDelete={handleDeleteLayer}
                              onSelect={(id) => setSelectedLayerId(id)}
                              onMove={(newPosX, newPosY) => {
                                setLocalLayers(prev => prev.map(l => l.id === layer.id ? { ...l, posX: newPosX, posY: newPosY } : l));
                              }}
                            />
                          );
                        })}
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: 16, color: '#666666', fontWeight: '600' }}>تصویری موجود نیست</span>
                        <span style={{ fontSize: 13, color: '#999999', textAlign: 'center' }}>برای شروع یک تصویر آپلود کنید</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <View ref={imageContainerRef} style={styles.imageContainer}>
                    {imageUrl ? (
                      <>
                        <Image source={{ uri: imageUrl }} style={styles.floorImage} resizeMode="contain" />
                        {localLayers.map((layer) => {
                          if (layer.posX == null || layer.posY == null || !layer.type) return null;
                          return (
                            <TouchableOpacity
                              key={layer.id}
                              onPress={() => setSelectedLayerId(String(layer.id))}
                              style={[styles.layerMarker, { left: `${layer.posX * 100}%`, top: `${layer.posY * 100}%` }]}
                            >
                              <View style={styles.layerMarkerCircle}>
                                <Image source={LAYER_ICON_SRC[layer.type as keyof typeof LAYER_ICON_SRC] || LAYER_ICON_SRC.OTHER} style={styles.layerMarkerIcon} resizeMode="contain" />
                                <TouchableOpacity
                                  onPress={(e) => { e.stopPropagation(); handleDeleteLayer(String(layer.id)); }}
                                  style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' }}
                                >
                                  <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>✕</Text>
                                </TouchableOpacity>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    ) : (
                      <View style={styles.emptyImageState}><Text style={styles.emptyImageText}>تصویری موجود نیست</Text></View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.layersPanel}>
                <View style={styles.layersPanelHeader}>
                  <Text style={styles.layersPanelTitle}>فیلترهای نمایش</Text>
                  <View style={styles.layersBadge}>
                    <Text style={styles.layersBadgeText}>{localLayers.length}</Text>
                  </View>
                </View>


                <ScrollView showsVerticalScrollIndicator={false} style={styles.layersScrollView} contentContainerStyle={styles.layersScrollContent}>
                  {localLayers.length === 0 ? (
                    <View style={styles.emptyLayersState}>
                      <Text style={styles.emptyLayersText}>هنوز لایه‌ای اضافه نشده</Text>
                      <Text style={styles.emptyLayersSubtext}>لایه‌های مورد نظر را از منوی زیر بکشید و رها کنید</Text>
                    </View>
                  ) : (
                    <View style={styles.filterTagsContainer}>
                      {uniqueLayerTypes.map((layer, index) => (
                        <div key={layer.type} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                          opacity: showFilters ? 1 : 0, transition: 'opacity 0.3s ease',
                          animation: showFilters ? `slideUp 0.3s ease forwards ${index * 0.03}s` : undefined,
                          borderBottom: '1px solid #f0f0f0', paddingBottom: '4px',
                        }}>
                          <DraggableIcon type={layer.type!} />
                        </div>
                      ))}
                    </View>
                  )}
                </ScrollView>

                <View style={styles.addMenuContainer}>
                  <TouchableOpacity
                    style={[styles.addMenuTrigger, showAddMenu && styles.addMenuTriggerActive]}
                    onPress={() => setShowAddMenu(!showAddMenu)}
                  >
                    <Text style={styles.addMenuTriggerIcon}>{showAddMenu ? '✕' : '+'}</Text>
                    <Text style={styles.addMenuTriggerText}>{showAddMenu ? 'بستن منو' : 'افزودن لایه جدید'}</Text>
                  </TouchableOpacity>
                  {showAddMenu && (
                    <View style={styles.addMenuDropdown}>
                      {Platform.OS === 'web' ? (
                        <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '8px' }}>
                          {Object.keys(LAYER_ICON_SRC).map((type, index) => (
                            <div key={type} style={{ animation: `slideIn 0.3s ease forwards`, animationDelay: `${index * 0.03}s`, opacity: 0 }}>
                              <DraggableIcon type={type} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280, padding: 8 }}>
                          {Object.keys(LAYER_ICON_SRC).map((type) => <DraggableIcon key={type} type={type} />)}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.saveButtonContainer}>
                  <TouchableOpacity style={[styles.saveButton, isSaving && { opacity: 0.6 }]} onPress={handleSaveAll} disabled={isSaving}>
                    <Text style={styles.saveButtonText}>{isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {Platform.OS === 'web' && <style>{LAYER_CSS}</style>}
      </Modal>

      {/* ─── مودال ویرایش لایه ─── */}
      <Modal visible={!!selectedLayer} transparent animationType="fade" onRequestClose={() => setSelectedLayerId(null)}>
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>ویرایش لایه</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedLayerId(null)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedLayer && (
              <View style={styles.editModalBody}>
                <TextInput
                  style={styles.editModalDescriptionInput}
                  placeholder="توضیحات لایه را وارد کنید..."
                  value={selectedLayer?.description || selectedLayer?.note || ''}
                  onChangeText={(text) => {
                    setLocalLayers(prev => prev.map(l => l.id === selectedLayer?.id ? { ...l, description: text, note: text } : l));
                    setSelectedLayer(prev => prev ? { ...prev, description: text, note: text } : prev);
                  }}
                  multiline textAlign="right"
                />
                <View style={styles.editModalImageSection}>
                  <TouchableOpacity
                    style={styles.layerUploadButton}
                    onPress={() => {
                      if (Platform.OS !== 'web') return;
                      const input = document.createElement('input');
                      input.type = 'file'; input.accept = 'image/*';
                      input.onchange = async (e: any) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                          const uploaded = await uploadPicture(file);
                          const uploadedUrl = uploaded.original?.url || uploaded.url || '';
                          setPendingImages(prev => ({ ...prev, [String(selectedLayer!.id)]: file }));
                          setLocalLayers(prev => prev.map(l => l.id === selectedLayer!.id ? { ...l, imageUrl: uploadedUrl, pictureUrl: uploadedUrl } : l));
                          setSelectedLayer(prev => prev ? { ...prev, imageUrl: uploadedUrl, pictureUrl: uploadedUrl } : prev);
                          if (onImageUpload) onImageUpload(uploadedUrl);
                        } catch (err) {
                          console.error('خطا در آپلود تصویر:', err);
                          alert('آپلود تصویر ناموفق بود');
                        }
                      };
                      input.click();
                    }}
                  >
                    <Text style={styles.layerUploadButtonText}>آپلود عکس</Text>
                  </TouchableOpacity>
                  {(selectedLayer.imageUrl || selectedLayer.pictureUrl) ? (
                    <Image source={{ uri: selectedLayer.imageUrl || selectedLayer.pictureUrl }} style={styles.editModalPreviewImage} />
                  ) : (
                    <View style={styles.editModalPreviewPlaceholder}>
                      <Text style={styles.layerPreviewPlaceholderText}>بدون تصویر</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.editModalConfirmButton}
                  onPress={() => {
                    if (selectedLayer) {
                      setLocalLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, ...selectedLayer } : l));
                    }
                    setSelectedLayerId(null);
                  }}
                >
                  <Text style={styles.editModalConfirmText}>تایید</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  editModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  editModalContainer: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 12 },
  editModalHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  editModalTitle: { fontSize: 18, fontWeight: '700', color: '#333333' },
  editModalBody: { padding: 20, gap: 16 },
  editModalImageSection: { alignItems: 'center', gap: 12 },
  editModalPreviewImage: { width: 140, height: 140, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  editModalPreviewPlaceholder: { width: 140, height: 140, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  editModalDescriptionInput: { minHeight: 100, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fafafa', fontSize: 14, textAlignVertical: 'top', textAlign: 'right', writingDirection: 'rtl' },
  editModalConfirmButton: { paddingVertical: 14, backgroundColor: '#22c55e', borderRadius: 12, alignItems: 'center' },
  editModalConfirmText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  container: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  popupContainer: { width: '100%', maxWidth: 980, maxHeight: height * 0.8, backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
  popupHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#ffffff' },
  headerContent: { flexDirection: 'row-reverse', alignItems: 'center', gap: 16 },
  headerTextContainer: { gap: 4, textAlign: 'right' },
  popupTitle: { fontSize: 22, fontWeight: '700', color: '#333333', fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined },
  popupSubtitle: { fontSize: 13, color: '#999999', fontWeight: '500' },
  closeButton: { width: 40, height: 40, borderRadius: 16, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 20, color: '#666666', fontWeight: '600' },
  floorSelectorSection: { paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#ffffff' },
  floorSelectorHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  floorSelectorTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  floorScrollHint: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic', flexDirection: 'row-reverse' },
  floorButtonsScroll: { flexDirection: 'row-reverse' },
  floorButtonsContent: { paddingRight: 8, gap: 8 },
  floorButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', marginRight: 8 },
  floorButtonActive: { borderColor: '#0284C7', backgroundColor: '#EFF6FF' },
  floorButtonText: { fontSize: 12, color: '#374151' },
  floorButtonTextActive: { color: '#0C4A6E', fontWeight: '500' },
  popupContent: { flexDirection: width > 768 ? 'row-reverse' : 'column', padding: 24, gap: 24, flex: 1, backgroundColor: '#fafafa' },
  imageSection: { flex: width > 768 ? 1.2 : undefined, gap: 16 },
  imageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#fafafa', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#eaeaea', position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  floorImage: { width: '100%', height: '100%' },
  layerMarker: { position: 'absolute', transform: [{ translateX: -16 }, { translateY: -16 }], zIndex: 100 },
  layerMarkerCircle: { width: 32, height: 32, backgroundColor: '#ffffff', borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, borderWidth: 2, borderColor: '#f0f0f0' },
  layerMarkerIcon: { width: 20, height: 20 },
  emptyImageState: { alignItems: 'center', gap: 12 },
  emptyImageIcon: { fontSize: 64, opacity: 0.2, color: '#999999' },
  emptyImageText: { fontSize: 16, color: '#666666', fontWeight: '600' },
  emptyImageSubtext: { fontSize: 13, color: '#999999', textAlign: 'center' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#f5f5f5', borderRadius: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  uploadButtonIcon: { fontSize: 18, color: '#666666' },
  uploadButtonText: { fontSize: 15, color: '#333333', fontWeight: '600' },
  layersPanel: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', minHeight: 400, borderWidth: 1, borderColor: '#eaeaea' },
  layersPanelHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#ffffff' },
  layersPanelTitle: { fontSize: 16, fontWeight: '700', color: '#333333' },
  layersBadge: { backgroundColor: '#f5f5f5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  layersBadgeText: { fontSize: 13, fontWeight: '700', color: '#666666' },
  layersScrollView: { flex: 1, flexDirection: 'row-reverse', backgroundColor: '#ffffff' },
  layersScrollContent: { padding: 16 },
  emptyLayersState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyLayersIcon: { fontSize: 56, opacity: 0.2, color: '#999999' },
  emptyLayersText: { fontSize: 15, color: '#666666', fontWeight: '600' },
  emptyLayersSubtext: { fontSize: 13, color: '#999999', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
  filterTagsContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  filterTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f5f5f5', borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0' },
  filterTagContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterTagIcon: { width: 20, height: 20 },
  filterTagText: { fontSize: 13, color: '#333333', fontWeight: '500' },
  filterTagClose: { fontSize: 16, color: '#999999', marginLeft: 4 },
  addMenuContainer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: '#ffffff' },
  addMenuTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#f5f5f5', borderRadius: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  addMenuTriggerActive: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  addMenuTriggerIcon: { fontSize: 20, color: '#666666', fontWeight: '600' },
  addMenuTriggerText: { fontSize: 14, color: '#666666', fontWeight: '600' },
  addMenuDropdown: { marginTop: 12, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#eaeaea', overflow: 'hidden' },
  addMenuItem: { padding: 12 },
  addMenuRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addMenuIcon: { width: 24, height: 24, tintColor: '#333333' },
  addMenuText: { fontSize: 14, color: '#333333', fontWeight: '500' },
  saveButtonContainer: { padding: 16, paddingTop: 0, backgroundColor: '#ffffff' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#f0fdf4', borderRadius: 16, borderWidth: 1, borderColor: '#bbf7d0' },
  saveButtonIcon: { fontSize: 18 },
  saveButtonText: { fontSize: 15, color: '#22c55e', fontWeight: '700' },
  imageActionsRow: { marginTop: 5 },
  layerEditBox: { padding: 8, gap: 10 },
  layerEditRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  layerUploadColumn: { alignItems: 'center', gap: 8 },
  layerUploadButton: { width: '100%', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#3e5c76', borderRadius: 8, alignItems: 'center' },
  layerUploadButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  layerPreviewImage: { width: 100, height: 100, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  layerPreviewPlaceholder: { width: 100, height: 100, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  layerPreviewPlaceholderText: { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
  layerDescriptionColumn: { flex: 1, gap: 6 },
  layerDescriptionLabel: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'right' },
  layerDescriptionInput: { flex: 1, minHeight: 40, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#fafafa', fontSize: 13, textAlignVertical: 'top', textAlign: 'right', writingDirection: 'rtl' },
  descriptionBox: { flex: 1 },
  descriptionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4, color: '#333' },
  descriptionInput: { minHeight: 48, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 16, padding: 8, backgroundColor: '#fafafa', fontSize: 13, textAlign: 'right', writingDirection: 'rtl' },
});

export default LayersScreen;
