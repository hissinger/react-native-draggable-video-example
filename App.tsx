/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  PanResponder,
  Dimensions,
  Animated,
  SafeAreaView,
} from 'react-native';
import {MediaStream, RTCView, mediaDevices} from 'react-native-webrtc';

const VIDEO_WIDTH = 150;
const VIDEO_HEIGHT = 200;
const MARGIN = 20;

enum VideoPosition {
  TOP_LEFT = 1,
  TOP_RIGHT,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
}

function DraggableLocalVideo({
  screenWidth,
  screenHeight,
}: {
  screenWidth: number;
  screenHeight: number;
}): React.JSX.Element {
  const [localStream, setLocalStream] = React.useState<MediaStream>();
  const [position, setPosition] = React.useState<VideoPosition>(
    VideoPosition.TOP_LEFT,
  );

  // Initialize the pan position to top-left corner with margin
  const initialPanValue = {x: MARGIN, y: MARGIN};
  const pan = React.useRef(new Animated.ValueXY(initialPanValue)).current;
  const currentPanValue = React.useRef(initialPanValue);

  // Pan responder
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          // Set current pan value to the offset
          pan.setOffset({
            x: currentPanValue.current.x,
            y: currentPanValue.current.y,
          });
          pan.setValue({x: 0, y: 0}); // Initial value
        },
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          pan.flattenOffset();

          // get current position
          const currentX = currentPanValue.current.x;
          const currentY = currentPanValue.current.y;

          // Calculate the closest edge considering video dimensions
          const toLeft = currentX - MARGIN;
          const toRight = screenWidth - (currentX + VIDEO_WIDTH) - MARGIN;
          const toTop = currentY - MARGIN;
          const toBottom = screenHeight - (currentY + VIDEO_HEIGHT) - MARGIN;

          // Determine new X position (nearest horizontal edge)
          let newX = currentX;
          if (toLeft < toRight) {
            newX = MARGIN;
          } else {
            newX = screenWidth - VIDEO_WIDTH - MARGIN;
          }

          // Determine new Y position (nearest vertical edge)
          let newY = currentY;
          if (toTop < toBottom) {
            newY = MARGIN;
          } else {
            newY = screenHeight - VIDEO_HEIGHT - MARGIN;
          }

          const isLeft = newX < screenWidth / 2;
          const isTop = newY < screenHeight / 2;

          if (isLeft && isTop) {
            setPosition(VideoPosition.TOP_LEFT);
          } else if (isLeft && !isTop) {
            setPosition(VideoPosition.BOTTOM_LEFT);
          } else if (!isLeft && isTop) {
            setPosition(VideoPosition.TOP_RIGHT);
          } else {
            setPosition(VideoPosition.BOTTOM_RIGHT);
          }

          // Animate to the new position
          Animated.spring(pan, {
            toValue: {x: newX, y: newY},
            useNativeDriver: false,
          }).start();
        },
      }),
    [pan, screenWidth, screenHeight],
  );

  React.useEffect(() => {
    // Calculate new position based on the rotation and updated screen dimensions
    if (!position) {
      return;
    }

    let newX = 0;
    let newY = 0;

    if (position === VideoPosition.TOP_LEFT) {
      newX = MARGIN;
      newY = MARGIN;
    } else if (position === VideoPosition.TOP_RIGHT) {
      newX = screenWidth - VIDEO_WIDTH - MARGIN;
      newY = MARGIN;
    } else if (position === VideoPosition.BOTTOM_LEFT) {
      newX = MARGIN;
      newY = screenHeight - VIDEO_HEIGHT - MARGIN;
    } else {
      newX = screenWidth - VIDEO_WIDTH - MARGIN;
      newY = screenHeight - VIDEO_HEIGHT - MARGIN;
    }

    Animated.spring(pan, {
      toValue: {x: newX, y: newY},
      useNativeDriver: false,
    }).start();
  }, [screenHeight, screenWidth]);

  // Update current pan value
  React.useEffect(() => {
    const panListener = pan.addListener(value => {
      currentPanValue.current = value;
    });

    return () => {
      pan.removeListener(panListener);
    };
  }, [pan]);

  // Get local stream
  React.useEffect(() => {
    const getStream = async () => {
      const stream = await mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setLocalStream(stream);
    };
    getStream();
  }, []);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.animatedView,
        {
          transform: [{translateX: pan.x}, {translateY: pan.y}],
        },
      ]}>
      <RTCView
        streamURL={localStream?.toURL()}
        style={styles.localStream}
        objectFit={'cover'}
      />
    </Animated.View>
  );
}

function App(): React.JSX.Element {
  // Get screen dimensions
  const [screenWidth, setScreenWidth] = React.useState(
    Dimensions.get('window').width,
  );
  const [screenHeight, setScreenHeight] = React.useState(
    Dimensions.get('window').height,
  );

  // Update screen dimensions on change
  React.useEffect(() => {
    Dimensions.addEventListener('change', (e: any) => {
      const {width, height} = e.window;
      setScreenWidth(width);
      setScreenHeight(height);
    });
  }, []);

  return (
    <SafeAreaView style={styles.background}>
      <ImageBackground
        source={require('./assets/remote.webp')}
        style={styles.remoteStream}
      />
      <DraggableLocalVideo
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  localStream: {
    flex: 1,
  },
  remoteStream: {
    flex: 1,
    justifyContent: 'center',
    resizeMode: 'cover',
  },
  animatedView: {
    position: 'absolute',
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
  },
});

export default App;
