package com.android.custom.examples;

import android.os.Parcel;
import android.util.Log;

import com.android.server.custom.CustomData;

import java.util.ArrayList;
import java.util.List;

/**
 * CustomData 使用範例
 *
 * 展示如何使用 CustomData 類進行資料封裝和跨進程傳輸
 * 實際應用場景：系統配置傳遞、感測器數據封裝、日誌記錄
 */
public class CustomDataExample {
    private static final String TAG = "CustomDataExample";

    /**
     * 範例 1: 基本使用
     */
    public static void example1_BasicUsage() {
        Log.i(TAG, "=== Example 1: Basic Usage ===");

        // 創建簡單的 CustomData 物件
        CustomData data1 = new CustomData(1, "temperature");
        data1.setValue("25.5");
        data1.setType(CustomData.TYPE_FLOAT);

        Log.i(TAG, "Created data: " + data1.toString());
        Log.i(TAG, "ID: " + data1.getId());
        Log.i(TAG, "Name: " + data1.getName());
        Log.i(TAG, "Value: " + data1.getValue());
        Log.i(TAG, "Type: " + getTypeString(data1.getType()));

        // 創建完整的 CustomData 物件
        CustomData data2 = new CustomData(
                2,
                "cpu_usage",
                "45.2",
                System.currentTimeMillis(),
                CustomData.TYPE_FLOAT
        );

        Log.i(TAG, "Created full data: " + data2.toString());
    }

    /**
     * 範例 2: 不同資料類型
     */
    public static void example2_DataTypes() {
        Log.i(TAG, "=== Example 2: Different Data Types ===");

        // 字串類型
        CustomData stringData = new CustomData(101, "device_name");
        stringData.setValue("MyDevice");
        stringData.setType(CustomData.TYPE_STRING);
        Log.i(TAG, "String data: " + stringData.toString());

        // 整數類型
        CustomData intData = new CustomData(102, "battery_level");
        intData.setValue("85");
        intData.setType(CustomData.TYPE_INTEGER);
        Log.i(TAG, "Integer data: " + intData.toString());

        // 浮點數類型
        CustomData floatData = new CustomData(103, "temperature");
        floatData.setValue("36.5");
        floatData.setType(CustomData.TYPE_FLOAT);
        Log.i(TAG, "Float data: " + floatData.toString());

        // 布林類型
        CustomData boolData = new CustomData(104, "is_charging");
        boolData.setValue("true");
        boolData.setType(CustomData.TYPE_BOOLEAN);
        Log.i(TAG, "Boolean data: " + boolData.toString());
    }

    /**
     * 範例 3: Parcelable 序列化/反序列化
     */
    public static void example3_Parcelable() {
        Log.i(TAG, "=== Example 3: Parcelable Serialization ===");

        // 創建原始資料
        CustomData originalData = new CustomData(
                201,
                "sensor_reading",
                "12.34",
                System.currentTimeMillis(),
                CustomData.TYPE_FLOAT
        );

        Log.i(TAG, "Original data: " + originalData.toString());

        // 序列化到 Parcel
        Parcel parcel = Parcel.obtain();
        originalData.writeToParcel(parcel, 0);

        // 重置 Parcel 讀取位置
        parcel.setDataPosition(0);

        // 反序列化
        CustomData deserializedData = CustomData.CREATOR.createFromParcel(parcel);

        Log.i(TAG, "Deserialized data: " + deserializedData.toString());

        // 驗證資料完整性
        boolean isEqual = originalData.getId() == deserializedData.getId() &&
                originalData.getName().equals(deserializedData.getName()) &&
                originalData.getValue().equals(deserializedData.getValue()) &&
                originalData.getTimestamp() == deserializedData.getTimestamp() &&
                originalData.getType() == deserializedData.getType();

        Log.i(TAG, "Data integrity check: " + (isEqual ? "PASSED" : "FAILED"));

        // 釋放 Parcel
        parcel.recycle();
    }

    /**
     * 範例 4: 感測器資料封裝
     */
    public static List<CustomData> example4_SensorDataEncapsulation() {
        Log.i(TAG, "=== Example 4: Sensor Data Encapsulation ===");

        List<CustomData> sensorDataList = new ArrayList<>();
        long timestamp = System.currentTimeMillis();

        // 溫度感測器
        CustomData temperature = new CustomData(301, "temperature", "28.5", timestamp, CustomData.TYPE_FLOAT);
        sensorDataList.add(temperature);
        Log.i(TAG, "Added: " + temperature.toString());

        // 濕度感測器
        CustomData humidity = new CustomData(302, "humidity", "65.2", timestamp, CustomData.TYPE_FLOAT);
        sensorDataList.add(humidity);
        Log.i(TAG, "Added: " + humidity.toString());

        // 氣壓感測器
        CustomData pressure = new CustomData(303, "pressure", "1013.25", timestamp, CustomData.TYPE_FLOAT);
        sensorDataList.add(pressure);
        Log.i(TAG, "Added: " + pressure.toString());

        // 光照強度
        CustomData light = new CustomData(304, "light_intensity", "450", timestamp, CustomData.TYPE_INTEGER);
        sensorDataList.add(light);
        Log.i(TAG, "Added: " + light.toString());

        Log.i(TAG, "Total sensor readings: " + sensorDataList.size());

        return sensorDataList;
    }

    /**
     * 範例 5: 系統配置管理
     */
    public static List<CustomData> example5_SystemConfiguration() {
        Log.i(TAG, "=== Example 5: System Configuration ===");

        List<CustomData> configList = new ArrayList<>();
        long timestamp = System.currentTimeMillis();

        // 顯示亮度
        CustomData brightness = new CustomData(401, "screen_brightness", "80", timestamp, CustomData.TYPE_INTEGER);
        configList.add(brightness);

        // 音量設置
        CustomData volume = new CustomData(402, "system_volume", "70", timestamp, CustomData.TYPE_INTEGER);
        configList.add(volume);

        // Wi-Fi 啟用狀態
        CustomData wifiEnabled = new CustomData(403, "wifi_enabled", "true", timestamp, CustomData.TYPE_BOOLEAN);
        configList.add(wifiEnabled);

        // 藍牙啟用狀態
        CustomData bluetoothEnabled = new CustomData(404, "bluetooth_enabled", "false", timestamp, CustomData.TYPE_BOOLEAN);
        configList.add(bluetoothEnabled);

        // 語言設置
        CustomData language = new CustomData(405, "system_language", "zh_TW", timestamp, CustomData.TYPE_STRING);
        configList.add(language);

        for (CustomData config : configList) {
            Log.i(TAG, "Config: " + config.toString());
        }

        return configList;
    }

    /**
     * 範例 6: 資料驗證和轉換
     */
    public static void example6_DataValidationAndConversion() {
        Log.i(TAG, "=== Example 6: Data Validation and Conversion ===");

        CustomData data = new CustomData(501, "test_value", "42.5", System.currentTimeMillis(), CustomData.TYPE_FLOAT);

        // 根據類型解析值
        try {
            switch (data.getType()) {
                case CustomData.TYPE_STRING:
                    String strValue = data.getValue();
                    Log.i(TAG, "String value: " + strValue);
                    break;

                case CustomData.TYPE_INTEGER:
                    int intValue = Integer.parseInt(data.getValue());
                    Log.i(TAG, "Integer value: " + intValue);
                    break;

                case CustomData.TYPE_FLOAT:
                    float floatValue = Float.parseFloat(data.getValue());
                    Log.i(TAG, "Float value: " + floatValue);
                    break;

                case CustomData.TYPE_BOOLEAN:
                    boolean boolValue = Boolean.parseBoolean(data.getValue());
                    Log.i(TAG, "Boolean value: " + boolValue);
                    break;

                default:
                    Log.w(TAG, "Unknown type: " + data.getType());
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to parse value: " + data.getValue(), e);
        }
    }

    /**
     * 範例 7: 批次資料處理
     */
    public static void example7_BatchDataProcessing() {
        Log.i(TAG, "=== Example 7: Batch Data Processing ===");

        // 創建一批資料
        List<CustomData> dataList = new ArrayList<>();

        for (int i = 0; i < 10; i++) {
            CustomData data = new CustomData(
                    600 + i,
                    "data_" + i,
                    String.valueOf(Math.random() * 100),
                    System.currentTimeMillis(),
                    CustomData.TYPE_FLOAT
            );
            dataList.add(data);
        }

        Log.i(TAG, "Created " + dataList.size() + " data items");

        // 批次處理：計算平均值
        double sum = 0;
        for (CustomData data : dataList) {
            try {
                sum += Double.parseDouble(data.getValue());
            } catch (NumberFormatException e) {
                Log.e(TAG, "Failed to parse: " + data.getValue());
            }
        }

        double average = sum / dataList.size();
        Log.i(TAG, "Average value: " + average);

        // 批次處理：過濾大於平均值的資料
        List<CustomData> filteredList = new ArrayList<>();
        for (CustomData data : dataList) {
            try {
                double value = Double.parseDouble(data.getValue());
                if (value > average) {
                    filteredList.add(data);
                }
            } catch (NumberFormatException e) {
                // 忽略
            }
        }

        Log.i(TAG, "Filtered " + filteredList.size() + " items above average");
    }

    /**
     * 範例 8: 時間戳記應用
     */
    public static void example8_TimestampUsage() {
        Log.i(TAG, "=== Example 8: Timestamp Usage ===");

        // 創建帶時間戳的資料
        long now = System.currentTimeMillis();

        CustomData recentData = new CustomData(701, "recent_event", "Started", now, CustomData.TYPE_STRING);
        Log.i(TAG, "Recent data timestamp: " + recentData.getTimestamp());

        // 模擬舊資料
        CustomData oldData = new CustomData(702, "old_event", "Finished", now - 3600000, CustomData.TYPE_STRING);
        Log.i(TAG, "Old data timestamp: " + oldData.getTimestamp());

        // 計算時間差
        long timeDiff = recentData.getTimestamp() - oldData.getTimestamp();
        long minutes = timeDiff / (60 * 1000);

        Log.i(TAG, "Time difference: " + minutes + " minutes");

        // 檢查資料是否過期（超過 30 分鐘）
        long expiryTime = 30 * 60 * 1000;
        boolean isExpired = (now - oldData.getTimestamp()) > expiryTime;

        Log.i(TAG, "Old data expired: " + isExpired);
    }

    /**
     * 獲取類型字串
     */
    private static String getTypeString(int type) {
        switch (type) {
            case CustomData.TYPE_STRING:
                return "STRING";
            case CustomData.TYPE_INTEGER:
                return "INTEGER";
            case CustomData.TYPE_FLOAT:
                return "FLOAT";
            case CustomData.TYPE_BOOLEAN:
                return "BOOLEAN";
            default:
                return "UNKNOWN";
        }
    }

    /**
     * 主測試方法
     */
    public static void runAllExamples() {
        Log.i(TAG, "========== Running All CustomData Examples ==========");

        example1_BasicUsage();
        example2_DataTypes();
        example3_Parcelable();
        example4_SensorDataEncapsulation();
        example5_SystemConfiguration();
        example6_DataValidationAndConversion();
        example7_BatchDataProcessing();
        example8_TimestampUsage();

        Log.i(TAG, "========== All Examples Completed ==========");
    }
}
