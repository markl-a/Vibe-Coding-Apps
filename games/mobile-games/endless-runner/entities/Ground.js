import React from 'react';
import { View } from 'react-native';

const Ground = (props) => {
  const { position, size } = props;

  return (
    <View
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundColor: '#8B4513',
        borderTopWidth: 3,
        borderTopColor: '#654321',
      }}
    />
  );
};

export default Ground;
