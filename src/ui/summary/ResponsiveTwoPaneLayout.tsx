import React from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
  Platform,
} from 'react-native';

interface ResponsiveTwoPaneLayoutProps {
  firstPane: () => React.ReactElement;
  secondPane: () => React.ReactElement;
  isBox?: boolean;
  style?: ViewStyle;
  breakpoint?: number; // Width at which to switch from single to dual pane
}

/**
 * Responsive two-pane layout component
 * Shows both panes side-by-side on larger screens
 * Shows only second pane on smaller screens (first pane can be in a drawer/modal)
 */
export const ResponsiveTwoPaneLayout: React.FC<ResponsiveTwoPaneLayoutProps> = ({
  firstPane,
  secondPane,
  isBox = false,
  style,
  breakpoint = 768, // Default tablet breakpoint
}) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= breakpoint;

  // For web, always show both panes side by side if screen is large enough
  if (Platform.OS === 'web' && isLargeScreen) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.firstPaneContainer}>
          {firstPane()}
        </View>
        <View style={styles.secondPaneContainer}>
          {secondPane()}
        </View>
      </View>
    );
  }

  // For mobile or small screens, show only second pane
  // First pane should be shown in a drawer/modal (implement separately)
  return (
    <View style={[styles.container, style]}>
      {isLargeScreen && (
        <View style={styles.firstPaneContainer}>
          {firstPane()}
        </View>
      )}
      <View style={[styles.secondPaneContainer, !isLargeScreen && styles.fullWidth]}>
        {secondPane()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
  },
  firstPaneContainer: {
    width: 200,
    minWidth: 200,
    maxWidth: 250,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  secondPaneContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullWidth: {
    width: '100%',
  },
});
