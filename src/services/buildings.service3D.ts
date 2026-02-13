import { api } from '../config/api.config';
import { BuildingInfo } from './types';

export const getBuildings3D = async () => {
  const res = await api.get('/buildings/3d_new');
  return res.data; 
};

export const getBuildingByCode = async (
  renovationCode: string
): Promise<BuildingInfo | null> => {
  try {
    const res = await api.get(
      `/buildings/${encodeURIComponent(renovationCode)}`
    );

    return res.data.data ?? null;
  } catch (err: any) {
    if (err.response?.status === 401) throw new Error('Unauthorized');
    if (err.response?.status === 403) throw new Error('Permission denied');
    throw new Error('Fetch error');
  }
};
