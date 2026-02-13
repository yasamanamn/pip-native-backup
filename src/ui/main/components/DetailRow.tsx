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
    backgroundColor: '#141a2d',
  },
  label: { color: '#b7bfd3', fontSize: 12, marginBottom: 6 },
  value: { color: 'white', fontSize: 14 },
  header: { fontSize: 16, fontWeight: '700' },
});
