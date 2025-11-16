import React from 'react';
import { View, Text } from 'react-native';

const Coin = (props) => {
  const { position, size } = props;

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
      <Text style={{ fontSize: 30 }}>💰</Text>
    </View>
  );
};

export default Coin;
