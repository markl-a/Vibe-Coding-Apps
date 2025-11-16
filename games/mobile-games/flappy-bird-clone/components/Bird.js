import React from 'react';
import { View } from 'react-native';

const Bird = (props) => {
  const { body, size, color } = props;
  const [width, height] = size;
  const x = body.position.x - width / 2;
  const y = body.position.y - height / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor: color,
        borderRadius: width / 2,
        borderWidth: 2,
        borderColor: '#FF9800',
      }}
    />
  );
};

export default Bird;
