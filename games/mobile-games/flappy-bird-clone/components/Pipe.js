import React from 'react';
import { View } from 'react-native';

const Pipe = (props) => {
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
        borderWidth: 2,
        borderColor: '#2E7D32',
        borderRadius: 5,
      }}
    />
  );
};

export default Pipe;
