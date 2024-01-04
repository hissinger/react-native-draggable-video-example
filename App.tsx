/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useRef} from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
  PanResponder,
  Dimensions,
  Animated,
} from 'react-native';
import {MediaStream, RTCView, mediaDevices} from 'react-native-webrtc';

const VIDEO_WIDTH = 150;
const VIDEO_HEIGHT = 200;
const MARGIN = 20;

function DraggableLocalVideo(): React.JSX.Element {
  const [localStream, setLocalStream] = React.useState<MediaStream>();

  // Initialize the pan position to top-left corner with margin
  const initialPanValue = {x: MARGIN, y: MARGIN};
  const pan = useRef(new Animated.ValueXY(initialPanValue)).current;
  const currentPanValue = useRef(initialPanValue);

  // Get screen dimensions
  const {width, height} = Dimensions.get('window');

  // Pan responder
  const panResponder = PanResponder.create({
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
      const toRight = width - (currentX + VIDEO_WIDTH) - MARGIN;
      const toTop = currentY - MARGIN;
      const toBottom = height - (currentY + VIDEO_HEIGHT) - MARGIN;

      // Determine new X position (nearest horizontal edge)
      let newX = currentX;
      if (toLeft < toRight) {
        newX = MARGIN;
      } else {
        newX = width - VIDEO_WIDTH - MARGIN;
      }

      // Determine new Y position (nearest vertical edge)
      let newY = currentY;
      if (toTop < toBottom) {
        newY = MARGIN;
      } else {
        newY = height - VIDEO_HEIGHT - MARGIN;
      }

      // Animate to the new position
      Animated.spring(pan, {
        toValue: {x: newX, y: newY},
        useNativeDriver: false,
      }).start();
    },
  });

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
  return (
    <View style={styles.background}>
      <ImageBackground
        source={require('./assets/remote.webp')}
        style={styles.remoteStream}
      />
      <DraggableLocalVideo />
    </View>
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
