import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface FirstPaneProps {
  uiState: SummaryUiState;
  onEvent: (event: SummaryUiEvent) => void;
}

interface SummaryUiState {
  sitePlans: any[];
  floorPlans: any[];
  images: any[];
  forms: any[];
  selectedCategory: SummaryCategory | null;
}

enum SummaryCategory {
  SITE_PLANS = 'SITE_PLANS',
  FLOOR_PLANS = 'FLOOR_PLANS',
  IMAGES = 'IMAGES',
  RESPONSES = 'RESPONSES',
}

interface SummaryUiEvent {
  type: 'SELECT_CATEGORY';
  category: SummaryCategory;
}

interface CategoryRowProps {
  title: string;
  isSelected?: boolean;
  onClick: () => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  title,
  isSelected = false,
  onClick,
}) => {
  return (
    <>
      <TouchableOpacity
        style={[
          styles.categoryRow,
          isSelected && styles.categoryRowSelected,
        ]}
        onPress={onClick}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.categoryText,
            isSelected && styles.categoryTextSelected,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
      <View style={styles.divider} />
    </>
  );
};

export const FirstPane: React.FC<FirstPaneProps> = ({ uiState, onEvent }) => {
  const handleSelectCategory = (category: SummaryCategory) => {
    onEvent({ type: 'SELECT_CATEGORY', category });
  };

  return (
    <View style={styles.container}>
      <View style={styles.surface}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {uiState.sitePlans.length > 0 && (
            <CategoryRow
              title="سایت پلان"
              isSelected={uiState.selectedCategory === SummaryCategory.SITE_PLANS}
              onClick={() => handleSelectCategory(SummaryCategory.SITE_PLANS)}
            />
          )}

          {uiState.floorPlans.length > 0 && (
            <CategoryRow
              title="پلان طبقات"
              isSelected={uiState.selectedCategory === SummaryCategory.FLOOR_PLANS}
              onClick={() => handleSelectCategory(SummaryCategory.FLOOR_PLANS)}
            />
          )}

          {uiState.images.length > 0 && (
            <CategoryRow
              title="تصاویر"
              isSelected={uiState.selectedCategory === SummaryCategory.IMAGES}
              onClick={() => handleSelectCategory(SummaryCategory.IMAGES)}
            />
          )}

          {uiState.forms.length > 0 && (
            <CategoryRow
              title="گزارشات/مستندات"
              isSelected={uiState.selectedCategory === SummaryCategory.RESPONSES}
              onClick={() => handleSelectCategory(SummaryCategory.RESPONSES)}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 200,
  },
  surface: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    borderTopLeftRadius: 20,
    overflow: 'hidden',
  },
  categoryRow: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRowSelected: {
    backgroundColor: '#E3F2FD',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  categoryTextSelected: {
    color: '#1976D2',
  },
  divider: {
    height: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
});

export { SummaryCategory };
export type { SummaryUiState, SummaryUiEvent };
