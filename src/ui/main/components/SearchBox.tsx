import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { MdSearch } from 'react-icons/md';

type Props = {
  query: string;
  onQueryChanged: (q: string) => void;
  placeholder?: string;
  enabled?: boolean;
  singleLine?: boolean;
  onFocus?: () => void;
  autoFocus?: boolean;
};

export default function SearchBox({
  query,
  onQueryChanged,
  placeholder = "...جست و جو",
  enabled = true,
  singleLine = true,
  onFocus,
  autoFocus = false,
}: Props) {
  return (
    <View style={styles.wrap}>
      <MdSearch size={20} color="#9ca3af" style={styles.icon} />
      
      <TextInput
        value={query}
        onChangeText={onQueryChanged}
        placeholder={placeholder}
        placeholderTextColor="#8b93a7"
        editable={enabled}
        style={styles.input}
        returnKeyType="search"
        onFocus={onFocus}
        autoFocus={autoFocus}
      />

      {query.length > 0 && (
        <TouchableOpacity onPress={() => onQueryChanged("")} style={styles.clearButton}>
          ✕
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 48,
    elevation: 3,
    width: 300,
  },
  icon: {
    marginLeft: 10, 
  },
  input: {
    flex: 1,
    color: "#0f172a",
    fontSize: 15,
    textAlign: "right",
    marginVertical: 0,
    marginBottom: 5, 
    outlineStyle: "none",
  },
  clearButton: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
});

