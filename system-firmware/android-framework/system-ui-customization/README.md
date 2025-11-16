# System UI 客製化範例 (System UI Customization)

> Android 系統界面客製化完整指南與範例

## 專案概述

本專案展示如何客製化 Android System UI，包含狀態欄、導航欄、快速設定、鎖屏界面等系統界面組件的修改和擴展。

## 功能特性

- ✅ 狀態欄 (StatusBar) 客製化
- ✅ 導航欄 (NavigationBar) 修改
- ✅ 快速設定面板 (Quick Settings) 擴展
- ✅ 鎖屏界面 (LockScreen) 美化
- ✅ 通知系統客製化
- ✅ 音量面板修改
- ✅ 電源選單客製化
- ✅ 主題與樣式系統

## 架構設計

```
System UI 架構
┌──────────────────────────────────────────┐
│   SystemUIApplication                     │
│  ┌────────────────────────────────────┐  │
│  │   Dependency Injection             │  │
│  │   Component Management             │  │
│  └────────────────────────────────────┘  │
└──────────────────┬───────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐  ┌─────▼──────┐  ┌───▼────────┐
│StatusBar│  │NavigationBar│  │Quick Settings│
│Fragment │  │  Fragment  │  │   Panel    │
└─────────┘  └────────────┘  └────────────┘
```

## 目錄結構

```
system-ui-customization/
├── README.md
├── statusbar/                    # 狀態欄客製化
│   ├── CustomStatusBar.java
│   ├── StatusBarIconController.java
│   ├── BatteryMeterView.java
│   └── ClockView.java
├── navigationbar/                # 導航欄客製化
│   ├── CustomNavigationBar.java
│   ├── NavigationBarInflater.java
│   └── GestureHandler.java
├── quicksettings/                # 快速設定客製化
│   ├── CustomTile.java
│   ├── ScreenshotTile.java
│   ├── ScreenRecorderTile.java
│   └── CaffeineTile.java
├── lockscreen/                   # 鎖屏客製化
│   ├── CustomKeyguardView.java
│   ├── LockScreenWidget.java
│   └── AODCustomization.java
└── docs/
    ├── customization-guide.md
    ├── theming.md
    └── best-practices.md
```

## 狀態欄客製化

### CustomStatusBar.java

```java
package com.android.systemui.statusbar;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.android.systemui.R;

/**
 * 自定義狀態欄
 *
 * 擴展標準狀態欄，添加自定義功能
 */
public class CustomStatusBar extends LinearLayout {
    private TextView mClockView;
    private BatteryMeterView mBatteryView;
    private View mNetworkIndicator;

    public CustomStatusBar(Context context) {
        this(context, null);
    }

    public CustomStatusBar(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public CustomStatusBar(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
    }

    @Override
    protected void onFinishInflate() {
        super.onFinishInflate();

        mClockView = findViewById(R.id.clock);
        mBatteryView = findViewById(R.id.battery);
        mNetworkIndicator = findViewById(R.id.network_indicator);

        customizeViews();
    }

    /**
     * 客製化視圖
     */
    private void customizeViews() {
        // 客製化時鐘顯示
        if (mClockView != null) {
            mClockView.setTextSize(14);
            // 可以修改時間格式、字體等
        }

        // 客製化電池顯示
        if (mBatteryView != null) {
            mBatteryView.setShowPercentage(true);
            mBatteryView.setChargingColor(0xFF00FF00);
        }
    }

    /**
     * 更新狀態欄主題
     */
    public void updateTheme(boolean isDark) {
        if (isDark) {
            setBackgroundColor(0xFF000000);
            mClockView.setTextColor(0xFFFFFFFF);
        } else {
            setBackgroundColor(0xFFFFFFFF);
            mClockView.setTextColor(0xFF000000);
        }
    }
}
```

### BatteryMeterView.java

```java
package com.android.systemui.statusbar;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;

/**
 * 自定義電池圖示
 */
public class BatteryMeterView extends View {
    private Paint mFramePaint;
    private Paint mLevelPaint;
    private Paint mTextPaint;

    private int mLevel = 100;
    private boolean mCharging = false;
    private boolean mShowPercentage = true;

    private RectF mFrame = new RectF();
    private RectF mLevel = new RectF();

    public BatteryMeterView(Context context) {
        this(context, null);
    }

    public BatteryMeterView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        mFramePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        mFramePaint.setStyle(Paint.Style.STROKE);
        mFramePaint.setStrokeWidth(2f);

        mLevelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        mLevelPaint.setStyle(Paint.Style.FILL);

        mTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        mTextPaint.setTextSize(12f);
        mTextPaint.setTextAlign(Paint.Align.CENTER);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        // 繪製電池框
        drawBatteryFrame(canvas);

        // 繪製電池電量
        drawBatteryLevel(canvas);

        // 繪製百分比文字
        if (mShowPercentage) {
            drawPercentage(canvas);
        }
    }

    private void drawBatteryFrame(Canvas canvas) {
        float width = getWidth();
        float height = getHeight();

        mFrame.set(2, 2, width - 2, height - 2);
        mFramePaint.setColor(0xFF666666);
        canvas.drawRect(mFrame, mFramePaint);
    }

    private void drawBatteryLevel(Canvas canvas) {
        float width = getWidth();
        float height = getHeight();

        float levelWidth = (width - 4) * mLevel / 100f;

        mLevel.set(2, 2, 2 + levelWidth, height - 2);

        // 根據電量設置顏色
        int color;
        if (mCharging) {
            color = 0xFF00FF00; // 綠色 - 充電中
        } else if (mLevel <= 15) {
            color = 0xFFFF0000; // 紅色 - 低電量
        } else if (mLevel <= 30) {
            color = 0xFFFFAA00; // 橙色 - 中低電量
        } else {
            color = 0xFFFFFFFF; // 白色 - 正常
        }

        mLevelPaint.setColor(color);
        canvas.drawRect(mLevel, mLevelPaint);
    }

    private void drawPercentage(Canvas canvas) {
        String text = mLevel + "%";
        float x = getWidth() / 2f;
        float y = getHeight() / 2f + mTextPaint.getTextSize() / 3f;

        mTextPaint.setColor(0xFFFFFFFF);
        canvas.drawText(text, x, y, mTextPaint);
    }

    public void setLevel(int level) {
        mLevel = level;
        invalidate();
    }

    public void setCharging(boolean charging) {
        mCharging = charging;
        invalidate();
    }

    public void setShowPercentage(boolean show) {
        mShowPercentage = show;
        invalidate();
    }

    public void setChargingColor(int color) {
        // 可以自定義充電顏色
    }
}
```

## 快速設定擴展

### ScreenRecorderTile.java

```java
package com.android.systemui.qs.tiles;

import android.content.Intent;
import android.service.quicksettings.Tile;

import com.android.systemui.plugins.qs.QSTile;
import com.android.systemui.qs.QSHost;
import com.android.systemui.qs.tileimpl.QSTileImpl;

/**
 * 螢幕錄製快速設定磁貼
 */
public class ScreenRecorderTile extends QSTileImpl<QSTile.BooleanState> {
    private boolean mRecording = false;

    public ScreenRecorderTile(QSHost host) {
        super(host);
    }

    @Override
    public BooleanState newTileState() {
        return new BooleanState();
    }

    @Override
    protected void handleClick() {
        if (mRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    @Override
    protected void handleUpdateState(BooleanState state, Object arg) {
        state.value = mRecording;
        state.label = "螢幕錄製";
        state.icon = ResourceIcon.get(
            mRecording ? R.drawable.ic_screen_record_on
                      : R.drawable.ic_screen_record_off
        );
        state.state = mRecording ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE;
    }

    private void startRecording() {
        mRecording = true;
        refreshState();
        // 啟動螢幕錄製服務
        Intent intent = new Intent("com.android.systemui.ACTION_START_SCREEN_RECORD");
        mContext.startService(intent);
    }

    private void stopRecording() {
        mRecording = false;
        refreshState();
        // 停止螢幕錄製
        Intent intent = new Intent("com.android.systemui.ACTION_STOP_SCREEN_RECORD");
        mContext.startService(intent);
    }

    @Override
    public int getMetricsCategory() {
        return 0; // 自定義 metrics category
    }

    @Override
    public Intent getLongClickIntent() {
        // 長按進入設定
        return new Intent("com.android.settings.SCREEN_RECORD_SETTINGS");
    }

    @Override
    public CharSequence getTileLabel() {
        return "螢幕錄製";
    }
}
```

### CaffeineTile.java

```java
package com.android.systemui.qs.tiles;

import android.content.Context;
import android.os.PowerManager;
import android.service.quicksettings.Tile;

import com.android.systemui.plugins.qs.QSTile;
import com.android.systemui.qs.QSHost;
import com.android.systemui.qs.tileimpl.QSTileImpl;

/**
 * 咖啡因磁貼 - 保持螢幕常亮
 */
public class CaffeineTile extends QSTileImpl<QSTile.BooleanState> {
    private PowerManager.WakeLock mWakeLock;
    private boolean mActive = false;

    public CaffeineTile(QSHost host) {
        super(host);

        PowerManager pm = (PowerManager) mContext.getSystemService(Context.POWER_SERVICE);
        mWakeLock = pm.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ON_AFTER_RELEASE,
            "SystemUI:CaffeineTile"
        );
    }

    @Override
    public BooleanState newTileState() {
        return new BooleanState();
    }

    @Override
    protected void handleClick() {
        if (mActive) {
            deactivate();
        } else {
            activate();
        }
    }

    @Override
    protected void handleUpdateState(BooleanState state, Object arg) {
        state.value = mActive;
        state.label = "保持常亮";
        state.icon = ResourceIcon.get(
            mActive ? R.drawable.ic_caffeine_on
                   : R.drawable.ic_caffeine_off
        );
        state.state = mActive ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE;
    }

    private void activate() {
        if (!mWakeLock.isHeld()) {
            mWakeLock.acquire();
            mActive = true;
            refreshState();
        }
    }

    private void deactivate() {
        if (mWakeLock.isHeld()) {
            mWakeLock.release();
            mActive = false;
            refreshState();
        }
    }

    @Override
    protected void handleDestroy() {
        super.handleDestroy();
        if (mWakeLock.isHeld()) {
            mWakeLock.release();
        }
    }

    @Override
    public int getMetricsCategory() {
        return 0;
    }

    @Override
    public Intent getLongClickIntent() {
        return new Intent(android.provider.Settings.ACTION_DISPLAY_SETTINGS);
    }

    @Override
    public CharSequence getTileLabel() {
        return "保持常亮";
    }
}
```

## 導航欄客製化

### CustomNavigationBar.java

```java
package com.android.systemui.navigationbar;

import android.content.Context;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import android.widget.LinearLayout;

/**
 * 自定義導航欄
 */
public class CustomNavigationBar extends LinearLayout {
    private View mBackButton;
    private View mHomeButton;
    private View mRecentButton;

    private GestureDetector mGestureDetector;

    public CustomNavigationBar(Context context) {
        this(context, null);
    }

    public CustomNavigationBar(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        mGestureDetector = new GestureDetector(getContext(), new GestureListener());
    }

    @Override
    protected void onFinishInflate() {
        super.onFinishInflate();

        mBackButton = findViewById(R.id.back);
        mHomeButton = findViewById(R.id.home);
        mRecentButton = findViewById(R.id.recent);

        setupButtons();
    }

    private void setupButtons() {
        // 設置按鈕點擊事件
        if (mBackButton != null) {
            mBackButton.setOnClickListener(v -> performBack());
        }

        if (mHomeButton != null) {
            mHomeButton.setOnClickListener(v -> performHome());
            mHomeButton.setOnLongClickListener(v -> {
                performAssistant();
                return true;
            });
        }

        if (mRecentButton != null) {
            mRecentButton.setOnClickListener(v -> performRecents());
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return mGestureDetector.onTouchEvent(event) || super.onTouchEvent(event);
    }

    private void performBack() {
        // 執行返回操作
    }

    private void performHome() {
        // 執行回到主畫面
    }

    private void performRecents() {
        // 顯示最近使用的應用
    }

    private void performAssistant() {
        // 啟動語音助理
    }

    /**
     * 手勢監聽器
     */
    private class GestureListener extends GestureDetector.SimpleOnGestureListener {
        @Override
        public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
            // 處理滑動手勢
            float diffX = e2.getX() - e1.getX();
            float diffY = e2.getY() - e1.getY();

            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 100 && Math.abs(velocityX) > 100) {
                    if (diffX > 0) {
                        // 向右滑動
                        onSwipeRight();
                    } else {
                        // 向左滑動
                        onSwipeLeft();
                    }
                    return true;
                }
            } else {
                if (Math.abs(diffY) > 100 && Math.abs(velocityY) > 100) {
                    if (diffY > 0) {
                        // 向下滑動
                        onSwipeDown();
                    } else {
                        // 向上滑動
                        onSwipeUp();
                    }
                    return true;
                }
            }
            return false;
        }
    }

    private void onSwipeLeft() {
        // 向左滑動 - 切換到下一個應用
    }

    private void onSwipeRight() {
        // 向右滑動 - 返回上一個應用
    }

    private void onSwipeUp() {
        // 向上滑動 - 顯示最近使用
    }

    private void onSwipeDown() {
        // 向下滑動 - 顯示通知欄
    }
}
```

## 編譯配置

### Android.bp

```blueprint
android_app {
    name: "CustomSystemUI",
    overrides: ["SystemUI"],

    srcs: [
        "statusbar/**/*.java",
        "navigationbar/**/*.java",
        "quicksettings/**/*.java",
        "lockscreen/**/*.java",
    ],

    resource_dirs: ["res"],

    static_libs: [
        "SystemUI-core",
        "androidx.legacy_legacy-support-v4",
        "androidx.recyclerview_recyclerview",
        "androidx.preference_preference",
        "androidx.appcompat_appcompat",
        "androidx.cardview_cardview",
    ],

    libs: [
        "telephony-common",
        "services",
    ],

    platform_apis: true,
    system_ext_specific: true,
    certificate: "platform",
    privileged: true,

    optimize: {
        proguard_flags_files: ["proguard.flags"],
    },

    dex_preopt: {
        enabled: false,
    },
}
```

## 主題配置

### themes.xml

```xml
<resources>
    <!-- 亮色主題 -->
    <style name="Theme.SystemUI.Light" parent="@android:style/Theme.DeviceDefault.Light">
        <item name="android:statusBarColor">@android:color/white</item>
        <item name="android:navigationBarColor">@android:color/white</item>
        <item name="android:windowLightStatusBar">true</item>
        <item name="android:windowLightNavigationBar">true</item>
    </style>

    <!-- 暗色主題 -->
    <style name="Theme.SystemUI.Dark" parent="@android:style/Theme.DeviceDefault">
        <item name="android:statusBarColor">@android:color/black</item>
        <item name="android:navigationBarColor">@android:color/black</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowLightNavigationBar">false</item>
    </style>
</resources>
```

## 測試與驗證

```bash
# 編譯 SystemUI
m SystemUI

# 安裝到設備
adb root
adb remount
adb push out/target/product/*/system/priv-app/SystemUI/SystemUI.apk /system/priv-app/SystemUI/
adb reboot

# 查看日誌
adb logcat -s SystemUI:*
```

## 除錯技巧

```bash
# 重啟 SystemUI
adb shell killall com.android.systemui

# 清除 SystemUI 資料
adb shell pm clear com.android.systemui

# 查看 SystemUI 狀態
adb shell dumpsys activity com.android.systemui
```

---

**版本**: 1.0.0
**最後更新**: 2025-11-16
**相容性**: Android 10+
