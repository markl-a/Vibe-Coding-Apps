import Foundation
import SwiftUI

@Observable
class TodoViewModel {
    var todos: [Todo] = []
    var searchText: String = ""
    var filterOption: FilterOption = .all

    private let persistenceService = PersistenceService()

    init() {
        loadTodos()
    }

    // MARK: - Computed Properties

    var filteredTodos: [Todo] {
        var result = todos

        // 篩選
        switch filterOption {
        case .all:
            break
        case .active:
            result = result.filter { !$0.isCompleted }
        case .completed:
            result = result.filter { $0.isCompleted }
        case .overdue:
            result = result.filter { $0.isOverdue }
        }

        // 搜尋
        if !searchText.isEmpty {
            result = result.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                $0.notes.localizedCaseInsensitiveContains(searchText)
            }
        }

        // 排序：未完成在前，已完成在後
        return result.sorted { todo1, todo2 in
            if todo1.isCompleted != todo2.isCompleted {
                return !todo1.isCompleted
            }
            // 相同完成狀態時，按優先級排序
            if todo1.priority != todo2.priority {
                return todo1.priority.rawValue > todo2.priority.rawValue
            }
            // 優先級相同時，按創建時間排序
            return todo1.createdAt > todo2.createdAt
        }
    }

    var stats: TodoStats {
        let total = todos.count
        let completed = todos.filter { $0.isCompleted }.count
        let percentage = total > 0 ? Double(completed) / Double(total) * 100 : 0
        let todayCount = todos.filter { todo in
            guard let dueDate = todo.dueDate else { return false }
            return Calendar.current.isDateInToday(dueDate) && !todo.isCompleted
        }.count
        let overdueCount = todos.filter { $0.isOverdue }.count

        return TodoStats(
            total: total,
            completed: completed,
            percentage: percentage,
            today: todayCount,
            overdue: overdueCount
        )
    }

    // MARK: - CRUD Operations

    func addTodo(_ todo: Todo) {
        withAnimation {
            todos.append(todo)
            saveTodos()
        }
    }

    func updateTodo(_ todo: Todo) {
        if let index = todos.firstIndex(where: { $0.id == todo.id }) {
            withAnimation {
                todos[index] = todo
                saveTodos()
            }
        }
    }

    func toggleComplete(_ todo: Todo) {
        if let index = todos.firstIndex(where: { $0.id == todo.id }) {
            withAnimation {
                todos[index].isCompleted.toggle()
                todos[index].completedAt = todos[index].isCompleted ? Date() : nil
                saveTodos()
            }
        }
    }

    func deleteTodos(at offsets: IndexSet) {
        let todosToDelete = offsets.map { filteredTodos[$0] }
        withAnimation {
            todos.removeAll { todo in
                todosToDelete.contains(where: { $0.id == todo.id })
            }
            saveTodos()
        }
    }

    func deleteAllCompleted() {
        withAnimation {
            todos.removeAll { $0.isCompleted }
            saveTodos()
        }
    }

    // MARK: - Persistence

    private func saveTodos() {
        persistenceService.save(todos)
    }

    private func loadTodos() {
        todos = persistenceService.load()
    }
}

// MARK: - Supporting Types

enum FilterOption: String, CaseIterable, Identifiable {
    case all = "全部"
    case active = "進行中"
    case completed = "已完成"
    case overdue = "逾期"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .all:
            return "list.bullet"
        case .active:
            return "circle"
        case .completed:
            return "checkmark.circle.fill"
        case .overdue:
            return "exclamationmark.triangle.fill"
        }
    }
}

struct TodoStats {
    let total: Int
    let completed: Int
    let percentage: Double
    let today: Int
    let overdue: Int
}
