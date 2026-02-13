import axios from "axios";

const api = axios.create({
  baseURL: "https://pip.smart-dev.ir",
  timeout: 10000,
});

export const getAllBuildingsSummary = async () => {
  const res = await api.get('/buildings/summary');
  if (res.data?.success) return res.data.data;
  return [];
};

export const getBuildingSummary = async (renovationCode: string) => {
  const res = await api.get(`/buildings/${renovationCode}/summary`);
  if (res.data?.success) return res.data.data;
  return {};
};
