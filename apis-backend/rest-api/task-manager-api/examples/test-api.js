/**
 * Task Manager API 測試腳本
 * 演示任務管理系統的完整功能
 *
 * 使用方式: node examples/test-api.js
 */

const BASE_URL = 'http://localhost:3000/api';

let token = '';
let userId = '';
let taskIds = [];

async function request(method, path, data = null, authToken = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const json = await response.json();
    return { status: response.status, data: json };
  } catch (error) {
    console.error('請求失敗:', error.message);
    return { status: 500, data: { error: error.message } };
  }
}

async function runTests() {
  console.log('📋 Task Manager API 測試\n');

  try {
    // 1. 用戶註冊
    console.log('1️⃣  用戶註冊');
    const registerResult = await request('POST', '/auth/register', {
      name: '任務管理員',
      email: `taskmaster${Date.now()}@example.com`,
      password: 'TaskPass123',
    });
    console.log('✅ 註冊成功:', registerResult.data);
    userId = registerResult.data.user?.id || registerResult.data.userId;
    console.log('');

    // 2. 用戶登入
    console.log('2️⃣  用戶登入');
    const loginResult = await request('POST', '/auth/login', {
      email: registerResult.data.user?.email || registerResult.data.email,
      password: 'TaskPass123',
    });
    console.log('✅ 登入成功');
    token = loginResult.data.token;
    console.log('Token:', token.substring(0, 30) + '...');
    console.log('');

    // 3. 創建任務 - 高優先級
    console.log('3️⃣  創建任務（高優先級）');
    const task1Result = await request('POST', '/tasks', {
      title: '完成專案提案',
      description: '準備下季度的新專案提案，包含預算和時程規劃',
      priority: 'high',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['工作', '重要'],
    }, token);
    console.log('✅ 任務已創建:', task1Result.data);
    taskIds.push(task1Result.data.id || task1Result.data._id);
    console.log('');

    // 4. 創建任務 - 中優先級
    console.log('4️⃣  創建任務（中優先級）');
    const task2Result = await request('POST', '/tasks', {
      title: '更新文檔',
      description: '更新 API 文檔和使用指南',
      priority: 'medium',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['文檔', '開發'],
    }, token);
    console.log('✅ 任務已創建:', task2Result.data);
    taskIds.push(task2Result.data.id || task2Result.data._id);
    console.log('');

    // 5. 創建任務 - 低優先級
    console.log('5️⃣  創建任務（低優先級）');
    const task3Result = await request('POST', '/tasks', {
      title: '整理桌面',
      description: '清理工作區域，整理文件',
      priority: 'low',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['個人', '整理'],
    }, token);
    console.log('✅ 任務已創建:', task3Result.data);
    taskIds.push(task3Result.data.id || task3Result.data._id);
    console.log('');

    // 6. 獲取所有任務
    console.log('6️⃣  獲取所有任務');
    const allTasksResult = await request('GET', '/tasks', null, token);
    console.log('✅ 任務列表:', {
      total: allTasksResult.data.length || allTasksResult.data.tasks?.length || 0,
      tasks: allTasksResult.data.slice(0, 2),
    });
    console.log('');

    // 7. 按優先級篩選
    console.log('7️⃣  按優先級篩選（高優先級）');
    const highPriorityResult = await request('GET', '/tasks?priority=high', null, token);
    console.log('✅ 高優先級任務:', highPriorityResult.data.length || 0, '個');
    console.log('');

    // 8. 按狀態篩選
    console.log('8️⃣  按狀態篩選（待處理）');
    const pendingTasksResult = await request('GET', '/tasks?status=pending', null, token);
    console.log('✅ 待處理任務:', pendingTasksResult.data.length || 0, '個');
    console.log('');

    // 9. 更新任務狀態
    console.log('9️⃣  更新任務狀態（標記為進行中）');
    if (taskIds[0]) {
      const updateStatusResult = await request('PUT', `/tasks/${taskIds[0]}`, {
        status: 'in-progress',
      }, token);
      console.log('✅ 任務狀態已更新:', updateStatusResult.data);
    }
    console.log('');

    // 10. 更新任務內容
    console.log('🔟 更新任務內容');
    if (taskIds[0]) {
      const updateTaskResult = await request('PUT', `/tasks/${taskIds[0]}`, {
        title: '完成專案提案（已開始）',
        description: '準備下季度的新專案提案，包含預算和時程規劃。目前進度：30%',
        progress: 30,
      }, token);
      console.log('✅ 任務已更新:', updateTaskResult.data);
    }
    console.log('');

    // 11. 完成任務
    console.log('1️⃣1️⃣  完成任務');
    if (taskIds[2]) {
      const completeResult = await request('PUT', `/tasks/${taskIds[2]}`, {
        status: 'completed',
      }, token);
      console.log('✅ 任務已完成:', completeResult.data);
    }
    console.log('');

    // 12. 獲取已完成任務
    console.log('1️⃣2️⃣  獲取已完成任務');
    const completedResult = await request('GET', '/tasks?status=completed', null, token);
    console.log('✅ 已完成任務:', completedResult.data.length || 0, '個');
    console.log('');

    // 13. 按標籤搜尋
    console.log('1️⃣3️⃣  按標籤搜尋（工作）');
    const tagSearchResult = await request('GET', '/tasks?tags=工作', null, token);
    console.log('✅ 標籤「工作」的任務:', tagSearchResult.data.length || 0, '個');
    console.log('');

    // 14. 獲取即將到期的任務
    console.log('1️⃣4️⃣  獲取即將到期的任務（7天內）');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    const dueSoonResult = await request('GET', `/tasks?dueBefore=${dueDate.toISOString()}`, null, token);
    console.log('✅ 即將到期任務:', dueSoonResult.data.length || 0, '個');
    console.log('');

    // 15. 刪除任務
    console.log('1️⃣5️⃣  刪除任務');
    if (taskIds[2]) {
      const deleteResult = await request('DELETE', `/tasks/${taskIds[2]}`, null, token);
      console.log('✅ 任務已刪除');
    }
    console.log('');

    // 測試摘要
    console.log('🎉 測試完成！');
    console.log('\n📊 測試摘要:');
    console.log('  - 用戶 ID:', userId);
    console.log('  - 創建的任務數:', taskIds.length);
    console.log('  - 任務 IDs:', taskIds);
    console.log('\n💡 提示: 訪問 http://localhost:3000 查看 API');

  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

// 執行測試
runTests();
