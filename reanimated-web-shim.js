// reanimated-web-shim.js
export const useSharedValue = (initial) => [initial, () => {}];
export const useAnimatedStyle = (fn) => ({});
export const withTiming = (value, config) => value;
export const withSpring = (value, config) => value;
export const withDelay = (delay, value) => value;
export const Easing = {
  linear: (t) => t,
};
