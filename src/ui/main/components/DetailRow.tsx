import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  isHeader?: boolean;
};

export default function DetailRow({ label, value, isHeader }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, isHeader && styles.header]}>{label}</Text>
      <Text style={[styles.value, isHeader && styles.header]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff', 
    borderWidth: 1,
    borderColor: '#d1d1d1', 
  },
  label: { color: '#555555', fontSize: 12, marginBottom: 6 },
  value: { color: '#111111', fontSize: 14 }, 
  header: { fontSize: 16, fontWeight: '700', color: '#000000' }, 
});
