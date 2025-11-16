import SwiftUI

struct EditTodoView: View {
    @Environment(\.dismiss) private var dismiss
    let todo: Todo
    let onSave: (Todo) -> Void

    @State private var title: String
    @State private var notes: String
    @State private var priority: Priority
    @State private var hasDueDate: Bool
    @State private var dueDate: Date

    init(todo: Todo, onSave: @escaping (Todo) -> Void) {
        self.todo = todo
        self.onSave = onSave

        _title = State(initialValue: todo.title)
        _notes = State(initialValue: todo.notes)
        _priority = State(initialValue: todo.priority)
        _hasDueDate = State(initialValue: todo.dueDate != nil)
        _dueDate = State(initialValue: todo.dueDate ?? Date())
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("基本資訊") {
                    TextField("標題", text: $title)
                        .autocorrectionDisabled()

                    TextField("備註（選填）", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                        .autocorrectionDisabled()
                }

                Section("優先級") {
                    Picker("優先級", selection: $priority) {
                        ForEach(Priority.allCases) { priority in
                            HStack {
                                Image(systemName: priority.icon)
                                Text(priority.rawValue)
                            }
                            .tag(priority)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section {
                    Toggle("設定到期日", isOn: $hasDueDate.animation())

                    if hasDueDate {
                        DatePicker(
                            "到期日",
                            selection: $dueDate,
                            displayedComponents: [.date, .hourAndMinute]
                        )
                    }
                } header: {
                    Text("到期日")
                } footer: {
                    if hasDueDate {
                        Text("將在到期時收到提醒")
                    }
                }

                Section("狀態") {
                    HStack {
                        Text("完成狀態")
                        Spacer()
                        Text(todo.isCompleted ? "已完成" : "進行中")
                            .foregroundStyle(.secondary)
                    }

                    if let completedAt = todo.completedAt {
                        HStack {
                            Text("完成時間")
                            Spacer()
                            Text(completedAt, style: .date)
                                .foregroundStyle(.secondary)
                        }
                    }

                    HStack {
                        Text("創建時間")
                        Spacer()
                        Text(todo.createdAt, style: .date)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("編輯待辦事項")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("儲存") {
                        saveTodo()
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private func saveTodo() {
        var updatedTodo = todo
        updatedTodo.title = title.trimmingCharacters(in: .whitespacesAndNewlines)
        updatedTodo.notes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        updatedTodo.priority = priority
        updatedTodo.dueDate = hasDueDate ? dueDate : nil

        onSave(updatedTodo)
        dismiss()
    }
}

#Preview {
    EditTodoView(
        todo: Todo(
            title: "測試待辦事項",
            notes: "這是備註",
            priority: .high,
            dueDate: Date()
        ),
        onSave: { _ in }
    )
}
