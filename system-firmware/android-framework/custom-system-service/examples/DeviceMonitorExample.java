package com.android.custom.examples;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.android.custom.client.CustomServiceClient;
import com.android.server.custom.CustomData;
import com.android.server.custom.ICustomServiceCallback;

/**
 * 設備監控範例
 *
 * 展示如何使用 CustomServiceClient 監控設備狀態
 * 實際應用場景：監控電池、溫度、CPU 等系統資訊
 */
public class DeviceMonitorExample {
    private static final String TAG = "DeviceMonitorExample";

    private Context mContext;
    private CustomServiceClient mClient;
    private Handler mHandler;
    private DeviceStatusListener mListener;

    // 監控間隔（毫秒）
    private static final long MONITOR_INTERVAL = 5000;

    // 設備狀態監聽器
    public interface DeviceStatusListener {
        void onBatteryLevelChanged(int level);
        void onTemperatureChanged(float temperature);
        void onCpuUsageChanged(float usage);
        void onMemoryUsageChanged(long used, long total);
    }

    public DeviceMonitorExample(Context context, DeviceStatusListener listener) {
        mContext = context;
        mListener = listener;
        mHandler = new Handler(Looper.getMainLooper());
    }

    /**
     * 開始監控
     */
    public void startMonitoring() {
        Log.i(TAG, "Starting device monitoring...");

        // 初始化客戶端
        mClient = new CustomServiceClient(mContext, new CustomServiceClient.ServiceConnectionCallback() {
            @Override
            public void onConnected() {
                Log.i(TAG, "Connected to service");

                // 註冊事件回調
                registerCallback();

                // 開始定期查詢
                startPeriodicQuery();
            }

            @Override
            public void onDisconnected() {
                Log.w(TAG, "Disconnected from service");
                stopPeriodicQuery();
            }

            @Override
            public void onError(String error) {
                Log.e(TAG, "Service error: " + error);
            }
        });
    }

    /**
     * 停止監控
     */
    public void stopMonitoring() {
        Log.i(TAG, "Stopping device monitoring...");

        stopPeriodicQuery();

        if (mClient != null) {
            mClient.release();
            mClient = null;
        }
    }

    /**
     * 註冊回調
     */
    private void registerCallback() {
        ICustomServiceCallback callback = new ICustomServiceCallback.Stub() {
            @Override
            public void onDataUpdated(String key, String value, long timestamp) {
                handleDataUpdate(key, value);
            }

            @Override
            public void onStatusChanged(int status, String message) {
                Log.i(TAG, "Status changed: " + message);
            }

            @Override
            public void onBatchDataUpdated(java.util.List<String> keys, java.util.List<String> values) {
                for (int i = 0; i < keys.size(); i++) {
                    handleDataUpdate(keys.get(i), values.get(i));
                }
            }

            @Override
            public void onError(int errorCode, String message) {
                Log.e(TAG, "Error: " + message);
            }

            @Override
            public void onServiceReady() {
                Log.i(TAG, "Service is ready");
            }

            @Override
            public void onServiceReset() {
                Log.i(TAG, "Service reset");
            }

            @Override
            public void onConfigurationChanged(String key, String value) {
                Log.i(TAG, "Configuration changed: " + key + " = " + value);
            }

            @Override
            public void onCustomEvent(int eventType, Bundle eventData) {
                Log.i(TAG, "Custom event: " + eventType);
            }
        };

        mClient.registerCallback(callback);
    }

    /**
     * 處理資料更新
     */
    private void handleDataUpdate(String key, String value) {
        try {
            switch (key) {
                case "battery_level":
                    int batteryLevel = Integer.parseInt(value);
                    if (mListener != null) {
                        mListener.onBatteryLevelChanged(batteryLevel);
                    }
                    break;

                case "temperature":
                    float temperature = Float.parseFloat(value);
                    if (mListener != null) {
                        mListener.onTemperatureChanged(temperature);
                    }
                    break;

                case "cpu_usage":
                    float cpuUsage = Float.parseFloat(value);
                    if (mListener != null) {
                        mListener.onCpuUsageChanged(cpuUsage);
                    }
                    break;

                case "memory_usage":
                    String[] parts = value.split("/");
                    if (parts.length == 2) {
                        long used = Long.parseLong(parts[0]);
                        long total = Long.parseLong(parts[1]);
                        if (mListener != null) {
                            mListener.onMemoryUsageChanged(used, total);
                        }
                    }
                    break;
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse data: " + key + " = " + value, e);
        }
    }

    /**
     * 開始定期查詢
     */
    private void startPeriodicQuery() {
        mHandler.postDelayed(mQueryRunnable, MONITOR_INTERVAL);
    }

    /**
     * 停止定期查詢
     */
    private void stopPeriodicQuery() {
        mHandler.removeCallbacks(mQueryRunnable);
    }

    /**
     * 查詢任務
     */
    private final Runnable mQueryRunnable = new Runnable() {
        @Override
        public void run() {
            queryDeviceStatus();
            mHandler.postDelayed(this, MONITOR_INTERVAL);
        }
    };

    /**
     * 查詢設備狀態
     */
    private void queryDeviceStatus() {
        if (mClient == null) return;

        // 查詢電池電量
        String batteryLevel = mClient.getData("battery_level");
        if (batteryLevel != null) {
            handleDataUpdate("battery_level", batteryLevel);
        }

        // 查詢溫度
        String temperature = mClient.getData("temperature");
        if (temperature != null) {
            handleDataUpdate("temperature", temperature);
        }

        // 查詢 CPU 使用率
        String cpuUsage = mClient.getData("cpu_usage");
        if (cpuUsage != null) {
            handleDataUpdate("cpu_usage", cpuUsage);
        }

        // 查詢記憶體使用情況
        String memoryUsage = mClient.getData("memory_usage");
        if (memoryUsage != null) {
            handleDataUpdate("memory_usage", memoryUsage);
        }

        Log.d(TAG, "Device status queried");
    }

    /**
     * 獲取設備統計資訊
     */
    public Bundle getDeviceStatistics() {
        if (mClient == null) return null;
        return mClient.getStatistics();
    }

    /**
     * 重置統計資訊
     */
    public boolean resetStatistics() {
        if (mClient == null) return false;

        Bundle params = new Bundle();
        params.putBoolean("reset_stats", true);
        return mClient.performAction("reset", params);
    }
}
