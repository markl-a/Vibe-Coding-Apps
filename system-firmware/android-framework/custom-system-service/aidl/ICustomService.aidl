package com.android.server.custom;

import com.android.server.custom.ICustomServiceCallback;
import com.android.server.custom.CustomData;
import android.os.Bundle;

/**
 * 自定義系統服務主介面
 *
 * 此介面定義了系統服務提供的所有功能，包括資料操作、狀態查詢、
 * 事件監聽和系統控制等。
 */
interface ICustomService {
    /**
     * 獲取指定鍵的資料
     * @param key 資料鍵
     * @return 資料值，如果不存在則返回 null
     */
    String getData(String key);

    /**
     * 設置資料
     * @param key 資料鍵
     * @param value 資料值
     */
    void setData(String key, String value);

    /**
     * 獲取自定義資料物件
     * @param id 資料 ID
     * @return CustomData 物件
     */
    CustomData getCustomData(int id);

    /**
     * 批次獲取資料
     * @param keys 資料鍵列表
     * @return 資料值列表
     */
    List<String> getBatchData(in List<String> keys);

    /**
     * 批次設置資料
     * @param data 資料映射 (key-value pairs)
     */
    void setBatchData(in Bundle data);

    /**
     * 刪除指定鍵的資料
     * @param key 資料鍵
     * @return 是否刪除成功
     */
    boolean removeData(String key);

    /**
     * 清空所有資料
     */
    void clearAllData();

    /**
     * 獲取服務狀態
     * @return 狀態碼 (0:IDLE, 1:RUNNING, 2:ERROR)
     */
    int getServiceStatus();

    /**
     * 檢查服務是否就緒
     * @return true 如果服務已就緒
     */
    boolean isReady();

    /**
     * 獲取服務版本
     * @return 版本字符串
     */
    String getVersion();

    /**
     * 註冊事件回調
     * @param callback 回調介面
     */
    void registerCallback(ICustomServiceCallback callback);

    /**
     * 反註冊事件回調
     * @param callback 回調介面
     */
    void unregisterCallback(ICustomServiceCallback callback);

    /**
     * 執行指定動作
     * @param action 動作名稱
     * @param params 參數
     * @return 執行結果
     */
    boolean performAction(String action, in Bundle params);

    /**
     * 重置服務狀態
     */
    void resetService();

    /**
     * 獲取統計資訊
     * @return 統計資料 Bundle
     */
    Bundle getStatistics();

    /**
     * 設置配置項
     * @param config 配置 Bundle
     */
    void setConfiguration(in Bundle config);

    /**
     * 獲取配置項
     * @return 配置 Bundle
     */
    Bundle getConfiguration();
}
