import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';

interface DraggableIconProps {
  iconSource: any;
  onDrop: (x: number, y: number) => void;
}

const DraggableIcon: React.FC<DraggableIconProps> = ({
  iconSource,
  onDrop,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      runOnJS(onDrop)(event.absoluteX, event.absoluteY);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[{ position: 'absolute' }, animatedStyle]}>
        <Image source={iconSource} style={{ width: 32, height: 32 }} />
      </Animated.View>
    </PanGestureHandler>
  );
};
