import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SummaryCategory, SummaryUiState } from './FirstPane';

interface SecondPaneProps {
  uiState: SummaryUiState;
  onFloorPlanDetailClick: (floorId: number, layerId?: number | null) => void;
  onResponseClick: (formId: number, renovationCode?: string | null) => void;
}

interface Floor {
  id?: number;
  number?: number;
  plotThumbUrl?: string;
  isSite?: boolean;
  isHalf?: boolean;
}

interface Layer {
  id?: number;
  floorId?: number;
  pictureThumbUrl?: string;
  note?: string;
}

interface Form {
  id: number;
  formType: string;
}

const SELECTED_IMAGE_SIZE = 128;
const DEFAULT_IMAGE_SIZE = 64;

// Floor Section Component
const FloorSection: React.FC<{
  title: string;
  floors: Floor[];
  onClick: (floorId: number) => void;
}> = ({ title, floors, onClick }) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {floors.map((floor, index) => (
          <View key={index} style={styles.thumbnailContainer}>
            <TouchableOpacity
              onPress={() => floor.id && onClick(floor.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: floor.plotThumbUrl }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// Image Section Component
const ImageSection: React.FC<{
  title: string;
  layers: Layer[];
  onClick: (floorId: number, layerId?: number) => void;
}> = ({ title, layers, onClick }) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {layers.map((layer, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              if (layer.floorId && layer.id) {
                onClick(layer.floorId, layer.id);
              }
            }}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: layer.pictureThumbUrl }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Selected Category Content Component
const SelectedCategoryContent: React.FC<{
  title: string;
  floors: Floor[];
  onFloorClick: (floorId: number) => void;
}> = ({ title, floors, onFloorClick }) => {
  const getFloorText = (floor: Floor): string => {
    const number = floor.number === 0 ? 'همکف' : `${floor.number}`;

    if (floor.isSite) {
      return `سایت پلان ${floor.number}`;
    } else {
      const prefix = floor.isHalf ? 'نیم طبقه' : 'طبقه';
      return `${prefix} ${number}`;
    }
  };

  return (
    <ScrollView
      style={styles.selectedContent}
      contentContainerStyle={styles.selectedContentContainer}
    >
      <View style={styles.selectedHeader}>
        <Text style={styles.selectedHeaderText}>{title}</Text>
      </View>

      {floors.map((floor, index) => (
        <React.Fragment key={index}>
          <View style={styles.selectedItemContainer}>
            <Text style={styles.selectedItemTitle}>{getFloorText(floor)}</Text>
            <TouchableOpacity
              onPress={() => floor.id && onFloorClick(floor.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: floor.plotThumbUrl }}
                style={styles.selectedImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.itemDivider} />
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

// Selected Images Content Component
const SelectedImagesContent: React.FC<{
  floors: Floor[];
  title: string;
  layers: Layer[];
  onImageClick: (floorId: number, layerId?: number) => void;
}> = ({ floors, title, layers, onImageClick }) => {
  const getFloorText = (layer: Layer): string => {
    const floor = floors.find(f => f.id === layer.floorId);
    const number = floor?.number === 0 ? 'همکف' : `${floor?.number}`;

    if (floor?.isSite) {
      return `سایت پلان ${floor.number}`;
    } else {
      const prefix = floor?.isHalf ? 'نیم طبقه' : 'طبقه';
      return `${prefix} ${number}`;
    }
  };

  return (
    <ScrollView
      style={styles.selectedContent}
      contentContainerStyle={styles.selectedContentContainer}
    >
      <View style={styles.selectedHeader}>
        <Text style={styles.selectedHeaderText}>{title}</Text>
      </View>

      {layers.map((layer, index) => (
        <React.Fragment key={index}>
          <View style={styles.selectedImageItemContainer}>
            <Text style={styles.selectedItemTitle}>{getFloorText(layer)}</Text>
            <TouchableOpacity
              onPress={() => {
                if (layer.floorId && layer.id) {
                  onImageClick(layer.floorId, layer.id);
                }
              }}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: layer.pictureThumbUrl }}
                style={styles.selectedImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {layer.note && <Text style={styles.noteText}>{layer.note}</Text>}
          </View>
          <View style={styles.itemDivider} />
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

// Selected Forms Content Component
const SelectedFormsContent: React.FC<{
  title: string;
  forms: Form[];
  onFormClick: (form: Form) => void;
}> = ({ title, forms, onFormClick }) => {
  const getFormText = (formType: string): string => {
    switch (formType) {
      case 'PIP':
        return 'فرم PIP';
      case 'FIRECHECKLIST':
        return 'چک لیست آتش نشانی';
      default:
        return formType;
    }
  };

  return (
    <ScrollView
      style={styles.selectedContent}
      contentContainerStyle={styles.selectedContentContainer}
    >
      <View style={styles.selectedHeader}>
        <Text style={styles.selectedHeaderText}>{title}</Text>
      </View>

      {forms.map((form, index) => (
        <TouchableOpacity
          key={index}
          style={styles.formItem}
          onPress={() => onFormClick(form)}
          activeOpacity={0.7}
        >
          <Text style={styles.formItemText}>{getFormText(form.formType)}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Main SecondPane Component
export const SecondPane: React.FC<SecondPaneProps> = ({
  uiState,
  onFloorPlanDetailClick,
  onResponseClick,
}) => {
  const renderContent = () => {
    switch (uiState.selectedCategory) {
      case SummaryCategory.SITE_PLANS:
        return (
          <SelectedCategoryContent
            title="سایت پلان"
            floors={uiState.sitePlans}
            onFloorClick={floorId => onFloorPlanDetailClick(floorId, null)}
          />
        );

      case SummaryCategory.FLOOR_PLANS:
        return (
          <SelectedCategoryContent
            title="پلان طبقات"
            floors={uiState.floorPlans}
            onFloorClick={floorId => onFloorPlanDetailClick(floorId, null)}
          />
        );

      case SummaryCategory.IMAGES:
        return (
          <SelectedImagesContent
            title="تصاویر"
            floors={[...uiState.floorPlans, ...uiState.sitePlans]}
            layers={uiState.images}
            onImageClick={(floorId, layerId) =>
              onFloorPlanDetailClick(floorId, layerId)
            }
          />
        );

      case SummaryCategory.RESPONSES:
        return (
          <SelectedFormsContent
            title="گزارشات/مستندات"
            forms={uiState.forms}
            onFormClick={form =>
              onResponseClick(form.id, uiState.building?.renovationCode)
            }
          />
        );

      default:
        // Show all categories when nothing is selected
        return (
          <ScrollView
            style={styles.allCategoriesContainer}
            contentContainerStyle={styles.allCategoriesContent}
          >
            {uiState.sitePlans.length > 0 && (
              <FloorSection
                title="سایت پلان"
                floors={uiState.sitePlans}
                onClick={floorId => onFloorPlanDetailClick(floorId, null)}
              />
            )}

            {uiState.floorPlans.length > 0 && (
              <FloorSection
                title="پلان طبقات"
                floors={uiState.floorPlans}
                onClick={floorId => onFloorPlanDetailClick(floorId, null)}
              />
            )}

            {uiState.images.length > 0 && (
              <ImageSection
                title="تصاویر"
                layers={uiState.images}
                onClick={(floorId, layerId) =>
                  onFloorPlanDetailClick(floorId, layerId)
                }
              />
            )}
          </ScrollView>
        );
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Section styles
  sectionContainer: {
    width: '100%',
    marginBottom: 8,
  },
  sectionHeader: {
    width: '100%',
    backgroundColor: '#1976D2',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  horizontalScrollContent: {
    paddingVertical: 4,
    gap: 8,
  },
  thumbnailContainer: {
    padding: 4,
  },
  thumbnailImage: {
    height: DEFAULT_IMAGE_SIZE,
    width: DEFAULT_IMAGE_SIZE,
    borderRadius: 4,
  },
  // Selected content styles
  selectedContent: {
    flex: 1,
  },
  selectedContentContainer: {
    alignItems: 'center',
    padding: 8,
  },
  selectedHeader: {
    width: '100%',
    backgroundColor: '#1976D2',
    padding: 16,
  },
  selectedHeaderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedItemContainer: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  selectedImageItemContainer: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  selectedItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  selectedImage: {
    height: SELECTED_IMAGE_SIZE,
    maxWidth: 256,
    borderRadius: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  itemDivider: {
    width: '100%',
    maxWidth: 256,
    height: 1,
    backgroundColor: '#D3D3D3',
    marginVertical: 8,
  },
  // Form styles
  formItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  formItemText: {
    fontSize: 16,
    color: '#000000',
  },
  // All categories view
  allCategoriesContainer: {
    flex: 1,
  },
  allCategoriesContent: {
    gap: 8,
  },
});

export type { Floor, Layer, Form };
