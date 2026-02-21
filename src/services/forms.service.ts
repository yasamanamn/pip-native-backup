import { api } from '../config/api.config';

export type FormInfo = {
  id: number;
  title: string;
  code: string;
  description: string;
  formType: string; // PIP یا FIRECHECKLIST
  _count: {
    questions: number;
  };
};

export type BuildingFormsResponse = {
  success: boolean;
  data: FormInfo[];
  missingFormTypes: string[];
};

export const getBuildingForms = async (
  renovationCode: string
): Promise<BuildingFormsResponse> => {
  try {
    const res = await api.get(`/forms/building/${encodeURIComponent(renovationCode)}`);
    return res.data;
  } catch (err: any) {
    console.error('Error fetching building forms:', err);
    throw new Error('Fetch building forms failed');
  }
};

export const getFormById = async (formId: number) => {
  try {
    const res = await api.get(`/forms/${formId}`);
    return res.data;
  } catch (err: any) {
    console.error('Error fetching form details:', err);
    throw new Error('Fetch form details failed');
  }
};