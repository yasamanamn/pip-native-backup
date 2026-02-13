import { api } from '../config/api.config';

export const getFloorDetail = async (floorId: string) => {
  const res = await api.get(`/floors/${floorId}`);
  return res.data;
};

export const getLayersByFloor = async (floorId: string) => {
  const res = await api.get(`/floors/${floorId}/layers`);
  return res.data;
};
