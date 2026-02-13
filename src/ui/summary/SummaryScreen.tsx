import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Platform } from 'react-native';
import { FirstPane } from './FirstPane';
import { SecondPane } from './SecondPane';
import { useSummaryViewModel } from './useSummaryViewModel';
import { SummaryUiEvent } from './types.updated';
import { ResponsiveTwoPaneLayout } from './ResponsiveTwoPaneLayout';

interface SummaryRouteProps {
  buildingId: string;
  onFloorPlanDetailClick: (floorId: number, layerId?: number | null) => void;
  onBuildingLogClick: (buildingId: number) => void;
  onResponseClick: (formId: number, renovationCode?: string | null) => void;
}

export const SummaryRoute: React.FC<SummaryRouteProps> = ({
  buildingId,
  onFloorPlanDetailClick,
  onBuildingLogClick,
  onResponseClick,
}) => {
  const { uiState, onEvent } = useSummaryViewModel(buildingId);

  return (
    <SummaryScreenContent
      uiState={uiState}
      onFloorPlanDetailClick={onFloorPlanDetailClick}
      onBuildingLogClick={onBuildingLogClick}
      onResponseClick={onResponseClick}
      onEvent={onEvent}
    />
  );
};

interface SummaryScreenContentProps {
  uiState: any;
  onFloorPlanDetailClick: (floorId: number, layerId?: number | null) => void;
  onBuildingLogClick: (buildingId: number) => void;
  onResponseClick: (formId: number, renovationCode?: string | null) => void;
  onEvent: (event: SummaryUiEvent) => void;
}

const SummaryScreenContent: React.FC<SummaryScreenContentProps> = ({
  uiState,
  onFloorPlanDetailClick,
  onBuildingLogClick,
  onResponseClick,
  onEvent,
}) => {
  // Handle back press on Android to unselect category
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (uiState.selectedCategory !== null) {
        onEvent({ type: 'CLEAR_SELECTION' });
        return true; // Prevent default back behavior
      }
      return false; // Let default back behavior happen
    });

    return () => backHandler.remove();
  }, [uiState.selectedCategory, onEvent]);

  // Handle back button on web (browser back button)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handlePopState = () => {
      if (uiState.selectedCategory !== null) {
        onEvent({ type: 'CLEAR_SELECTION' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [uiState.selectedCategory, onEvent]);

  // Also handle Escape key on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && uiState.selectedCategory !== null) {
        onEvent({ type: 'CLEAR_SELECTION' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiState.selectedCategory, onEvent]);

  const renderFirstPane = useCallback(
    () => <FirstPane uiState={uiState} onEvent={onEvent} />,
    [uiState, onEvent]
  );

  const renderSecondPane = useCallback(
    () => (
      <SecondPane
        uiState={uiState}
        onFloorPlanDetailClick={onFloorPlanDetailClick}
        onResponseClick={onResponseClick}
      />
    ),
    [uiState, onFloorPlanDetailClick, onResponseClick]
  );

  return (
    <ResponsiveTwoPaneLayout
      style={styles.container}
      isBox={false}
      firstPane={renderFirstPane}
      secondPane={renderSecondPane}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export { SummaryScreenContent };
