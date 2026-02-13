import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigate } from 'react-router-dom'; 

import Map3DWeb from './components/leaflet/Map3DWeb.ReactNative';
import DetailRow from './components/DetailRow';
import SearchBox from './components/SearchBox';
import { ApiBuilding, ApiBuildingSummaryInfo } from '../../types/building';
import { useMainViewModel } from './MainViewModel';

export default function MainScreenWeb() {
  const { uiState, actions } = useMainViewModel();
  const [selectedBuildingCode, setSelectedBuildingCode] = useState<string | null>(null);
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState(false); 

  const navigate = useNavigate(); 
  useEffect(() => {
    actions.onScreenDisplayed();
  }, []);
  const handleQueryChanged = (q: string) => {
    actions.onQueryChanged(q);
    setIsLeftPaneOpen(q.length > 0);
  };
  const [mapTarget, setMapTarget] = useState<{
    latitude: number;
    longitude: number;
    renovationCode?: string;
  } | null>(null);
  

  const handleProjectClick = (b: ApiBuildingSummaryInfo) => {
    actions.onSelectProject(b);
    setIsLeftPaneOpen(true);
  
    if (b.latitude && b.longitude) {
      setMapTarget({
        latitude: b.latitude,
        longitude: b.longitude,
        renovationCode: b.renovationCode,
      });
    }
  };
  
  const handleProjectSelected = (renovationCode: string | null | undefined) => {
    if (!renovationCode) return;
    console.log('Selected building code:', renovationCode);

    navigate(`/summary/${renovationCode}`);
  };


  return (
    <View style={styles.root}>
      {/* Left Pane */}
      {isLeftPaneOpen && (
        <View style={styles.leftPane}>
          {uiState.selectedBuilding ? (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={actions.onBackClick}>
                <Icon name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>

              <Information building={uiState.selectedBuilding} loading={uiState.isLoadingApiBuilding} />
            </>
          ) : (
            <View style={{ flex: 1, padding: 8 }}>
              {uiState.filteredBuildings.length > 0 ? (
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
              ) : (
                <Text style={{ color: '#b7bfd3', marginTop: 20 }}>نتیجه‌ای یافت نشد</Text>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.rightPane}>
        <View style={styles.searchOverlay}>
          <SearchBox query={uiState.query} onQueryChanged={handleQueryChanged} />
        </View>
        <Map3DWeb flyToLocation={mapTarget} />
        </View>
    </View>
  );
}

function SearchSection({
  query,
  buildings,
  onQueryChanged,
  onProjectClick,
}: {
  query: string;
  buildings: ApiBuildingSummaryInfo[];
  onQueryChanged: (q: string) => void;
  onProjectClick: (b: ApiBuildingSummaryInfo) => void;
}) {
  return (
    <View style={{ flex: 1, padding: 8 }}>
      <SearchBox query={query} onQueryChanged={onQueryChanged} />
      {buildings.length > 0 && (
        <FlatList
          data={buildings}
          keyExtractor={(item, index) => item.renovationCode ?? String(index)}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => onProjectClick(item)}>
              <Text style={styles.itemTitle}>{item.projectName ?? 'پروژه نامشخص'}</Text>
              <Text style={styles.itemSub}>کد نوسازی: {item.renovationCode ?? 'نامشخص'}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function Information({ building, loading }: { building: ApiBuilding; loading: boolean }) {
  return (
    <View style={{ flex: 1, padding: 8, gap: 10 }}>
      <DetailRow label="نام پروژه:" value={building.projectName ?? 'نامشخص'} isHeader />
      <DetailRow label="کد نوسازی:" value={building.renovationCode ?? 'نامشخص'} />
      <DetailRow label="عرض جغرافیایی:" value={building.latitude != null ? building.latitude.toFixed(2) : 'نامشخص'} />
      <DetailRow label="طول جغرافیایی:" value={building.longitude != null ? building.longitude.toFixed(2) : 'نامشخص'} />
      <DetailRow label="ارتفاع:" value={building.height != null ? String(building.height) : 'نامشخص'} />
      <DetailRow label="عرض:" value={building.width != null ? String(building.width) : 'نامشخص'} />
      <DetailRow label="طول:" value={building.length != null ? String(building.length) : 'نامشخص'} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { minHeight: '100vh', flexDirection: 'row', backgroundColor: '#0b1020', height: '100vh' },
  leftPane: { width: 320, backgroundColor: '#0b1020', borderRightWidth: 1, borderRightColor: '#1b2340', paddingTop: 8, flexDirection: 'column' },
  rightPane: { flex: 1, minHeight: '100vh', position: 'relative' },
  searchOverlay: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'flex-end',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  item: { padding: 12, borderRadius: 16, backgroundColor: '#141a2d', marginBottom: 10 },
  itemTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  itemSub: { color: '#b7bfd3', marginTop: 6 },
  bigFab: { margin: 12, height: 44, borderRadius: 14, backgroundColor: '#FF3F33', alignItems: 'center', justifyContent: 'center' },
  bigFabTitle: { color: 'white', fontWeight: '700' },
  bigFabSub: { color: 'white', marginTop: 4, fontSize: 12 },
});

