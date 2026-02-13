import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { MdSearch, MdClose } from "react-icons/md";

type Props = {
  query: string;
  onQueryChanged: (q: string) => void;
  placeholder?: string;
  enabled?: boolean;
  singleLine?: boolean;
};

export default function SearchBox({
  query,
  onQueryChanged,
  placeholder = "جست و جو",
  enabled = true,
  singleLine = true,
}: Props) {
  return (
    <View style={styles.wrap}>
      <MdSearch size={20} color="#8b93a7" style={styles.leadingIcon} />

      <TextInput
        value={query}
        onChangeText={onQueryChanged}
        placeholder={placeholder}
        placeholderTextColor="#8b93a7"
        editable={enabled}
        style={styles.input}
        returnKeyType="search"
      />

      {query.length > 0 && (
        <TouchableOpacity onPress={() => onQueryChanged("")}>
          <MdClose size={20} color="#8b93a7" style={styles.trailingIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",   
    borderRadius: 30,           
    paddingHorizontal: 16,
    marginVertical: 10,
    height: 48,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
    textAlign: "right",
    writingDirection: "rtl",
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    outlineStyle: "none",
    marginHorizontal: 10,
  },

  leadingIcon: {
    marginLeft: 4,
  },

  trailingIcon: {
    marginRight: 4,
  },
});
