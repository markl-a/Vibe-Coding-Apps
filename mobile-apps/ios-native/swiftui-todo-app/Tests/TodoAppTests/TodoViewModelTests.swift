import XCTest
@testable import TodoApp

final class TodoViewModelTests: XCTestCase {
    var viewModel: TodoViewModel!

    override func setUp() {
        super.setUp()
        viewModel = TodoViewModel()
        // 清除現有資料以確保測試環境乾淨
        viewModel.todos.removeAll()
    }

    override func tearDown() {
        viewModel = nil
        super.tearDown()
    }

    // MARK: - Add Todo Tests

    func testAddTodo() {
        // Given
        let todo = Todo(title: "測試待辦")

        // When
        viewModel.addTodo(todo)

        // Then
        XCTAssertEqual(viewModel.todos.count, 1)
        XCTAssertEqual(viewModel.todos.first?.title, "測試待辦")
    }

    func testAddMultipleTodos() {
        // Given
        let todo1 = Todo(title: "待辦 1")
        let todo2 = Todo(title: "待辦 2")

        // When
        viewModel.addTodo(todo1)
        viewModel.addTodo(todo2)

        // Then
        XCTAssertEqual(viewModel.todos.count, 2)
    }

    // MARK: - Toggle Complete Tests

    func testToggleComplete() {
        // Given
        let todo = Todo(title: "測試待辦", isCompleted: false)
        viewModel.addTodo(todo)

        // When
        viewModel.toggleComplete(todo)

        // Then
        XCTAssertTrue(viewModel.todos.first?.isCompleted ?? false)
        XCTAssertNotNil(viewModel.todos.first?.completedAt)
    }

    func testToggleCompleteToIncomplete() {
        // Given
        var todo = Todo(title: "測試待辦", isCompleted: true)
        todo.completedAt = Date()
        viewModel.addTodo(todo)

        // When
        viewModel.toggleComplete(todo)

        // Then
        XCTAssertFalse(viewModel.todos.first?.isCompleted ?? true)
        XCTAssertNil(viewModel.todos.first?.completedAt)
    }

    // MARK: - Update Todo Tests

    func testUpdateTodo() {
        // Given
        let todo = Todo(title: "原始標題")
        viewModel.addTodo(todo)

        var updatedTodo = todo
        updatedTodo.title = "更新後的標題"

        // When
        viewModel.updateTodo(updatedTodo)

        // Then
        XCTAssertEqual(viewModel.todos.first?.title, "更新後的標題")
    }

    // MARK: - Delete Tests

    func testDeleteTodo() {
        // Given
        let todo = Todo(title: "測試待辦")
        viewModel.addTodo(todo)

        // When
        viewModel.deleteTodos(at: IndexSet(integer: 0))

        // Then
        XCTAssertEqual(viewModel.todos.count, 0)
    }

    func testDeleteAllCompleted() {
        // Given
        let todo1 = Todo(title: "待辦 1", isCompleted: true)
        let todo2 = Todo(title: "待辦 2", isCompleted: false)
        let todo3 = Todo(title: "待辦 3", isCompleted: true)

        viewModel.addTodo(todo1)
        viewModel.addTodo(todo2)
        viewModel.addTodo(todo3)

        // When
        viewModel.deleteAllCompleted()

        // Then
        XCTAssertEqual(viewModel.todos.count, 1)
        XCTAssertEqual(viewModel.todos.first?.title, "待辦 2")
    }

    // MARK: - Filter Tests

    func testFilterAll() {
        // Given
        let todo1 = Todo(title: "待辦 1", isCompleted: false)
        let todo2 = Todo(title: "待辦 2", isCompleted: true)

        viewModel.addTodo(todo1)
        viewModel.addTodo(todo2)
        viewModel.filterOption = .all

        // When
        let filtered = viewModel.filteredTodos

        // Then
        XCTAssertEqual(filtered.count, 2)
    }

    func testFilterActive() {
        // Given
        let todo1 = Todo(title: "待辦 1", isCompleted: false)
        let todo2 = Todo(title: "待辦 2", isCompleted: true)

        viewModel.addTodo(todo1)
        viewModel.addTodo(todo2)
        viewModel.filterOption = .active

        // When
        let filtered = viewModel.filteredTodos

        // Then
        XCTAssertEqual(filtered.count, 1)
        XCTAssertFalse(filtered.first?.isCompleted ?? true)
    }

    func testFilterCompleted() {
        // Given
        let todo1 = Todo(title: "待辦 1", isCompleted: false)
        let todo2 = Todo(title: "待辦 2", isCompleted: true)

        viewModel.addTodo(todo1)
        viewModel.addTodo(todo2)
        viewModel.filterOption = .completed

        // When
        let filtered = viewModel.filteredTodos

        // Then
        XCTAssertEqual(filtered.count, 1)
        XCTAssertTrue(filtered.first?.isCompleted ?? false)
    }

    // MARK: - Search Tests

    func testSearch() {
        // Given
        let todo1 = Todo(title: "購買雜貨")
        let todo2 = Todo(title: "完成報告")

        viewModel.addTodo(todo1)
        viewModel.addTodo(todo2)
        viewModel.searchText = "購買"

        // When
        let filtered = viewModel.filteredTodos

        // Then
        XCTAssertEqual(filtered.count, 1)
        XCTAssertEqual(filtered.first?.title, "購買雜貨")
    }

    func testSearchInNotes() {
        // Given
        let todo = Todo(title: "任務", notes: "重要的備註內容")

        viewModel.addTodo(todo)
        viewModel.searchText = "重要"

        // When
        let filtered = viewModel.filteredTodos

        // Then
        XCTAssertEqual(filtered.count, 1)
    }

    // MARK: - Stats Tests

    func testStats() {
        // Given
        let todo1 = Todo(title: "待辦 1", isCompleted: true)
        let todo2 = Todo(title: "待辦 2", isCompleted: true)
        let todo3 = Todo(title: "待辦 3", isCompleted: false)

        viewModel.addTodo(todo1)
        viewModel.addTodo(todo2)
        viewModel.addTodo(todo3)

        // When
        let stats = viewModel.stats

        // Then
        XCTAssertEqual(stats.total, 3)
        XCTAssertEqual(stats.completed, 2)
        XCTAssertEqual(stats.percentage, 66.66666666666667, accuracy: 0.01)
    }

    func testStatsWithEmptyTodos() {
        // When
        let stats = viewModel.stats

        // Then
        XCTAssertEqual(stats.total, 0)
        XCTAssertEqual(stats.completed, 0)
        XCTAssertEqual(stats.percentage, 0)
    }

    // MARK: - Overdue Tests

    func testOverdueTodo() {
        // Given
        let pastDate = Calendar.current.date(byAdding: .day, value: -2, to: Date())!
        let todo = Todo(title: "逾期待辦", isCompleted: false, dueDate: pastDate)

        // Then
        XCTAssertTrue(todo.isOverdue)
    }

    func testNotOverdueTodo() {
        // Given
        let futureDate = Calendar.current.date(byAdding: .day, value: 2, to: Date())!
        let todo = Todo(title: "未來待辦", isCompleted: false, dueDate: futureDate)

        // Then
        XCTAssertFalse(todo.isOverdue)
    }

    func testCompletedTodoNotOverdue() {
        // Given
        let pastDate = Calendar.current.date(byAdding: .day, value: -2, to: Date())!
        let todo = Todo(title: "已完成待辦", isCompleted: true, dueDate: pastDate)

        // Then
        XCTAssertFalse(todo.isOverdue)
    }
}
