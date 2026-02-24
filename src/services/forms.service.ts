import { api } from '../config/api.config';

export interface FormResponse {
  success: boolean;
  data: any;
  message?: string;
}

export const getBuildingForms = async (renovationCode: string): Promise<FormResponse> => {
  try {
    const response = await api.get(`/forms/building/${renovationCode}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching building forms:', error);
    throw error;
  }
};

export const getFormById = async (formId: number): Promise<FormResponse> => {
  try {
    const response = await api.get(`/forms/${formId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching form:', error);
    throw error;
  }
};

export const submitFormResponses = async (
  formId: number,
  data: { renovationCode: string; answers: any[] }
): Promise<FormResponse> => {
  try {
    const response = await api.put(`/forms/${formId}/responses`, data);
    return response.data;
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error;
  }
};

export const uploadFile = async (
  file: any,
  questionId: number
): Promise<{ success: boolean; url: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('questionId', questionId.toString());

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};