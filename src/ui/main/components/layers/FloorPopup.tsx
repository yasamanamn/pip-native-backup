import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface FloorInfo {
  [key: string]: any;
}

interface FloorPopupProps {
  visible: boolean;
  onClose: () => void;
  floor: FloorInfo | null;
}

const FloorPopup: React.FC<FloorPopupProps> = ({ visible, onClose, floor }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>اطلاعات طبقه</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={onClose}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {floor ? (
              <View>
                <Text style={styles.floorInfo}>اطلاعات طبقه نمایش داده می‌شود</Text>
                <Text style={styles.floorDetail}>{JSON.stringify(floor, null, 2)}</Text>
              </View>
            ) : (
              <Text style={styles.noFloorInfo}>اطلاعاتی برای نمایش وجود ندارد</Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
 
  floorInfo: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  floorDetail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  noFloorInfo: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default FloorPopup;
