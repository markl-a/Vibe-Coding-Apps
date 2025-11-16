package com.vibeapps.todoapp

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * 應用程式類別
 * 使用 @HiltAndroidApp 啟用 Hilt 依賴注入
 */
@HiltAndroidApp
class TodoApplication : Application()
