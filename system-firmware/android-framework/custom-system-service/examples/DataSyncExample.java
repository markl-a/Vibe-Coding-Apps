package com.android.custom.examples;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import com.android.custom.client.CustomServiceClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 資料同步範例
 *
 * 展示如何使用 CustomServiceClient 進行批次資料同步
 * 實際應用場景：應用設置同步、用戶資料備份、離線資料上傳
 */
public class DataSyncExample {
    private static final String TAG = "DataSyncExample";

    private Context mContext;
    private CustomServiceClient mClient;
    private SyncCallback mCallback;

    // 同步狀態
    public enum SyncStatus {
        IDLE,
        SYNCING,
        SUCCESS,
        FAILED
    }

    // 同步回調
    public interface SyncCallback {
        void onSyncStarted();
        void onSyncProgress(int current, int total);
        void onSyncCompleted(boolean success, String message);
    }

    public DataSyncExample(Context context, SyncCallback callback) {
        mContext = context;
        mCallback = callback;
        initializeClient();
    }

    /**
     * 初始化客戶端
     */
    private void initializeClient() {
        mClient = new CustomServiceClient(mContext, new CustomServiceClient.ServiceConnectionCallback() {
            @Override
            public void onConnected() {
                Log.i(TAG, "Service connected");
            }

            @Override
            public void onDisconnected() {
                Log.w(TAG, "Service disconnected");
            }

            @Override
            public void onError(String error) {
                Log.e(TAG, "Service error: " + error);
            }
        });
    }

    /**
     * 同步用戶設置
     */
    public void syncUserSettings(Map<String, String> settings) {
        Log.i(TAG, "Syncing user settings...");

        if (mCallback != null) {
            mCallback.onSyncStarted();
        }

        // 準備批次資料
        Bundle data = new Bundle();
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            data.putString(entry.getKey(), entry.getValue());
        }

        // 執行批次設置
        boolean result = mClient.setBatchData(data);

        if (mCallback != null) {
            if (result) {
                mCallback.onSyncCompleted(true, "Settings synced successfully");
            } else {
                mCallback.onSyncCompleted(false, "Failed to sync settings");
            }
        }

        Log.i(TAG, "User settings sync result: " + result);
    }

    /**
     * 同步應用資料
     */
    public void syncAppData(List<AppData> dataList) {
        Log.i(TAG, "Syncing app data: " + dataList.size() + " items");

        if (mCallback != null) {
            mCallback.onSyncStarted();
        }

        int total = dataList.size();
        int success = 0;

        for (int i = 0; i < total; i++) {
            AppData appData = dataList.get(i);

            // 設置資料
            boolean result = mClient.setData(appData.key, appData.value);

            if (result) {
                success++;
            }

            // 報告進度
            if (mCallback != null) {
                mCallback.onSyncProgress(i + 1, total);
            }

            Log.d(TAG, "Synced: " + appData.key + " = " + appData.value + ", result: " + result);
        }

        // 完成回調
        if (mCallback != null) {
            boolean allSuccess = (success == total);
            String message = success + " / " + total + " items synced";
            mCallback.onSyncCompleted(allSuccess, message);
        }

        Log.i(TAG, "App data sync completed: " + success + " / " + total);
    }

    /**
     * 批次下載資料
     */
    public Map<String, String> downloadData(List<String> keys) {
        Log.i(TAG, "Downloading data for " + keys.size() + " keys");

        Map<String, String> result = new HashMap<>();

        // 批次獲取資料
        List<String> values = mClient.getBatchData(keys);

        if (values != null && values.size() == keys.size()) {
            for (int i = 0; i < keys.size(); i++) {
                result.put(keys.get(i), values.get(i));
            }
            Log.i(TAG, "Downloaded " + result.size() + " items");
        } else {
            Log.e(TAG, "Failed to download data");
        }

        return result;
    }

    /**
     * 增量同步
     * 只同步自上次同步後變更的資料
     */
    public void incrementalSync(long lastSyncTimestamp) {
        Log.i(TAG, "Starting incremental sync from timestamp: " + lastSyncTimestamp);

        if (mCallback != null) {
            mCallback.onSyncStarted();
        }

        // 執行增量同步動作
        Bundle params = new Bundle();
        params.putLong("last_sync_timestamp", lastSyncTimestamp);
        params.putBoolean("incremental", true);

        boolean result = mClient.performAction("sync", params);

        if (mCallback != null) {
            if (result) {
                mCallback.onSyncCompleted(true, "Incremental sync completed");
            } else {
                mCallback.onSyncCompleted(false, "Incremental sync failed");
            }
        }

        Log.i(TAG, "Incremental sync result: " + result);
    }

    /**
     * 強制完整同步
     */
    public void forceFullSync() {
        Log.i(TAG, "Starting force full sync");

        if (mCallback != null) {
            mCallback.onSyncStarted();
        }

        // 先清空所有資料
        boolean clearResult = mClient.clearAllData();
        Log.i(TAG, "Clear all data result: " + clearResult);

        // 執行完整同步
        Bundle params = new Bundle();
        params.putBoolean("force", true);
        params.putBoolean("full_sync", true);

        boolean result = mClient.performAction("sync", params);

        if (mCallback != null) {
            if (result) {
                mCallback.onSyncCompleted(true, "Full sync completed");
            } else {
                mCallback.onSyncCompleted(false, "Full sync failed");
            }
        }

        Log.i(TAG, "Force full sync result: " + result);
    }

    /**
     * 獲取同步統計資訊
     */
    public SyncStatistics getSyncStatistics() {
        Bundle stats = mClient.getStatistics();

        if (stats == null) {
            return null;
        }

        SyncStatistics syncStats = new SyncStatistics();
        syncStats.lastSyncTime = stats.getLong("last_sync_time", 0);
        syncStats.totalSynced = stats.getInt("total_synced", 0);
        syncStats.totalFailed = stats.getInt("total_failed", 0);
        syncStats.lastSyncDuration = stats.getLong("last_sync_duration", 0);

        return syncStats;
    }

    /**
     * 釋放資源
     */
    public void release() {
        if (mClient != null) {
            mClient.release();
            mClient = null;
        }
    }

    /**
     * 應用資料類
     */
    public static class AppData {
        public String key;
        public String value;

        public AppData(String key, String value) {
            this.key = key;
            this.value = value;
        }
    }

    /**
     * 同步統計資訊類
     */
    public static class SyncStatistics {
        public long lastSyncTime;
        public int totalSynced;
        public int totalFailed;
        public long lastSyncDuration;

        @Override
        public String toString() {
            return "SyncStatistics{" +
                    "lastSyncTime=" + lastSyncTime +
                    ", totalSynced=" + totalSynced +
                    ", totalFailed=" + totalFailed +
                    ", lastSyncDuration=" + lastSyncDuration + "ms" +
                    '}';
        }
    }
}
