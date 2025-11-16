package com.android.custom.client;

import android.content.Context;
import android.os.Bundle;
import android.os.IBinder;
import android.os.RemoteException;
import android.os.ServiceManager;
import android.util.Log;

import com.android.server.custom.ICustomService;
import com.android.server.custom.ICustomServiceCallback;
import com.android.server.custom.CustomData;

import java.util.List;

/**
 * 自定義服務客戶端封裝類
 *
 * 提供簡潔的 API 來訪問系統服務功能，處理 Binder 通訊細節
 */
public class CustomServiceClient {
    private static final String TAG = "CustomServiceClient";
    private static final String SERVICE_NAME = "custom";

    private final Context mContext;
    private ICustomService mService;
    private ServiceConnectionCallback mConnectionCallback;

    /**
     * 服務連接回調介面
     */
    public interface ServiceConnectionCallback {
        void onConnected();
        void onDisconnected();
        void onError(String error);
    }

    public CustomServiceClient(Context context) {
        this(context, null);
    }

    public CustomServiceClient(Context context, ServiceConnectionCallback callback) {
        mContext = context;
        mConnectionCallback = callback;
        bindService();
    }

    /**
     * 綁定服務
     */
    private void bindService() {
        try {
            IBinder binder = ServiceManager.getService(SERVICE_NAME);
            if (binder != null) {
                mService = ICustomService.Stub.asInterface(binder);
                Log.i(TAG, "Service bound successfully");

                // 設置死亡通知
                binder.linkToDeath(mDeathRecipient, 0);

                if (mConnectionCallback != null) {
                    mConnectionCallback.onConnected();
                }
            } else {
                String error = "Service not available";
                Log.e(TAG, error);
                if (mConnectionCallback != null) {
                    mConnectionCallback.onError(error);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to bind service", e);
            if (mConnectionCallback != null) {
                mConnectionCallback.onError(e.getMessage());
            }
        }
    }

    /**
     * 死亡通知接收器
     */
    private final IBinder.DeathRecipient mDeathRecipient = new IBinder.DeathRecipient() {
        @Override
        public void binderDied() {
            Log.w(TAG, "Service died, attempting to reconnect");
            mService = null;
            if (mConnectionCallback != null) {
                mConnectionCallback.onDisconnected();
            }
            // 嘗試重新連接
            bindService();
        }
    };

    /**
     * 檢查服務是否可用
     */
    private boolean checkService() {
        if (mService == null) {
            Log.e(TAG, "Service not available");
            return false;
        }
        return true;
    }

    // ==================== 資料操作 API ====================

    /**
     * 獲取資料
     */
    public String getData(String key) {
        if (!checkService()) return null;

        try {
            return mService.getData(key);
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to get data for key: " + key, e);
            return null;
        }
    }

    /**
     * 設置資料
     */
    public boolean setData(String key, String value) {
        if (!checkService()) return false;

        try {
            mService.setData(key, value);
            return true;
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to set data for key: " + key, e);
            return false;
        }
    }

    /**
     * 獲取自定義資料物件
     */
    public CustomData getCustomData(int id) {
        if (!checkService()) return null;

        try {
            return mService.getCustomData(id);
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to get custom data for id: " + id, e);
            return null;
        }
    }

    /**
     * 批次獲取資料
     */
    public List<String> getBatchData(List<String> keys) {
        if (!checkService()) return null;

        try {
            return mService.getBatchData(keys);
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to get batch data", e);
            return null;
        }
    }

    /**
     * 批次設置資料
     */
    public boolean setBatchData(Bundle data) {
        if (!checkService()) return false;

        try {
            mService.setBatchData(data);
            return true;
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to set batch data", e);
            return false;
        }
    }

    /**
     * 刪除資料
     */
    public boolean removeData(String key) {
        if (!checkService()) return false;

        try {
            return mService.removeData(key);
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to remove data for key: " + key, e);
            return false;
        }
    }

    /**
     * 清空所有資料
     */
    public boolean clearAllData() {
        if (!checkService()) return false;

        try {
            mService.clearAllData();
            return true;
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to clear all data", e);
            return false;
        }
    }

    // ==================== 狀態查詢 API ====================

    /**
     * 獲取服務狀態
     */
    public int getServiceStatus() {
        if (!checkService()) return -1;

        try {
            return mService.getServiceStatus();
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to get service status", e);
            return -1;
        }
    }

    /**
     * 檢查服務是否就緒
     */
    public boolean isServiceReady() {
        if (!checkService()) return false;

        try {
            return mService.isReady();
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to check service ready", e);
            return false;
        }
    }

    /**
     * 獲取服務版本
     */
    public String getVersion() {
        if (!checkService()) return null;

        try {
            return mService.getVersion();
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to get version", e);
            return null;
        }
    }

    // ==================== 事件監聽 API ====================

    /**
     * 註冊事件回調
     */
    public boolean registerCallback(ICustomServiceCallback callback) {
        if (!checkService()) return false;

        try {
            mService.registerCallback(callback);
            return true;
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to register callback", e);
            return false;
        }
    }

    /**
     * 反註冊事件回調
     */
    public boolean unregisterCallback(ICustomServiceCallback callback) {
        if (!checkService()) return false;

        try {
            mService.unregisterCallback(callback);
            return true;
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to unregister callback", e);
            return false;
        }
    }

    // ==================== 系統控制 API ====================

    /**
     * 執行動作
     */
    public boolean performAction(String action, Bundle params) {
        if (!checkService()) return false;

        try {
            return mService.performAction(action, params);
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to perform action: " + action, e);
            return false;
        }
    }

    /**
     * 重置服務
     */
    public boolean resetService() {
        if (!checkService()) return false;

        try {
            mService.resetService();
            return true;
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to reset service", e);
            return false;
        }
    }

    /**
     * 獲取統計資訊
     */
    public Bundle getStatistics() {
        if (!checkService()) return null;

        try {
            return mService.getStatistics();
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to get statistics", e);
            return null;
        }
    }

    /**
     * 設置配置
     */
    public boolean setConfiguration(Bundle config) {
        if (!checkService()) return false;

        try {
            mService.setConfiguration(config);
            return true;
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to set configuration", e);
            return false;
        }
    }

    /**
     * 獲取配置
     */
    public Bundle getConfiguration() {
        if (!checkService()) return null;

        try {
            return mService.getConfiguration();
        } catch (RemoteException e) {
            Log.e(TAG, "Failed to get configuration", e);
            return null;
        }
    }

    /**
     * 釋放資源
     */
    public void release() {
        if (mService != null && mService.asBinder() != null) {
            mService.asBinder().unlinkToDeath(mDeathRecipient, 0);
        }
        mService = null;
        mConnectionCallback = null;
    }
}
