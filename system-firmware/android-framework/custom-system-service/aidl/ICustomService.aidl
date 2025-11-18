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

    // ==================== AI 輔助功能 ====================

    /**
     * AI 輔助分析資料
     * @param data 待分析的資料
     * @param analysisType 分析類型 (pattern, anomaly, prediction)
     * @return 分析結果 JSON 字串
     */
    String analyzeDataWithAI(String data, String analysisType);

    /**
     * AI 輔助優化建議
     * @param context 上下文資訊
     * @return 優化建議列表
     */
    List<String> getAIOptimizationSuggestions(in Bundle context);

    /**
     * AI 輔助預測
     * @param historicalData 歷史資料列表
     * @param predictionHorizon 預測時間範圍 (分鐘)
     * @return 預測結果
     */
    String predictWithAI(in List<String> historicalData, int predictionHorizon);

    /**
     * AI 輔助異常檢測
     * @param metrics 待檢測的指標資料
     * @return 異常檢測報告
     */
    String detectAnomalies(in Bundle metrics);

    /**
     * AI 輔助自動調優
     * @param targetMetric 目標指標 (performance, battery, memory)
     * @return 調優結果
     */
    boolean autoTuneWithAI(String targetMetric);

    /**
     * 獲取 AI 模型資訊
     * @return AI 模型資訊 Bundle
     */
    Bundle getAIModelInfo();
}
