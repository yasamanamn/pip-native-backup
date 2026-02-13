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
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

import { LAYER_ICON_SRC, LAYER_FA } from "../../../../constants/layerIcons";
import { Platform } from 'react-native';


interface LayerType {
  type: string;
  count: number;
  description: string;
}

interface LayersInfo {
  totalLayers: number;
  layerTypes: LayerType[];
}

interface Layer {
  id: string;
  type?: string;
  posX: number;
  posY: number;
}

interface LayersScreenProps {
  visible?: boolean;
  onClose?: () => void;
  imageUrl?: string | null;
  layers?: Layer[];
}

const LayersScreen: React.FC<LayersScreenProps> = ({
  visible = false,
  onClose,
  imageUrl,
  layers = []
}) => {
  const [draggingType, setDraggingType] = useState<string | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);  
  const totalLayerCount = layers.length;
  const [showPopup, setShowPopup] = useState(visible);
  const [showDescription, setShowDescription] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const [localLayers, setLocalLayers] = useState<Layer[]>(layers);
  const imageLayout = useRef<any>(null);

  useEffect(() => {
    setShowPopup(visible);
  }, [visible]);

  useEffect(() => {
    setLocalLayers(layers);
  }, [layers]);

  const handleClosePopup = () => {
    setShowPopup(false);
    if (onClose) onClose();
  };

  const handleDrop = (type: string, absoluteX: number, absoluteY: number) => {
    if (!imageLayout.current) return;

    const { x, y, width, height } = imageLayout.current;

    if (
      absoluteX < x ||
      absoluteX > x + width ||
      absoluteY < y ||
      absoluteY > y + height
    ) return;

    const posX = (absoluteX - x) / width;
    const posY = (absoluteY - y) / height;

    const newLayer: Layer = {
      id: Date.now().toString(),
      type,
      posX,
      posY,
    };

    setLocalLayers(prev => [...prev, newLayer]);
  };

  const DraggableIcon = ({ type }: { type: string }) => {
    const isWeb = Platform.OS === "web";
  
    if (isWeb) {
      const [dragging, setDragging] = useState(false);
      const [pos, setPos] = useState({ x: 0, y: 0 });
  
      const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(true);
        setPos({ x: e.clientX - 20, y: e.clientY - 20 });
      };
  
      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
        setPos({ x: e.clientX - 20, y: e.clientY - 20 });
      };
  
      const handleMouseUp = (e: MouseEvent) => {
        if (!dragging) return;
        setDragging(false);
  
        if (imageLayout.current) {
          const { x, y, width, height } = imageLayout.current;
          if (
            e.clientX > x &&
            e.clientX < x + width &&
            e.clientY > y &&
            e.clientY < y + height
          ) {
            const posX = (e.clientX - x) / width;
            const posY = (e.clientY - y) / height;
            const newLayer: Layer = {
              id: Date.now().toString(),
              type,
              posX,
              posY,
            };
            setLocalLayers(prev => [...prev, newLayer]);
          }
        }
      };
  
      useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
        };
      });
  
      return (
        <>
          <View
            style={styles.addMenuRow}
            onMouseDown={handleMouseDown as any} 
          >
            <Image
              source={LAYER_ICON_SRC[type as keyof typeof LAYER_ICON_SRC]}
              style={styles.addMenuIcon}
            />
            <Text style={styles.addMenuText}>
              {LAYER_FA[type as keyof typeof LAYER_FA]}
            </Text>
          </View>
  
          {dragging && (
            <Image
              source={LAYER_ICON_SRC[type as keyof typeof LAYER_ICON_SRC]}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: 40,
                height: 40,
                zIndex: 9999,
                pointerEvents: "none",
              }}
            />
          )}
        </>
      );
    } else {
      const gesture = Gesture.Pan()
        .onBegin((e) => {
          runOnJS(setDraggingType)(type);
          dragX.value = e.absoluteX - 20;
          dragY.value = e.absoluteY - 20;
        })
        .onUpdate((e) => {
          dragX.value = e.absoluteX - 20;
          dragY.value = e.absoluteY - 20;
        })
        .onEnd((e) => {
          runOnJS(handleDrop)(type, e.absoluteX, e.absoluteY);
          runOnJS(setDraggingType)(null);
        });
  
      return (
        <GestureDetector gesture={gesture}>
          <View style={styles.addMenuItem}>
            <View style={styles.addMenuRow}>
              <Image
                source={LAYER_ICON_SRC[type as keyof typeof LAYER_ICON_SRC]}
                style={styles.addMenuIcon}
              />
              <Text style={styles.addMenuText}>
                {LAYER_FA[type as keyof typeof LAYER_FA]}
              </Text>
            </View>
          </View>
        </GestureDetector>
      );
    }
  };
  
  const dragStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: dragX.value,
    top: dragY.value,
    zIndex: 9999,
  }));
    
  

  const layerCountsByType = React.useMemo(() => {
    const result: Record<string, number> = {};
    localLayers.forEach(layer => {
      const type = layer.type || "UNKNOWN";
      result[type] = (result[type] || 0) + 1;
    });
    return result;
  }, [localLayers]);

  const layerTypesArray = Object.entries(layerCountsByType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const { width, height } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      <Modal
        visible={showPopup}
        transparent
        animationType="slide"
        onRequestClose={handleClosePopup}
      >
<View style={styles.modalOverlay}>
<View style={styles.popupContainer}>
{draggingType && (
  <Animated.View style={dragStyle} pointerEvents="none">
    <Image
      source={
        LAYER_ICON_SRC[
          draggingType as keyof typeof LAYER_ICON_SRC
        ]
      }
      style={{ width: 40, height: 40 }}
      resizeMode="contain"
    />
  </Animated.View>
)}


            {/* HEADER */}
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>اطلاعات لایه‌ها</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  onPress={() => setShowDescription(true)}
                  style={styles.infoButton}
                >
                  <Text style={styles.infoButtonText}>ℹ️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClosePopup}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.popupContent}>

              {/* LEFT */}
              <View style={styles.leftSection}>

                <View style={styles.imageTopBar}>
                  <TouchableOpacity
                    style={styles.plusButton}
                    onPress={() => setShowAddMenu(!showAddMenu)}
                  >
                    <Text style={styles.plusButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={styles.imagePlaceholder}
                  onLayout={(e) => {
                    imageLayout.current = e.nativeEvent.layout;
                  }}
                >
                  {imageUrl ? (
                    <View style={styles.floorPlanImageContainer}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.floorPlanImage}
                        resizeMode="stretch"
                      />

                      {localLayers.map((layer) => {
                        if (layer.posX == null || layer.posY == null) return null;

                        return (
                          <TouchableOpacity
                            key={layer.id}
                            style={[
                              styles.layerMarker,
                              {
                                left: `${layer.posX * 100}%`,
                                top: `${layer.posY * 100}%`,
                              },
                            ]}
                          >
                            <Image
                              source={
                                LAYER_ICON_SRC[layer.type as keyof typeof LAYER_ICON_SRC] ||
                                LAYER_ICON_SRC.OTHER
                              }
                              style={styles.layerIcon}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>
                      تصویری موجود نیست
                    </Text>
                  )}
                </View>

                {showAddMenu && (
                  <View style={styles.addMenu}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {Object.keys(LAYER_ICON_SRC).map((type) => (
                        <DraggableIcon key={type} type={type} />
                      ))}
                    </ScrollView>
                  </View>
                )}

              </View>

              {/* RIGHT */}
              <View style={styles.rightSection}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.infoCard}>
                    <View style={styles.totalInfo}>
                      <View style={styles.totalText}>
                        <Text style={styles.totalLabel}>
                          تعداد کل لایه‌ها
                        </Text>
                        <Text style={styles.totalCount}>
                          {localLayers.length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>
                    لایه‌ها بر اساس نوع
                  </Text>

                  {layerTypesArray.map((layerType, index) => (
                    <View key={index} style={styles.layerTypeCard}>
                      <View style={styles.layerTypeHeader}>
                        <Text style={styles.layerTypeCount}>
                          {layerType.count}
                        </Text>
                        <Text style={styles.layerTypeName}>
                          {LAYER_FA[layerType.type] ?? layerType.type}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => {
                    console.log('Upload Image Clicked');
                  }}
                >
                  <Text style={styles.uploadButtonText}>
                    🖼 آپلود عکس
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    width: 1258.5,
    height: height * 0.8,
    backgroundColor: 'white',
    borderRadius: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  
  imageTopBar: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  floorPlanImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  

  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  plusButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },

  uploadButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },

  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  layerIcon: {
  width: 24,
  height: 24,
},

  floorPlanImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',   
  },
  

  layerMarker: {
    position: 'absolute',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },

  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  infoButtonText: {
    fontSize: 16,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  popupContent: {
    flex: 1,
    flexDirection: 'row',
  },
  leftSection: {
    flex: 1,
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },

  addMenu: {
    position: 'absolute',
    bottom: 60,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    width: 170,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  addMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  addMenuText: {
    fontSize: 14,
    color: '#333',
  },

  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  placeholderSubText: {
    marginTop: 5,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  rightSection: {
    flex: 1.5,
    padding: 20,
  },
  floorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },

  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  totalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalText: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  layerTypeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  layerTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  layerTypeCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginRight: 12,
    minWidth: 30,
  },
  layerTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  layerTypeDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  descriptionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  descriptionBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  descriptionCloseButton: {
    padding: 4,
  },
  descriptionCloseText: {
    fontSize: 18,
    color: '#666',
  },
  descriptionContent: {
    padding: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  descriptionNote: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },

  addMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  addMenuIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },

});

export default LayersScreen;
