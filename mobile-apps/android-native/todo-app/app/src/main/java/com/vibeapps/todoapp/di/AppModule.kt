package com.vibeapps.todoapp.di

import android.content.Context
import androidx.room.Room
import com.vibeapps.todoapp.data.dao.TodoDao
import com.vibeapps.todoapp.data.database.TodoDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt 依賴注入模組
 * 提供應用程式級別的依賴項
 */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    /**
     * 提供 TodoDatabase 實例
     */
    @Provides
    @Singleton
    fun provideTodoDatabase(
        @ApplicationContext context: Context
    ): TodoDatabase {
        return Room.databaseBuilder(
            context,
            TodoDatabase::class.java,
            TodoDatabase.DATABASE_NAME
        )
            .fallbackToDestructiveMigration() // 開發階段使用，正式環境應使用 Migration
            .build()
    }

    /**
     * 提供 TodoDao 實例
     */
    @Provides
    fun provideTodoDao(database: TodoDatabase): TodoDao {
        return database.todoDao()
    }
}
