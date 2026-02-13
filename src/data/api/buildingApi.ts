import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../../config/api.config';
import { ApiBuilding, ApiBuildingSummaryInfo } from '../../types/building';

/** کلاینت API صفحهٔ Main — آدرس از src/config/api.config.ts */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

export async function fetchAllBuildings(): Promise<ApiBuildingSummaryInfo[]> {
  const res = await api.get('/buildings');
  return res.data;
}

export async function fetchBuildingByIdFromApi(buildingId: string): Promise<ApiBuilding> {
  const res = await api.get(`/buildings/${buildingId}`);
  return res.data;
}
