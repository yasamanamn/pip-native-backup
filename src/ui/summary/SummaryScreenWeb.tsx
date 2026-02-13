import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SummaryRoute } from './SummaryScreen';

/**
 * Summary Screen Web Wrapper
 * Integrates the refactored Summary feature with React Router
 */
export default function SummaryScreenWeb() {
  const { buildingId } = useParams<{ buildingId: string }>();
  const navigate = useNavigate();

  // Validate buildingId
  if (!buildingId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>خطا: شناسه ساختمان یافت نشد</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigate('/')}>
          <Icon name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>بازگشت</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleFloorPlanDetailClick = (floorId: number, layerId?: number | null) => {
    console.log('Floor plan clicked:', { floorId, layerId });
    // Navigate to floor plan detail screen
    // navigate(`/floor-plan/${floorId}${layerId ? `?layer=${layerId}` : ''}`);
    
    // For now, you can implement this navigation or show a modal
    alert(`نمایش جزئیات پلان طبقه ${floorId}${layerId ? ` - لایه ${layerId}` : ''}`);
  };

  const handleBuildingLogClick = (buildingLogId: number) => {
    console.log('Building log clicked:', buildingLogId);
    // Navigate to building log screen
    // navigate(`/building-log/${buildingLogId}`);
    
    // For now, show alert
    alert(`نمایش لاگ ساختمان ${buildingLogId}`);
  };

  const handleResponseClick = (formId: number, renovationCode?: string | null) => {
    console.log('Form response clicked:', { formId, renovationCode });
    // Navigate to form response screen
    // navigate(`/form-response/${formId}${renovationCode ? `?code=${renovationCode}` : ''}`);
    
    // For now, show alert
    alert(`نمایش فرم ${formId}${renovationCode ? ` - کد: ${renovationCode}` : ''}`);
  };

  const handleBackPress = () => {
    navigate('/');
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={handleBackPress}>
          <Icon name="arrow-back" size={24} color="#fff" />
          <Text style={styles.headerTitle}>بازگشت به نقشه</Text>
        </TouchableOpacity>
        <Text style={styles.headerSubtitle}>کد نوسازی: {buildingId}</Text>
      </View>

      {/* Summary Content */}
      <View style={styles.content}>
        <SummaryRoute
          buildingId={buildingId}
          onFloorPlanDetailClick={handleFloorPlanDetailClick}
          onBuildingLogClick={handleBuildingLogClick}
          onResponseClick={handleResponseClick}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
      height: '100vh',
    }),
  },
  header: {
    backgroundColor: '#0b1020',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1b2340',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#b7bfd3',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b1020',
    padding: 20,
  },
  errorText: {
    color: '#FF3F33',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c2440',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
