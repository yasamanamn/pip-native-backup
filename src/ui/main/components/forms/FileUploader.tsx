import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { uploadFile } from '../../../../services/uploads.api';

interface FileUploaderProps {
  questionId: number;
  type: 'PICTURE' | 'FILE';
  onUploadComplete: (url: string) => void;
  existingUrl?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  questionId,
  type,
  onUploadComplete,
  existingUrl
}) => {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(existingUrl || '');
  const [error, setError] = useState('');

  const handleFileSelect = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'PICTURE' ? 'image/*' : '*/*';
      
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          await handleUpload(file);
        }
      };
      
      input.click();
    } else {
      alert('آپلود در موبایل نیاز به نصب react-native-image-picker دارد');
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError('');
    
    try {
      const response = await uploadFile(file, questionId);
      
      if (response?.url) {
        setFileUrl(response.url);
        onUploadComplete(response.url);
      } else {
        throw new Error('آپلود ناموفق بود');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFileUrl('');
    onUploadComplete('');
  };

  return (
    <View style={styles.container}>
      {fileUrl ? (
        <View style={styles.previewContainer}>
          {type === 'PICTURE' ? (
            <Image source={{ uri: fileUrl }} style={styles.imagePreview} />
          ) : (
            <View style={styles.filePreview}>
              <Text style={styles.fileIcon}>📎</Text>
              <Text style={styles.fileName}>فایل آپلود شده</Text>
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.changeButton]} 
              onPress={handleFileSelect}
              disabled={uploading}
            >
              <Text style={styles.changeButtonText}>تغییر</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.removeButton]} 
              onPress={handleRemove}
              disabled={uploading}
            >
              <Text style={styles.removeButtonText}>حذف</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={handleFileSelect}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="large" color="#d95d39" />
          ) : (
            <>
              <Text style={styles.uploadIcon}>{type === 'PICTURE' ? '📷' : '📎'}</Text>
              <Text style={styles.uploadText}>
                {type === 'PICTURE' ? 'انتخاب تصویر' : 'انتخاب فایل'}
              </Text>
              <Text style={styles.uploadHint}>
                {type === 'PICTURE' ? 'jpg, png, gif' : 'pdf, doc, xls, ...'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fafafa',
    minHeight: 120,
    justifyContent: 'center',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  filePreview: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  fileIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  changeButton: {
    backgroundColor: '#f5f5f5',
  },
  changeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#fee2e2',
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});