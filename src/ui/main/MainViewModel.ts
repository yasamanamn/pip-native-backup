import { useEffect, useState } from "react";
import { fetchAllBuildings, fetchBuildingByIdFromApi } from "../../data/api/buildingApi";
import { ApiBuilding, ApiBuildingSummaryInfo } from "../../types/building";
import { SEARCH_DEBOUNCE_DELAY } from "./constants";
import { getBuildings, getBuildingByCode } from "../../services/buildings.service";

export function useMainViewModel() {
  const [query, setQuery] = useState("");
  const [allBuildings, setAllBuildings] = useState<ApiBuildingSummaryInfo[]>([]);
  const [filteredBuildings, setFilteredBuildings] = useState<ApiBuildingSummaryInfo[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<ApiBuilding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllBuildings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBuildings(); 

      const normalized =
        Array.isArray(data)
          ? data
          : (data as any)?.items ||
            (data as any)?.data ||
            [];

      setAllBuildings(normalized);
      setFilteredBuildings([]);
    } catch (e: any) {
      setError(e?.message || "خطا در بارگذاری ساختمان‌ها");
    } finally {
      setLoading(false);
    }
  };
  


  const loadBuildingByCode = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBuildingByIdFromApi(code);
      setSelectedBuilding(data);
    } catch (e: any) {
      setError(e?.message || "خطا در بارگذاری جزئیات ساختمان");
    } finally {
      setLoading(false);
    }
  };

  const filterBuildings = (q: string) => {
    if (!q.trim()) {
      setFilteredBuildings([]);
    } else {
      const filtered = allBuildings.filter(
        (b) =>
          b.projectName?.toLowerCase().includes(q.toLowerCase()) ||
          b.renovationCode?.toLowerCase().includes(q.toLowerCase())
      );
      setFilteredBuildings(filtered);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      filterBuildings(query);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => clearTimeout(handler);
  }, [query, allBuildings]);

  useEffect(() => {
    loadAllBuildings();
  }, []);

  const onSelectProject = (building: ApiBuildingSummaryInfo) => {
    setSelectedBuilding(building as ApiBuilding);
    if (building.renovationCode) loadBuildingByCode(building.renovationCode);
  };

  return {
    uiState: {
      query,
      selectedBuilding,
      allBuildings,
      filteredBuildings,
      isLoadingApiBuilding: loading,
      error,
    },
    actions: {
      onQueryChanged: setQuery,
      onSelectProject,
      onBackClick: () => setSelectedBuilding(null),
      onRetry: () => {
        setError(null);
        loadAllBuildings();
      },
      onScreenDisplayed: loadAllBuildings,
    },
  };
}
