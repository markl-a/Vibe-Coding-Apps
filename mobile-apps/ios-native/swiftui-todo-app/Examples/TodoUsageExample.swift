import Foundation
import SwiftUI

/// SwiftUI Todo App 使用範例
///
/// 這個範例展示如何:
/// 1. 創建待辦事項
/// 2. 使用 ViewModel
/// 3. 數據持久化
/// 4. 狀態管理
/// 5. SwiftUI 最佳實踐

// MARK: - 測試數據

struct TodoTestData {
    /// 創建範例待辦事項
    static func createSampleTodo() -> Todo {
        Todo(
            title: "完成專案報告",
            notes: "需要包含圖表和分析",
            dueDate: Date().addingTimeInterval(86400 * 3), // 3天後
            priority: .high,
            category: "工作"
        )
    }

    /// 創建多個範例待辦事項
    static func createSampleTodos() -> [Todo] {
        [
            Todo(
                title: "購買日用品",
                notes: "牛奶、雞蛋、麵包、水果",
                dueDate: Date().addingTimeInterval(86400), // 明天
                priority: .low,
                category: "購物"
            ),
            Todo(
                title: "準備會議簡報",
                notes: "包含上季度業績分析",
                dueDate: Date().addingTimeInterval(86400 * 2),
                priority: .high,
                category: "工作"
            ),
            Todo(
                title: "健身房運動",
                notes: "重訓 + 有氧 1小時",
                dueDate: Date().addingTimeInterval(3600 * 18), // 今天晚上
                priority: .medium,
                category: "健康"
            ),
            Todo(
                title: "讀書",
                notes: "閱讀 Swift 進階教程",
                dueDate: Date().addingTimeInterval(86400 * 7), // 一週後
                priority: .medium,
                category: "學習"
            ),
            Todo(
                title: "繳交帳單",
                notes: "電費、水費、網路費",
                dueDate: Date().addingTimeInterval(86400 * 5),
                priority: .high,
                category: "財務"
            ),
        ]
    }
}

// MARK: - 使用範例

/// ViewModel 使用範例
class TodoUsageExample {
    let viewModel: TodoViewModel

    init(viewModel: TodoViewModel) {
        self.viewModel = viewModel
    }

    /// 範例 1: 添加待辦事項
    func example1_addTodo() {
        let todo = Todo(
            title: "新的待辦事項",
            notes: "這是描述",
            dueDate: Date(),
            priority: .medium,
            category: "一般"
        )
        viewModel.addTodo(todo)
        print("✅ 已添加: \(todo.title)")
    }

    /// 範例 2: 完成待辦事項
    func example2_completeTodo() {
        guard let firstTodo = viewModel.todos.first else { return }
        viewModel.toggleCompletion(firstTodo)
        print("✓ 已完成: \(firstTodo.title)")
    }

    /// 範例 3: 刪除待辦事項
    func example3_deleteTodo() {
        guard let firstTodo = viewModel.todos.first else { return }
        viewModel.deleteTodo(firstTodo)
        print("🗑️ 已刪除: \(firstTodo.title)")
    }

    /// 範例 4: 更新待辦事項
    func example4_updateTodo() {
        guard var firstTodo = viewModel.todos.first else { return }
        firstTodo.title = "更新後的標題"
        firstTodo.priority = .high
        viewModel.updateTodo(firstTodo)
        print("📝 已更新: \(firstTodo.title)")
    }

    /// 範例 5: 篩選待辦事項
    func example5_filterTodos() {
        let highPriorityTodos = viewModel.todos.filter { $0.priority == .high }
        print("🔥 高優先級待辦事項: \(highPriorityTodos.count) 個")

        let completedTodos = viewModel.todos.filter { $0.isCompleted }
        print("✅ 已完成: \(completedTodos.count) 個")

        let pendingTodos = viewModel.todos.filter { !$0.isCompleted }
        print("⏳ 待處理: \(pendingTodos.count) 個")
    }

    /// 範例 6: 統計分析
    func example6_statistics() {
        let total = viewModel.todos.count
        let completed = viewModel.todos.filter { $0.isCompleted }.count
        let pending = total - completed
        let completionRate = total > 0 ? Double(completed) / Double(total) * 100 : 0

        print("""
        📊 統計數據:
        - 總計: \(total)
        - 已完成: \(completed)
        - 待處理: \(pending)
        - 完成率: \(String(format: "%.1f", completionRate))%
        """)
    }

    /// 範例 7: 按分類分組
    func example7_groupByCategory() {
        let grouped = Dictionary(grouping: viewModel.todos) { $0.category }

        print("📁 按分類分組:")
        for (category, todos) in grouped.sorted(by: { $0.key < $1.key }) {
            print("  \(category): \(todos.count) 個")
        }
    }
}

// MARK: - SwiftUI View 範例

/// 自定義待辦事項卡片範例
struct CustomTodoCard: View {
    let todo: Todo
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // 完成狀態按鈕
            Button(action: onToggle) {
                Image(systemName: todo.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundColor(todo.isCompleted ? .green : .gray)
            }

            VStack(alignment: .leading, spacing: 4) {
                // 標題
                Text(todo.title)
                    .font(.headline)
                    .strikethrough(todo.isCompleted)
                    .foregroundColor(todo.isCompleted ? .gray : .primary)

                // 備註
                if let notes = todo.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }

                // 詳細信息
                HStack(spacing: 8) {
                    // 分類
                    Label(todo.category, systemImage: "folder")
                        .font(.caption2)
                        .foregroundColor(.blue)

                    // 優先級
                    Label(priorityText(todo.priority), systemImage: priorityIcon(todo.priority))
                        .font(.caption2)
                        .foregroundColor(priorityColor(todo.priority))

                    // 到期日
                    if let dueDate = todo.dueDate {
                        Label(formatDate(dueDate), systemImage: "calendar")
                            .font(.caption2)
                            .foregroundColor(isOverdue(dueDate) ? .red : .orange)
                    }
                }
            }

            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // 輔助函數
    private func priorityText(_ priority: TodoPriority) -> String {
        switch priority {
        case .low: return "低"
        case .medium: return "中"
        case .high: return "高"
        }
    }

    private func priorityIcon(_ priority: TodoPriority) -> String {
        switch priority {
        case .low: return "arrow.down"
        case .medium: return "equal"
        case .high: return "arrow.up"
        }
    }

    private func priorityColor(_ priority: TodoPriority) -> Color {
        switch priority {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MM/dd"
        return formatter.string(from: date)
    }

    private func isOverdue(_ date: Date) -> Bool {
        return date < Date()
    }
}

/// 統計儀表板範例
struct StatsDashboard: View {
    let todos: [Todo]

    var body: some View {
        VStack(spacing: 16) {
            Text("統計總覽")
                .font(.title2)
                .fontWeight(.bold)

            HStack(spacing: 16) {
                StatCard(
                    title: "總計",
                    value: "\(todos.count)",
                    icon: "list.bullet",
                    color: .blue
                )

                StatCard(
                    title: "已完成",
                    value: "\(completedCount)",
                    icon: "checkmark.circle",
                    color: .green
                )

                StatCard(
                    title: "待處理",
                    value: "\(pendingCount)",
                    icon: "clock",
                    color: .orange
                )
            }

            // 完成率進度條
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("完成率")
                        .font(.headline)
                    Spacer()
                    Text("\(Int(completionRate))%")
                        .font(.headline)
                        .foregroundColor(.green)
                }

                ProgressView(value: completionRate / 100)
                    .progressViewStyle(.linear)
                    .tint(.green)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
        .padding()
    }

    private var completedCount: Int {
        todos.filter { $0.isCompleted }.count
    }

    private var pendingCount: Int {
        todos.count - completedCount
    }

    private var completionRate: Double {
        guard todos.count > 0 else { return 0 }
        return Double(completedCount) / Double(todos.count) * 100
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title)
                .foregroundColor(color)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - 使用說明

/*
 💡 如何使用這些範例:

 1. 在 ViewModel 中添加測試數據:
 ```swift
 let sampleTodos = TodoTestData.createSampleTodos()
 sampleTodos.forEach { viewModel.addTodo($0) }
 ```

 2. 在 View 中使用自定義卡片:
 ```swift
 ForEach(viewModel.todos) { todo in
     CustomTodoCard(todo: todo) {
         viewModel.toggleCompletion(todo)
     }
 }
 ```

 3. 顯示統計儀表板:
 ```swift
 StatsDashboard(todos: viewModel.todos)
 ```

 4. 執行範例操作:
 ```swift
 let example = TodoUsageExample(viewModel: viewModel)
 example.example1_addTodo()
 example.example6_statistics()
 ```

 5. 篩選和排序:
 ```swift
 let highPriority = viewModel.todos.filter { $0.priority == .high }
 let sorted = viewModel.todos.sorted { $0.dueDate ?? Date.distantFuture < $1.dueDate ?? Date.distantFuture }
 ```
 */
