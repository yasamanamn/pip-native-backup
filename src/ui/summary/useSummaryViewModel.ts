import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SummaryUiState,
  SummaryUiEvent,
  SummaryCategory,
  Floor,
  Layer,
  Form,
  Building,
  SummaryDetails,
  SummaryAggs,
} from './types.updated';
import { getBuildingSummary } from "../../services/buildings.service";

// Storage keys
const STORAGE_KEYS = {
  SUMMARY_CACHE: 'summary_cache_',
  SELECTED_CATEGORY: 'summary_selected_category_',
};

export const useSummaryViewModel = (renovationCode: string) => {
  const [uiState, setUiState] = useState<SummaryUiState>({
    isLoading: true,
    building: null,
    forms: [],
    sitePlans: [],
    floorPlans: [],
    images: [],
    selectedCategory: null,
    details: null,
    aggs: null,
  });

  // Load cache & fetch fresh data
  useEffect(() => {
    const init = async () => {
      await loadCachedData();
      await fetchData();
    };
    init();
  }, [renovationCode]);

  // Save selected category
  useEffect(() => {
    if (uiState.selectedCategory !== null) {
      saveSelectedCategory(uiState.selectedCategory);
    }
  }, [uiState.selectedCategory, renovationCode]);

  /** Load cached data */
  const loadCachedData = async () => {
    try {
      const [cachedSummary, cachedCategory] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SUMMARY_CACHE + renovationCode),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_CATEGORY + renovationCode),
      ]);

      if (cachedSummary) {
        const summary = JSON.parse(cachedSummary);
        setUiState(prev => ({
          ...prev,
          ...summary,
          isLoading: false,
        }));
      }

      if (cachedCategory) {
        const category = cachedCategory as SummaryCategory;
        setUiState(prev => ({ ...prev, selectedCategory: category }));
      }
    } catch (error) {
      console.error("Error loading cached summary:", error);
    }
  };

  /** Fetch summary from API */
  const fetchData = async () => {
    try {
      setUiState(prev => ({ ...prev, isLoading: true }));

      const data = await getBuildingSummary(renovationCode);

      const building: Building | null = data.building || null;
      const forms: Form[] = data.forms || [];
      const details: SummaryDetails = data.details || {};
      const aggs: SummaryAggs = data.aggs || {};

      const floors = building?.floors || [];
      const sitePlans = floors.filter(f => f.isSite === true);
      const floorPlans = floors.filter(f => f.isSite === false);
      const images = floors
        .flatMap(f => f.layers || [])
        .filter(l => l.pictureUrl && l.pictureThumbUrl);

      const newState = {
        building,
        forms,
        sitePlans,
        floorPlans,
        images,
        details,
        aggs,
        isLoading: false,
      };

      setUiState(prev => ({ ...prev, ...newState }));

      // Cache the summary
      await AsyncStorage.setItem(
        STORAGE_KEYS.SUMMARY_CACHE + renovationCode,
        JSON.stringify(newState)
      );

    } catch (error) {
      console.error("Error fetching summary data:", error);
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  };

  /** Save selected category */
  const saveSelectedCategory = async (category: SummaryCategory | null) => {
    try {
      if (category === null) {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_CATEGORY + renovationCode);
      } else {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SELECTED_CATEGORY + renovationCode,
          category.toString()
        );
      }
    } catch (error) {
      console.error('Error saving selected category:', error);
    }
  };

  /** Handle UI events */
  const onEvent = useCallback((event: SummaryUiEvent) => {
    switch (event.type) {
      case 'SELECT_CATEGORY':
        setUiState(prev => ({ ...prev, selectedCategory: event.category }));
        break;
      case 'CLEAR_SELECTION':
        setUiState(prev => ({ ...prev, selectedCategory: null }));
        saveSelectedCategory(null);
        break;
      default:
        break;
    }
  }, []);

  /** Refresh data */
  const refresh = useCallback(async () => {
    await fetchData();
  }, [renovationCode]);

  /** Clear cache */
  const clearCache = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SUMMARY_CACHE + renovationCode),
        AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_CATEGORY + renovationCode),
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [renovationCode]);

  return {
    uiState,
    onEvent,
    refresh,
    clearCache,
  };
};
