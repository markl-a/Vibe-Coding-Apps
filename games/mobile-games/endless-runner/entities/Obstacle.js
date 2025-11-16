import React from 'react';
import { View } from 'react-native';

const Obstacle = (props) => {
  const { position, size, type } = props;

  const getObstacleEmoji = () => {
    switch (type) {
      case 'cactus':
        return '🌵';
      case 'rock':
        return '🪨';
      case 'tree':
        return '🌲';
      default:
        return '🌵';
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          fontSize: 50,
        }}
      >
        <Text style={{ fontSize: 50 }}>{getObstacleEmoji()}</Text>
      </View>
    </View>
  );
};

export default Obstacle;
