/**
 * Disable Android native (CMake) autolinking for react-native-vector-icons.
 * The library has no native C++ code; autolinking expects a codegen jni folder that doesn't exist.
 * We register the Java package manually in MainApplication.kt.
 */
module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        android: null,
      },
    },
  },
};
