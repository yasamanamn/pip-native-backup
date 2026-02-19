import { api } from '../config/api.config';

export const uploadPicture = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await api.post('/uploads/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data; 
  } catch (err) {
    console.error('Upload API Error:', err);
    throw err;
  }
};
