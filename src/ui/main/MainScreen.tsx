import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdZoomIn, MdClose, MdAssignment, MdChecklist } from 'react-icons/md';

import Map3DWeb from './components/leaflet/Map3DWeb.ReactNative';
import SearchBox from './components/SearchBox';
import { ApiBuildingSummaryInfo } from '../../types/building';
import { useMainViewModel } from './MainViewModel';
import { LAYER_ICON_SRC, LAYER_FA } from '../../constants/layerIcons';
import LayersScreen from './components/layers/layers';
import TabletSidebar from './components/sidebar/TabletSidebar';
import { getBuildingForms, getFormById } from '../../services/forms.service';
import { api } from '../../config/api.config';

import FormResponsePage from './components/forms/formspage';

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

type LayerInfo = {
  id: number;
  type: string;
  note?: string | null;
  pictureUrl?: string | null;
  posX: number;
  posY: number;
  rotationDeg?: number | null;
  forms: any[];
};

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

const FLOOR_APPLICATION_FA: Record<string, string> = {
  RESIDENTIAL: 'مسکونی',
  COMMERCIAL: 'تجاری',
  OFFICE: 'اداری',
  INDUSTRIAL: 'صنعتی',
  PARKING: 'پارکینگ',
  STORAGE: 'انبار',
  OTHER: 'سایر',
};

export default function MainScreenWeb() {
  const { uiState, actions } = useMainViewModel();
  const navigate = useNavigate();

  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [selectedStory, setSelectedStory] = useState<StoryInfo | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<FloorInfo | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);
  const [loadingBuilding, setLoadingBuilding] = useState(false);
  const [buildingForms, setBuildingForms] = useState<any[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [layersModalVisible, setLayersModalVisible] = useState(false);
  const [selectedFloorForLayers, setSelectedFloorForLayers] = useState<FloorInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'pip' | 'checklist' | 'notifications' | 'profile' | 'dashboard'>('map');
  const [mapTarget, setMapTarget] = useState<{ latitude: number; longitude: number; renovationCode?: string } | null>(null);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [activeFormId, setActiveFormId] = useState<number | null>(null);
  const [activeRenovationCode, setActiveRenovationCode] = useState<string | null>(null);
  const [activeFormData, setActiveFormData] = useState<any | null>(null);

  useEffect(() => {
    actions.onScreenDisplayed();
  }, []);

  const handleQueryChanged = (q: string) => {
    actions.onQueryChanged(q);
    if (q.length > 0) setIsLeftPaneOpen(true);
  };

  const handleProjectClick = (b: ApiBuildingSummaryInfo) => {
    actions.onSelectProject(b);
    setIsLeftPaneOpen(true);
    if (b.latitude && b.longitude) {
      setMapTarget({ latitude: b.latitude, longitude: b.longitude, renovationCode: b.renovationCode });
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if ((tab === 'pip' || tab === 'checklist') && activeRenovationCode && activeFormId) {
      setFormModalVisible(true);
    }
  };

  const handleBuildingSelect = (building: BuildingInfo, story: StoryInfo, floor: FloorInfo) => {
    setSelectedBuilding(building);
    setSelectedStory(story);
    setSelectedFloor(floor);

    const code = building?.renovationCode || story?.renovationCode;
    if (code) {
      setActiveRenovationCode(code);
      fetchBuildingForms(code);
    }

    if (building || story) setIsLeftPaneOpen(true);
  };

  const handleFloorSelect = (floor: FloorInfo) => setSelectedFloor(floor);

  const handleBackToSearch = () => {
    setSelectedBuilding(null);
    setSelectedStory(null);
    setSelectedFloor(null);
    setSelectedLayer(null);
    setActiveFormId(null);
    setActiveRenovationCode(null);
    setBuildingForms([]);
  };

  const handleCloseLeftPane = () => {
    setIsLeftPaneOpen(false);
    actions.onQueryChanged('');
  };

  const handleFloorImageClick = (floor: FloorInfo) => {
    setSelectedFloorForLayers(floor);
    setLayersModalVisible(true);
  };

  const handleCloseLayersModal = (updatedLayers?: any[]) => {
    if (updatedLayers && selectedFloorForLayers && selectedBuilding) {
      const updatedFloors = selectedBuilding.floors.map(f =>
        f.id === selectedFloorForLayers.id ? { ...f, layers: updatedLayers } : f
      );
      setSelectedBuilding({ ...selectedBuilding, floors: updatedFloors });
      if (selectedFloor?.id === selectedFloorForLayers.id) {
        setSelectedFloor({ ...selectedFloorForLayers, layers: updatedLayers });
      }
    }
    setLayersModalVisible(false);
    setSelectedFloorForLayers(null);
  };

  const fetchBuildingForms = async (renovationCode: string) => {
    try {
      setFormsLoading(true);
      const res = await getBuildingForms(renovationCode);
      setBuildingForms(res.data || []);
    } catch (e) {
      console.log('FORMS ERROR:', e);
    } finally {
      setFormsLoading(false);
    }
  };

  const openForm = async (formId: number) => {
    const renovationCode = selectedBuilding?.renovationCode || selectedStory?.renovationCode;
    if (!renovationCode) return;

    setActiveFormId(formId);
    setActiveRenovationCode(renovationCode);
    setActiveFormData(null);
    setFormModalVisible(true);

    try {
      const res = await api.get(`/forms/${formId}`);
      const json = res.data;
      console.log('FORM RESPONSE success:', json?.success, 'groups:', json?.data?.questionGroups?.length);
      if (json?.success) {
        setActiveFormData({
          ...json.data,
          questionGroups: json.data?.questionGroups ?? [],
        });
      }
    } catch (e) {
      console.error('OPEN FORM ERROR:', e);
    }
  };

  const handleFormSaved = (responseId: number, formType: string) => {
    setFormModalVisible(false);
    setActiveFormId(null);
  };

  return (
    <View style={styles.root}>
      <TabletSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        notificationCount={3}
        userName="علی رضایی"
        userRole="بازرس ارشد"
        onLogout={() => {}}
      />
      {isLeftPaneOpen && (
        <View style={styles.leftPane}>
          <View style={styles.leftPaneHeader}>
            {(selectedBuilding || selectedStory) ? (
              <TouchableOpacity style={styles.backBtn} onPress={handleBackToSearch}>
                <MdArrowBack size={22} color="#666" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.closeBtn} onPress={handleCloseLeftPane}>
                <MdClose size={22} color="#666" />
              </TouchableOpacity>
            )}
            <View style={styles.searchInPane}>
              <SearchBox
                query={uiState.query}
                onQueryChanged={handleQueryChanged}
                variant="inline"
              />
            </View>
          </View>

          {(selectedBuilding || selectedStory) ? (
            <BuildingInformation
              building={selectedBuilding}
              story={selectedStory}
              forms={buildingForms}
              floor={selectedFloor}
              floors={selectedBuilding?.floors || []}
              selectedLayer={selectedLayer}
              onLayerSelect={setSelectedLayer}
              onFloorSelect={handleFloorSelect}
              loading={loadingBuilding}
              onFloorImageClick={handleFloorImageClick}
              onOpenForm={openForm}
            />
          ) : (
            <View style={{ flex: 1, padding: 8 }}>
              {uiState.filteredBuildings.length > 0 && (
                <FlatList
                  data={uiState.filteredBuildings}
                  keyExtractor={(item, index) => item.renovationCode ?? String(index)}
                  contentContainerStyle={{ paddingVertical: 8 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.item} onPress={() => handleProjectClick(item)}>
                      <Text style={styles.itemTitle}>{item.projectName ?? 'پروژه نامشخص'}</Text>
                      <Text style={styles.itemSub}>کد نوسازی: {item.renovationCode ?? 'نامشخص'}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.rightPane}>
        {!isLeftPaneOpen && (
          <View style={styles.searchOverlay}>
            <SearchBox
              query={uiState.query}
              onQueryChanged={handleQueryChanged}
              onFocus={() => setIsLeftPaneOpen(true)}
              variant="overlay"
            />
          </View>
        )}
        <Map3DWeb
          flyToLocation={mapTarget}
          onBuildingSelect={handleBuildingSelect}
          selectedBuilding={selectedBuilding}
          selectedStory={selectedStory}
          selectedFloorId={selectedFloor?.id}
        />
      </View>

      {selectedFloorForLayers && (
        <LayersScreen
          visible={layersModalVisible}
          onClose={handleCloseLayersModal}
          imageUrl={selectedFloorForLayers.plotUrl}
          layers={selectedFloorForLayers.layers || []}
          floorId={String(selectedFloorForLayers.id)}
          floors={selectedBuilding?.floors || []}
          currentFloor={selectedFloorForLayers}
          onFloorSelect={handleFloorSelect}
        />
      )}


      <View
      >
    {formModalVisible && activeFormId && activeRenovationCode && (
  <View>
    <FormResponsePage
      formId={activeFormId}
      renovationCode={activeRenovationCode}
      initialFormData={activeFormData}   
      onSaved={handleFormSaved}
      onClose={() => setFormModalVisible(false)}
    />
  </View>
)}
      </View>
    </View>
  );
}

function BuildingInformation({
  building, story, forms, floor, floors,
  selectedLayer, onLayerSelect, onFloorSelect,
  loading, onFloorImageClick, onOpenForm,
}: {
  building: BuildingInfo | null;
  story: StoryInfo | null;
  floor: FloorInfo | null;
  floors: FloorInfo[];
  selectedLayer: LayerInfo | null;
  onLayerSelect: (layer: LayerInfo | null) => void;
  onFloorSelect: (floor: FloorInfo) => void;
  loading: boolean;
  onFloorImageClick: (floor: FloorInfo) => void;
  forms: any[];
  onOpenForm: (id: number) => void;
}) {
  if (loading) {
    return (
      <View style={styles.infoContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  if (!building && !story) {
    return (
      <View style={styles.infoContainer}>
        <Text style={styles.messageText}>اطلاعاتی برای نمایش وجود ندارد</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.infoContainer} showsVerticalScrollIndicator={false}>
      {story && (
        <View style={styles.buildingInfo}>
          <View style={styles.buildingHeader}>
            <View>
              <Text style={styles.buildingLabel}>ساختمان انتخاب‌شده</Text>
              <Text style={styles.buildingName}>{story.projectName}</Text>
              <Text style={styles.buildingCode}>کد نوسازی: {story.renovationCode}</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statText}>ارتفاع: {Math.round(story.height)} متر</Text>
            </View>
          </View>
        </View>
      )}

      {forms && forms.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8, color: '#111827' }}>
            فرم‌های ساختمان
          </Text>
          {forms.map((form) => (
            <TouchableOpacity
              key={form.id}
              style={styles.formItem}
              onPress={() => onOpenForm(form.id)}
            >
              {form.formType === 'PIP'
                ? <MdAssignment size={18} color="#0C4A6E" />
                : <MdChecklist size={18} color="#166534" />
              }
              <Text style={styles.formItemText}>{form.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {floors.length > 0 && (
        <View style={styles.floorButtonsSection}>
          <View style={styles.floorButtonsHeader}>
            <Text style={styles.floorButtonsTitle}>نمای طبقه</Text>
            {floors.length > 3 && (
              <Text style={styles.floorScrollHint}>← کشیدن برای مشاهده بیشتر</Text>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.floorButtonsContent}
          >
            {floors.map((floorItem) => (
              <TouchableOpacity
                key={floorItem.id}
                style={[styles.floorButton, floor?.id === floorItem.id && styles.floorButtonActive]}
                onPress={() => onFloorSelect(floorItem)}
              >
                <Text style={[styles.floorButtonText, floor?.id === floorItem.id && styles.floorButtonTextActive]}>
                  {floorItem.isSite ? 'سایت'
                    : floorItem.isHalf ? `نیم‌طبقه ${floorItem.number}`
                    : floorItem.number === 0 ? 'همکف'
                    : `طبقه ${floorItem.number}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {floor && (
        <View style={styles.floorDetails}>
          <Text style={styles.floorTitle}>
            {floor.isSite ? 'سایت'
              : floor.isHalf ? `نیم‌طبقه ${floor.number}`
              : floor.number === 0 ? 'همکف'
              : `طبقه ${floor.number}`}
            {' • '}
            {FLOOR_APPLICATION_FA[floor.application] || floor.application}
          </Text>
          <View style={styles.floorPlanContainer}>
            <TouchableOpacity
              style={styles.floorPlanImageContainer}
              onPress={() => onFloorImageClick(floor)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: floor.plotUrl }} style={styles.floorPlanImage} resizeMode="contain" />
              {(floor.layers || []).map((layer) => (
                <TouchableOpacity
                  key={layer.id}
                  style={[styles.layerMarker, { left: `${layer.posX * 100}%`, top: `${layer.posY * 100}%` }]}
                  onPress={(e) => { e.stopPropagation(); onLayerSelect(layer); }}
                >
                  <Image
                    source={LAYER_ICON_SRC[layer.type as keyof typeof LAYER_ICON_SRC] || LAYER_ICON_SRC.NOTE}
                    style={styles.layerIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
              <View style={styles.imageZoomHint}>
                <MdZoomIn size={20} color="#fff" />
                <Text style={styles.imageZoomText}>کلیک برای مدیریت لایه‌ها</Text>
              </View>
            </TouchableOpacity>
            {selectedLayer && (
              <View style={styles.layerDetails}>
                <View style={styles.layerDetailsHeader}>
                  <Text style={styles.layerTitle}>
                    {LAYER_FA[selectedLayer.type as keyof typeof LAYER_FA] || selectedLayer.type}
                  </Text>
                  <TouchableOpacity onPress={() => onLayerSelect(null)} style={styles.layerDetailsClose}>
                    <MdClose size={18} color="#666" />
                  </TouchableOpacity>
                </View>
                {selectedLayer.note && <Text style={styles.layerNote}>{selectedLayer.note}</Text>}
                {selectedLayer.pictureUrl && (
                  <Image source={{ uri: selectedLayer.pictureUrl }} style={styles.layerImage} resizeMode="contain" />
                )}
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  leftPane: {
    width: 380,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  leftPaneHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    position: 'relative',
  },
  searchInPane: { width: '100%' },

  rightPane: { flex: 1, position: 'relative' },
  searchOverlay: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 300 },

  backBtn: {
    position: 'absolute', top: 16, left: 12, zIndex: 10,
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute', top: 16, left: 12, zIndex: 10,
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },

  item: {
    padding: 12, borderRadius: 16, backgroundColor: '#ffffff',
    marginBottom: 10, borderWidth: 1, borderColor: '#eef2f7',
  },
  itemTitle: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  itemSub: { color: '#64748b', marginTop: 6 },

  formItem: {
    padding: 12, borderRadius: 10, backgroundColor: '#F3F4F6',
    marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  formItemText: { color: '#111827', fontSize: 14, flex: 1 },

  formModalWrapper: { flex: 1, backgroundColor: '#f8fafc' },
  formModalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  formModalCloseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#f3f4f6', borderRadius: 8,
  },
  formModalCloseTxt: { color: '#374151', fontSize: 14 },

  infoContainer: { flex: 1, padding: 16 },
  buildingInfo: {
    backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6',
  },
  buildingHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  buildingLabel: { fontSize: 12, color: '#6B7280' },
  buildingName: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 2 },
  buildingCode: { fontSize: 12, color: '#374151', marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  statText: { fontSize: 12, color: '#374151', textAlign: 'center' },

  floorButtonsSection: { marginBottom: 16 },
  floorButtonsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  floorButtonsTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  floorScrollHint: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic' },
  floorButtonsContent: { paddingRight: 8 },
  floorButton: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8, backgroundColor: '#FFFFFF',
  },
  floorButtonActive: { borderColor: '#0284C7', backgroundColor: '#EFF6FF' },
  floorButtonText: { fontSize: 12, color: '#374151' },
  floorButtonTextActive: { color: '#0C4A6E', fontWeight: '500' },

  floorDetails: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  floorTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 12 },
  floorPlanContainer: { marginTop: 8 },
  floorPlanImageContainer: {
    position: 'relative', backgroundColor: '#F9FAFB',
    borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  floorPlanImage: { width: '100%', height: 250 },
  layerMarker: {
    position: 'absolute', width: 24, height: 24,
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  layerIcon: { width: 24, height: 24 },
  imageZoomHint: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  imageZoomText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  layerDetails: {
    marginTop: 12, backgroundColor: '#EFF6FF', borderRadius: 8,
    borderWidth: 1, borderColor: '#DBEAFE', padding: 12,
  },
  layerDetailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  layerDetailsClose: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  layerTitle: { fontSize: 14, fontWeight: '600', color: '#0C4A6E', marginBottom: 4 },
  layerNote: { fontSize: 12, color: '#374151', marginTop: 4 },
  layerImage: {
    width: '100%', height: 150, marginTop: 8,
    borderRadius: 4, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
  },
  messageText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
