/**
 * 定時任務函數
 * 使用 Cloud Scheduler 定期執行
 */

const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

const db = new Firestore();
const storage = new Storage();

/**
 * 每日清理任務
 * 清理過期數據、臨時文件等
 */
exports.dailyCleanup = async (message, context) => {
  console.log('Starting daily cleanup task');

  try {
    const stats = {
      expiredSessions: 0,
      oldLogs: 0,
      tempFiles: 0,
      inactiveUsers: 0
    };

    // 1. 清理過期的 session
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const expiredSessions = await db.collection('sessions')
      .where('expiresAt', '<', sevenDaysAgo.toISOString())
      .get();

    if (!expiredSessions.empty) {
      const batch = db.batch();
      expiredSessions.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      stats.expiredSessions = expiredSessions.size;
    }

    // 2. 刪除 30 天前的日誌
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldLogs = await db.collection('logs')
      .where('timestamp', '<', thirtyDaysAgo.toISOString())
      .get();

    if (!oldLogs.empty) {
      const batch = db.batch();
      oldLogs.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      stats.oldLogs = oldLogs.size;
    }

    // 3. 清理臨時文件
    const tempBucket = storage.bucket('temp-files');
    const [files] = await tempBucket.getFiles({
      prefix: 'temp/'
    });

    const deletePromises = files
      .filter(file => {
        const created = new Date(file.metadata.timeCreated);
        const daysSinceCreation = (Date.now() - created) / (1000 * 60 * 60 * 24);
        return daysSinceCreation > 1; // 刪除超過 1 天的臨時文件
      })
      .map(file => file.delete());

    stats.tempFiles = deletePromises.length;
    await Promise.all(deletePromises);

    // 4. 標記不活躍用戶
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const inactiveUsers = await db.collection('users')
      .where('lastActiveAt', '<', ninetyDaysAgo.toISOString())
      .where('status', '==', 'active')
      .get();

    if (!inactiveUsers.empty) {
      const batch = db.batch();
      inactiveUsers.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'inactive',
          inactiveSince: new Date().toISOString()
        });
      });
      await batch.commit();
      stats.inactiveUsers = inactiveUsers.size;
    }

    console.log('Daily cleanup completed:', stats);

    // 記錄清理統計
    await db.collection('cleanupLogs').add({
      type: 'daily_cleanup',
      stats,
      executedAt: new Date().toISOString()
    });

    return stats;
  } catch (error) {
    console.error('Daily cleanup error:', error);
    throw error;
  }
};

/**
 * 每小時報告生成
 * 生成系統狀態報告
 */
exports.hourlyReport = async (message, context) => {
  console.log('Generating hourly report');

  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 收集統計數據
    const stats = await Promise.all([
      // 新用戶數
      db.collection('users')
        .where('createdAt', '>=', oneHourAgo.toISOString())
        .count()
        .get(),

      // 新文章數
      db.collection('posts')
        .where('createdAt', '>=', oneHourAgo.toISOString())
        .count()
        .get(),

      // 錯誤數
      db.collection('logs')
        .where('level', '==', 'error')
        .where('timestamp', '>=', oneHourAgo.toISOString())
        .count()
        .get(),

      // 活躍用戶數
      db.collection('sessions')
        .where('lastActiveAt', '>=', oneHourAgo.toISOString())
        .count()
        .get()
    ]);

    const report = {
      period: {
        start: oneHourAgo.toISOString(),
        end: now.toISOString()
      },
      metrics: {
        newUsers: stats[0].data().count,
        newPosts: stats[1].data().count,
        errors: stats[2].data().count,
        activeUsers: stats[3].data().count
      },
      generatedAt: now.toISOString()
    };

    console.log('Hourly report:', report);

    // 保存報告
    await db.collection('reports').add({
      type: 'hourly',
      ...report
    });

    // 如果錯誤數超過閾值，發送警報
    if (report.metrics.errors > 100) {
      const { PubSub } = require('@google-cloud/pubsub');
      const pubsub = new PubSub();

      await pubsub.topic('alerts').publishMessage({
        json: {
          type: 'high_error_rate',
          errorCount: report.metrics.errors,
          period: report.period
        }
      });

      console.log('High error rate alert sent');
    }

    return report;
  } catch (error) {
    console.error('Hourly report error:', error);
    throw error;
  }
};

/**
 * 每週備份
 * 備份重要數據
 */
exports.weeklyBackup = async (message, context) => {
  console.log('Starting weekly backup');

  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupBucket = storage.bucket('backups');

    // 備份用戶數據
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    await backupBucket
      .file(`users/users_${timestamp}.json`)
      .save(JSON.stringify(users, null, 2), {
        contentType: 'application/json',
        metadata: {
          backupDate: timestamp,
          recordCount: users.length
        }
      });

    console.log(`Backed up ${users.length} users`);

    // 備份配置
    const configSnapshot = await db.collection('config').get();
    const configs = configSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    await backupBucket
      .file(`config/config_${timestamp}.json`)
      .save(JSON.stringify(configs, null, 2), {
        contentType: 'application/json'
      });

    console.log('Weekly backup completed');

    // 記錄備份
    await db.collection('backupLogs').add({
      type: 'weekly',
      collections: ['users', 'config'],
      itemCounts: {
        users: users.length,
        config: configs.length
      },
      backupDate: timestamp,
      executedAt: new Date().toISOString()
    });

    return {
      success: true,
      backupDate: timestamp,
      itemCounts: {
        users: users.length,
        config: configs.length
      }
    };
  } catch (error) {
    console.error('Weekly backup error:', error);
    throw error;
  }
};

/**
 * 健康檢查任務
 * 檢查系統各組件的健康狀態
 */
exports.healthCheck = async (message, context) => {
  console.log('Running health check');

  try {
    const health = {
      database: 'unknown',
      storage: 'unknown',
      pubsub: 'unknown'
    };

    // 檢查 Firestore
    try {
      await db.collection('health').doc('check').set({
        timestamp: new Date().toISOString()
      });
      health.database = 'healthy';
    } catch (error) {
      health.database = 'unhealthy';
      console.error('Database check failed:', error);
    }

    // 檢查 Storage
    try {
      const bucket = storage.bucket('health-checks');
      await bucket.file('health.txt').save('OK', {
        metadata: { timestamp: new Date().toISOString() }
      });
      health.storage = 'healthy';
    } catch (error) {
      health.storage = 'unhealthy';
      console.error('Storage check failed:', error);
    }

    // 檢查 Pub/Sub
    try {
      const { PubSub } = require('@google-cloud/pubsub');
      const pubsub = new PubSub();
      await pubsub.topic('health-checks').publishMessage({
        json: { status: 'OK' }
      });
      health.pubsub = 'healthy';
    } catch (error) {
      health.pubsub = 'unhealthy';
      console.error('Pub/Sub check failed:', error);
    }

    const allHealthy = Object.values(health).every(status => status === 'healthy');

    console.log('Health check results:', health);

    // 記錄健康檢查
    await db.collection('healthLogs').add({
      ...health,
      overall: allHealthy ? 'healthy' : 'degraded',
      checkedAt: new Date().toISOString()
    });

    // 如果有組件不健康，發送警報
    if (!allHealthy) {
      const { PubSub } = require('@google-cloud/pubsub');
      const pubsub = new PubSub();

      await pubsub.topic('alerts').publishMessage({
        json: {
          type: 'health_check_failed',
          details: health
        }
      });

      console.log('Health check alert sent');
    }

    return health;
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

/**
 * 每月統計報告
 * 生成詳細的月度統計報告
 */
exports.monthlyReport = async (message, context) => {
  console.log('Generating monthly report');

  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 收集月度統計
    const monthlyStats = {
      period: {
        start: firstDayOfMonth.toISOString(),
        end: lastDayOfMonth.toISOString()
      },
      users: {
        total: 0,
        new: 0,
        active: 0
      },
      content: {
        posts: 0,
        comments: 0
      },
      system: {
        uptime: 0,
        errors: 0
      }
    };

    // 查詢統計數據
    const [totalUsers, newUsers, activePosts] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('users')
        .where('createdAt', '>=', firstDayOfMonth.toISOString())
        .count()
        .get(),
      db.collection('posts')
        .where('createdAt', '>=', firstDayOfMonth.toISOString())
        .count()
        .get()
    ]);

    monthlyStats.users.total = totalUsers.data().count;
    monthlyStats.users.new = newUsers.data().count;
    monthlyStats.content.posts = activePosts.data().count;

    console.log('Monthly report:', monthlyStats);

    // 保存報告
    await db.collection('reports').add({
      type: 'monthly',
      ...monthlyStats,
      generatedAt: new Date().toISOString()
    });

    // 發送郵件通知管理員
    const { PubSub } = require('@google-cloud/pubsub');
    const pubsub = new PubSub();

    await pubsub.topic('notifications').publishMessage({
      json: {
        type: 'email',
        recipient: process.env.ADMIN_EMAIL || 'admin@example.com',
        template: 'monthly-report',
        data: monthlyStats
      }
    });

    return monthlyStats;
  } catch (error) {
    console.error('Monthly report error:', error);
    throw error;
  }
};
