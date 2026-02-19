import { api } from '../config/api.config';

export interface Layer {
  id?: string;
  type: string;
  posX: number;
  posY: number;
}

export interface LayerPayload {
  type: string;
  posX: number;
  posY: number;
}

export const addLayer = (floorId: string, layer: LayerPayload) => {
  return api.post(`/floors/${floorId}/layers`, layer);
};

export const updateLayer = (floorId: string, layerId: string, layer: LayerPayload) => {
  return api.patch(`/floors/${floorId}/layers/${layerId}`, layer);
};
