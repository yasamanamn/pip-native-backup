import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SummaryRoute } from './SummaryScreen';
import { useSummaryViewModel } from './useSummaryViewModel';

/**
 * Example 1: Basic usage with navigation
 */
export const Example1_BasicUsage: React.FC<{ buildingId: string; navigation: any }> = ({
  buildingId,
  navigation,
}) => {
  return (
    <SummaryRoute
      buildingId={buildingId}
      onFloorPlanDetailClick={(floorId, layerId) => {
        navigation.navigate('FloorPlanDetail', { floorId, layerId });
      }}
      onBuildingLogClick={buildingId => {
        navigation.navigate('BuildingLog', { buildingId });
      }}
      onResponseClick={(formId, renovationCode) => {
        navigation.navigate('FormResponse', { formId, renovationCode });
      }}
    />
  );
};

/**
 * Example 2: With pull-to-refresh
 */
export const Example2_WithRefresh: React.FC<{ buildingId: string }> = ({ buildingId }) => {
  const { uiState, onEvent, refresh } = useSummaryViewModel(buildingId);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {uiState.isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading building data...</Text>
        </View>
      ) : (
        <SummaryRoute
          buildingId={buildingId}
          onFloorPlanDetailClick={(floorId, layerId) => {
            console.log('Floor plan:', floorId, layerId);
          }}
          onBuildingLogClick={buildingId => {
            console.log('Building log:', buildingId);
          }}
          onResponseClick={(formId, renovationCode) => {
            console.log('Response:', formId, renovationCode);
          }}
        />
      )}
    </ScrollView>
  );
};

/**
 * Example 3: With error handling and retry
 */
export const Example3_WithErrorHandling: React.FC<{ buildingId: string }> = ({ buildingId }) => {
  const { uiState, onEvent, refresh } = useSummaryViewModel(buildingId);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Check if data failed to load
    if (!uiState.isLoading && !uiState.building && !uiState.forms.length) {
      setError('Failed to load building data. Please try again.');
    } else {
      setError(null);
    }
  }, [uiState]);

  const handleRetry = async () => {
    setError(null);
    await refresh();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SummaryRoute
      buildingId={buildingId}
      onFloorPlanDetailClick={(floorId, layerId) => {
        console.log('Floor plan:', floorId, layerId);
      }}
      onBuildingLogClick={buildingId => {
        console.log('Building log:', buildingId);
      }}
      onResponseClick={(formId, renovationCode) => {
        console.log('Response:', formId, renovationCode);
      }}
    />
  );
};

/**
 * Example 4: With cache management
 */
export const Example4_WithCacheManagement: React.FC<{ buildingId: string }> = ({ buildingId }) => {
  const { uiState, onEvent, refresh, clearCache } = useSummaryViewModel(buildingId);
  const [showCacheControls, setShowCacheControls] = React.useState(false);

  const handleClearCache = async () => {
    await clearCache();
    await refresh();
    setShowCacheControls(false);
  };

  return (
    <View style={styles.container}>
      {/* Cache Controls */}
      <View style={styles.cacheControls}>
        <TouchableOpacity onPress={() => setShowCacheControls(!showCacheControls)}>
          <Text style={styles.cacheToggle}>⚙️ Cache Settings</Text>
        </TouchableOpacity>

        {showCacheControls && (
          <View style={styles.cacheButtonsContainer}>
            <TouchableOpacity style={styles.cacheButton} onPress={refresh}>
              <Text style={styles.cacheButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cacheButton} onPress={handleClearCache}>
              <Text style={styles.cacheButtonText}>🗑️ Clear Cache</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content */}
      <SummaryRoute
        buildingId={buildingId}
        onFloorPlanDetailClick={(floorId, layerId) => {
          console.log('Floor plan:', floorId, layerId);
        }}
        onBuildingLogClick={buildingId => {
          console.log('Building log:', buildingId);
        }}
        onResponseClick={(formId, renovationCode) => {
          console.log('Response:', formId, renovationCode);
        }}
      />
    </View>
  );
};

/**
 * Example 5: With loading skeleton
 */
export const Example5_WithSkeleton: React.FC<{ buildingId: string }> = ({ buildingId }) => {
  const { uiState, onEvent } = useSummaryViewModel(buildingId);

  if (uiState.isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        <View style={styles.skeletonSidebar} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonItem} />
          <View style={styles.skeletonItem} />
          <View style={styles.skeletonItem} />
        </View>
      </View>
    );
  }

  return (
    <SummaryRoute
      buildingId={buildingId}
      onFloorPlanDetailClick={(floorId, layerId) => {
        console.log('Floor plan:', floorId, layerId);
      }}
      onBuildingLogClick={buildingId => {
        console.log('Building log:', buildingId);
      }}
      onResponseClick={(formId, renovationCode) => {
        console.log('Response:', formId, renovationCode);
      }}
    />
  );
};

/**
 * Example 6: With statistics display
 */
export const Example6_WithStats: React.FC<{ buildingId: string }> = ({ buildingId }) => {
  const { uiState } = useSummaryViewModel(buildingId);

  return (
    <View style={styles.container}>
      {/* Statistics Header */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{uiState.sitePlans.length}</Text>
          <Text style={styles.statLabel}>Site Plans</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{uiState.floorPlans.length}</Text>
          <Text style={styles.statLabel}>Floor Plans</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{uiState.images.length}</Text>
          <Text style={styles.statLabel}>Images</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{uiState.forms.length}</Text>
          <Text style={styles.statLabel}>Forms</Text>
        </View>
      </View>

      {/* Main Content */}
      <SummaryRoute
        buildingId={buildingId}
        onFloorPlanDetailClick={(floorId, layerId) => {
          console.log('Floor plan:', floorId, layerId);
        }}
        onBuildingLogClick={buildingId => {
          console.log('Building log:', buildingId);
        }}
        onResponseClick={(formId, renovationCode) => {
          console.log('Response:', formId, renovationCode);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cacheControls: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cacheToggle: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  cacheButtonsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  cacheButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cacheButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  skeletonContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  skeletonSidebar: {
    width: 200,
    backgroundColor: '#E0E0E0',
  },
  skeletonContent: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  skeletonItem: {
    height: 100,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
