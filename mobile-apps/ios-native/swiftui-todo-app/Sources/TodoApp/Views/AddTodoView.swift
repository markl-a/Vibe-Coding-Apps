import SwiftUI

struct AddTodoView: View {
    @Environment(\.dismiss) private var dismiss
    let onAdd: (Todo) -> Void

    @State private var title = ""
    @State private var notes = ""
    @State private var priority: Priority = .medium
    @State private var hasDueDate = false
    @State private var dueDate = Date()

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
                            in: Date()...,
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
            }
            .navigationTitle("新增待辦事項")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("新增") {
                        addTodo()
                    }
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private func addTodo() {
        let newTodo = Todo(
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            notes: notes.trimmingCharacters(in: .whitespacesAndNewlines),
            priority: priority,
            dueDate: hasDueDate ? dueDate : nil
        )

        onAdd(newTodo)
        dismiss()
    }
}

#Preview {
    AddTodoView { _ in }
}
