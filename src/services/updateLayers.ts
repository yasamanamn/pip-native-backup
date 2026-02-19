import { api } from '../config/api.config';

export const updateLayer = async (
  floorId: number,
  layerId: number,
  payload: {
    type?: string;
    posX?: number;
    posY?: number;
    note?: string;
    pictureUrl?: string | null;
  }
) => {
  try {
    const res = await api.patch(
      `/floors/${floorId}/layers/${layerId}`,
      payload
    );
    return res.data.data;
  } catch (err) {
    console.error('Update Layer API Error:', err);
    throw err;
  }
};
