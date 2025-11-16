import Foundation

class PersistenceService {
    private let todosKey = "todos_storage_key"
    private let userDefaults = UserDefaults.standard

    /// 儲存待辦事項到 UserDefaults
    func save(_ todos: [Todo]) {
        do {
            let encoded = try JSONEncoder().encode(todos)
            userDefaults.set(encoded, forKey: todosKey)
        } catch {
            print("❌ 儲存待辦事項失敗: \(error.localizedDescription)")
        }
    }

    /// 從 UserDefaults 載入待辦事項
    func load() -> [Todo] {
        guard let data = userDefaults.data(forKey: todosKey) else {
            // 第一次使用，返回範例資料
            return createSampleTodos()
        }

        do {
            let todos = try JSONDecoder().decode([Todo].self, from: data)
            return todos
        } catch {
            print("❌ 載入待辦事項失敗: \(error.localizedDescription)")
            return []
        }
    }

    /// 清除所有資料
    func clearAll() {
        userDefaults.removeObject(forKey: todosKey)
    }

    // MARK: - Sample Data

    private func createSampleTodos() -> [Todo] {
        let calendar = Calendar.current
        let now = Date()

        return [
            Todo(
                title: "歡迎使用待辦事項應用",
                notes: "這是一個範例待辦事項，您可以編輯或刪除它",
                priority: .high,
                dueDate: calendar.date(byAdding: .day, value: 1, to: now)
            ),
            Todo(
                title: "點擊圓圈標記完成",
                notes: "試著將這個待辦事項標記為已完成",
                priority: .medium
            ),
            Todo(
                title: "滑動刪除待辦事項",
                notes: "向左滑動可以刪除不需要的待辦事項",
                priority: .low
            )
        ]
    }
}
