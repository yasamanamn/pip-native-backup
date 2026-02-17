import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { MdSearch, MdClose } from 'react-icons/md';

type SearchBoxVariant = 'overlay' | 'inline';

type Props = {
  query: string;
  onQueryChanged: (q: string) => void;
  placeholder?: string;
  enabled?: boolean;
  singleLine?: boolean;
  onFocus?: () => void;
  autoFocus?: boolean;
  variant?: SearchBoxVariant;
};

export default function SearchBox({
  query,
  onQueryChanged,
  placeholder = "...جست و جو",
  enabled = true,
  singleLine = true,
  onFocus,
  autoFocus = false,
  variant = 'overlay',
}: Props) {
  const isOverlay = variant === 'overlay';
  
  return (
    <View style={[
      styles.wrap,
      isOverlay ? styles.wrapOverlay : styles.wrapInline
    ]}>
      <MdSearch 
        size={isOverlay ? 18 : 18} 
        color={isOverlay ? "#9ca3af" : "#64748b"} 
        style={styles.icon} 
      />
      
      <TextInput
        value={query}
        onChangeText={onQueryChanged}
        placeholder={placeholder}
        placeholderTextColor={isOverlay ? "#8b93a7" : "#94a3b8"}
        editable={enabled}
        style={[
          styles.input,
          isOverlay ? styles.inputOverlay : styles.inputInline
        ]}
        returnKeyType="search"
        onFocus={onFocus}
        autoFocus={autoFocus}
      />

      {query.length > 0 && (
        <TouchableOpacity 
          onPress={() => onQueryChanged("")} 
          style={styles.clearButton}
        >
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
  },
  
  wrapOverlay: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  
  wrapInline: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  
  icon: {
    marginRight: 8,
    flexShrink: 0, 
  },
  
  input: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
    marginVertical: 0,
    outlineStyle: "none",
    paddingVertical: 0,
    minWidth: 0, 
  },
  
  inputOverlay: {
    color: "#0f172a",
  },
  
  inputInline: {
    color: "#1e293b",
  },
  
  clearButton: {
    marginLeft: 4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    flexShrink: 0, 
  },
});
