package com.android.server.custom;

/**
 * 自定義服務事件回調介面
 *
 * 使用 oneway 關鍵字實現異步回調，避免阻塞服務端
 */
oneway interface ICustomServiceCallback {
    /**
     * 狀態變化通知
     * @param status 新狀態碼
     * @param message 狀態描述
     */
    void onStatusChanged(int status, String message);

    /**
     * 資料更新通知
     * @param key 資料鍵
     * @param value 資料值
     * @param timestamp 更新時間戳
     */
    void onDataUpdated(String key, String value, long timestamp);

    /**
     * 批次資料更新通知
     * @param keys 資料鍵列表
     * @param values 資料值列表
     */
    void onBatchDataUpdated(in List<String> keys, in List<String> values);

    /**
     * 錯誤通知
     * @param errorCode 錯誤碼
     * @param message 錯誤訊息
     */
    void onError(int errorCode, String message);

    /**
     * 服務就緒通知
     */
    void onServiceReady();

    /**
     * 服務重置通知
     */
    void onServiceReset();

    /**
     * 配置變更通知
     * @param key 配置鍵
     * @param value 配置值
     */
    void onConfigurationChanged(String key, String value);

    /**
     * 自定義事件通知
     * @param eventType 事件類型
     * @param eventData 事件資料
     */
    void onCustomEvent(int eventType, in Bundle eventData);
}
