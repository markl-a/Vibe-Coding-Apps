package com.android.custom.client.example;

import android.app.Activity;
import android.os.Bundle;
import android.os.RemoteException;
import android.util.Log;
import android.widget.Toast;

import com.android.custom.client.CustomServiceClient;
import com.android.server.custom.ICustomServiceCallback;

import java.util.Arrays;
import java.util.List;

/**
 * 自定義服務使用範例
 *
 * 展示如何使用 CustomServiceClient 與系統服務互動
 */
public class CustomServiceExample extends Activity {
    private static final String TAG = "CustomServiceExample";

    private CustomServiceClient mClient;
    private ICustomServiceCallback mCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 初始化客戶端
        initializeClient();

        // 使用範例
        runExamples();
    }

    /**
     * 初始化客戶端
     */
    private void initializeClient() {
        mClient = new CustomServiceClient(this, new CustomServiceClient.ServiceConnectionCallback() {
            @Override
            public void onConnected() {
                Log.i(TAG, "Service connected");
                Toast.makeText(CustomServiceExample.this, "服務已連接", Toast.LENGTH_SHORT).show();

                // 註冊事件監聽
                registerEventCallback();
            }

            @Override
            public void onDisconnected() {
                Log.w(TAG, "Service disconnected");
                Toast.makeText(CustomServiceExample.this, "服務已斷開", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onError(String error) {
                Log.e(TAG, "Service error: " + error);
                Toast.makeText(CustomServiceExample.this, "服務錯誤: " + error, Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * 註冊事件回調
     */
    private void registerEventCallback() {
        mCallback = new ICustomServiceCallback.Stub() {
            @Override
            public void onStatusChanged(int status, String message) {
                runOnUiThread(() -> {
                    Log.i(TAG, "Status changed: " + status + ", message: " + message);
                    Toast.makeText(CustomServiceExample.this,
                            "狀態變更: " + message, Toast.LENGTH_SHORT).show();
                });
            }

            @Override
            public void onDataUpdated(String key, String value, long timestamp) {
                runOnUiThread(() -> {
                    Log.i(TAG, "Data updated: " + key + " = " + value);
                });
            }

            @Override
            public void onBatchDataUpdated(List<String> keys, List<String> values) {
                runOnUiThread(() -> {
                    Log.i(TAG, "Batch data updated: " + keys.size() + " items");
                });
            }

            @Override
            public void onError(int errorCode, String message) {
                runOnUiThread(() -> {
                    Log.e(TAG, "Error: " + errorCode + ", " + message);
                    Toast.makeText(CustomServiceExample.this,
                            "錯誤: " + message, Toast.LENGTH_SHORT).show();
                });
            }

            @Override
            public void onServiceReady() {
                runOnUiThread(() -> {
                    Log.i(TAG, "Service is ready");
                });
            }

            @Override
            public void onServiceReset() {
                runOnUiThread(() -> {
                    Log.i(TAG, "Service has been reset");
                    Toast.makeText(CustomServiceExample.this,
                            "服務已重置", Toast.LENGTH_SHORT).show();
                });
            }

            @Override
            public void onConfigurationChanged(String key, String value) {
                runOnUiThread(() -> {
                    Log.i(TAG, "Configuration changed: " + key + " = " + value);
                });
            }

            @Override
            public void onCustomEvent(int eventType, Bundle eventData) {
                runOnUiThread(() -> {
                    Log.i(TAG, "Custom event: " + eventType);
                });
            }
        };

        mClient.registerCallback(mCallback);
    }

    /**
     * 執行範例
     */
    private void runExamples() {
        // 範例 1: 基本資料操作
        example1_BasicDataOperations();

        // 範例 2: 批次資料操作
        example2_BatchDataOperations();

        // 範例 3: 服務狀態查詢
        example3_ServiceStatusQuery();

        // 範例 4: 執行動作
        example4_PerformActions();

        // 範例 5: 配置管理
        example5_ConfigurationManagement();

        // 範例 6: 統計資訊
        example6_Statistics();
    }

    /**
     * 範例 1: 基本資料操作
     */
    private void example1_BasicDataOperations() {
        Log.i(TAG, "=== Example 1: Basic Data Operations ===");

        // 設置資料
        boolean setResult = mClient.setData("user_name", "John Doe");
        Log.i(TAG, "Set data result: " + setResult);

        // 獲取資料
        String value = mClient.getData("user_name");
        Log.i(TAG, "Get data result: " + value);

        // 刪除資料
        boolean removeResult = mClient.removeData("user_name");
        Log.i(TAG, "Remove data result: " + removeResult);
    }

    /**
     * 範例 2: 批次資料操作
     */
    private void example2_BatchDataOperations() {
        Log.i(TAG, "=== Example 2: Batch Data Operations ===");

        // 批次設置資料
        Bundle data = new Bundle();
        data.putString("key1", "value1");
        data.putString("key2", "value2");
        data.putString("key3", "value3");

        boolean setBatchResult = mClient.setBatchData(data);
        Log.i(TAG, "Set batch data result: " + setBatchResult);

        // 批次獲取資料
        List<String> keys = Arrays.asList("key1", "key2", "key3");
        List<String> values = mClient.getBatchData(keys);
        if (values != null) {
            for (int i = 0; i < keys.size(); i++) {
                Log.i(TAG, keys.get(i) + " = " + values.get(i));
            }
        }

        // 清空所有資料
        // boolean clearResult = mClient.clearAllData();
        // Log.i(TAG, "Clear all data result: " + clearResult);
    }

    /**
     * 範例 3: 服務狀態查詢
     */
    private void example3_ServiceStatusQuery() {
        Log.i(TAG, "=== Example 3: Service Status Query ===");

        // 檢查服務是否就緒
        boolean isReady = mClient.isServiceReady();
        Log.i(TAG, "Service ready: " + isReady);

        // 獲取服務狀態
        int status = mClient.getServiceStatus();
        String statusText = getStatusText(status);
        Log.i(TAG, "Service status: " + statusText);

        // 獲取服務版本
        String version = mClient.getVersion();
        Log.i(TAG, "Service version: " + version);
    }

    /**
     * 範例 4: 執行動作
     */
    private void example4_PerformActions() {
        Log.i(TAG, "=== Example 4: Perform Actions ===");

        // 執行更新動作
        Bundle params = new Bundle();
        params.putString("target", "system");
        params.putInt("priority", 1);

        boolean result = mClient.performAction("update", params);
        Log.i(TAG, "Perform action result: " + result);

        // 執行同步動作
        Bundle syncParams = new Bundle();
        syncParams.putBoolean("force", true);

        boolean syncResult = mClient.performAction("sync", syncParams);
        Log.i(TAG, "Perform sync result: " + syncResult);
    }

    /**
     * 範例 5: 配置管理
     */
    private void example5_ConfigurationManagement() {
        Log.i(TAG, "=== Example 5: Configuration Management ===");

        // 設置配置
        Bundle config = new Bundle();
        config.putInt("max_cache_size", 1024);
        config.putBoolean("enable_logging", true);
        config.putString("log_level", "DEBUG");

        boolean setConfigResult = mClient.setConfiguration(config);
        Log.i(TAG, "Set configuration result: " + setConfigResult);

        // 獲取配置
        Bundle currentConfig = mClient.getConfiguration();
        if (currentConfig != null) {
            Log.i(TAG, "Current configuration:");
            for (String key : currentConfig.keySet()) {
                Log.i(TAG, "  " + key + " = " + currentConfig.get(key));
            }
        }
    }

    /**
     * 範例 6: 統計資訊
     */
    private void example6_Statistics() {
        Log.i(TAG, "=== Example 6: Statistics ===");

        Bundle stats = mClient.getStatistics();
        if (stats != null) {
            Log.i(TAG, "Service statistics:");
            for (String key : stats.keySet()) {
                Log.i(TAG, "  " + key + " = " + stats.get(key));
            }
        }
    }

    /**
     * 獲取狀態文字
     */
    private String getStatusText(int status) {
        switch (status) {
            case 0:
                return "IDLE";
            case 1:
                return "RUNNING";
            case 2:
                return "ERROR";
            default:
                return "UNKNOWN";
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        // 反註冊回調
        if (mClient != null && mCallback != null) {
            mClient.unregisterCallback(mCallback);
        }

        // 釋放資源
        if (mClient != null) {
            mClient.release();
        }
    }
}
