import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * useOnlineStatus - 监听网络连接状态
 *
 * @returns [是否在线, 网络类型]
 *
 * 注意：需要安装 @react-native-community/netinfo
 * npm install @react-native-community/netinfo
 *
 * @example
 * const [isOnline, networkType] = useOnlineStatus();
 *
 * return (
 *   <View>
 *     {!isOnline && (
 *       <Text style={styles.warning}>您当前处于离线状态</Text>
 *     )}
 *     <Text>网络类型: {networkType}</Text>
 *   </View>
 * );
 */
export function useOnlineStatus(): [boolean, string | null] {
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      setNetworkType(state.type);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return [isOnline, networkType];
}
