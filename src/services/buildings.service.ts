import { api } from '../config/api.config';

export const getBuildings = async () => {
  try {
    const res = await api.get('/buildings');
    return res.data; 
  } catch (err) {
    console.log('API Error:', err);
    throw err; 
  }
};

export const getBuildingByCode = async (renovationCode: string) => {
  try {
    const res = await api.get(`/buildings/${renovationCode}`);
    return res.data;
  } catch (err) {
    console.log('API Error:', err);
    throw err;
  }
};

export const updateBuilding = async (renovationCode: string, data: any) => {
  try {
    const res = await api.put(`/buildings/${renovationCode}`, data);
    return res.data;
  } catch (err) {
    console.log('API Error:', err);
    throw err;
  }
};
