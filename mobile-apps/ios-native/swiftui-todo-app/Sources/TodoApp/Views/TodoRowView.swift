import SwiftUI

struct TodoRowView: View {
    let todo: Todo
    let onToggle: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // 完成按鈕
            Button(action: onToggle) {
                Image(systemName: todo.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(todo.isCompleted ? .green : .gray)
                    .symbolEffect(.bounce, value: todo.isCompleted)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 4) {
                // 標題
                Text(todo.title)
                    .font(.body)
                    .fontWeight(.medium)
                    .strikethrough(todo.isCompleted, color: .gray)
                    .foregroundStyle(todo.isCompleted ? .secondary : .primary)

                // 備註
                if !todo.notes.isEmpty {
                    Text(todo.notes)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                // 底部資訊
                HStack(spacing: 8) {
                    // 優先級
                    HStack(spacing: 4) {
                        Image(systemName: todo.priority.icon)
                            .font(.caption2)
                        Text(todo.priority.rawValue)
                            .font(.caption2)
                            .fontWeight(.semibold)
                    }
                    .foregroundStyle(todo.priority.color)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(todo.priority.color.opacity(0.15))
                    .clipShape(Capsule())

                    // 到期日
                    if let dueDateText = todo.dueDateText {
                        HStack(spacing: 4) {
                            Image(systemName: todo.isOverdue ? "exclamationmark.triangle.fill" : "calendar")
                                .font(.caption2)
                            Text(dueDateText)
                                .font(.caption2)
                        }
                        .foregroundStyle(todo.isOverdue ? .red : .secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            (todo.isOverdue ? Color.red : Color.gray)
                                .opacity(0.15)
                        )
                        .clipShape(Capsule())
                    }

                    Spacer()
                }
                .padding(.top, 4)
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}

#Preview {
    List {
        TodoRowView(
            todo: Todo(
                title: "完成專案文檔",
                notes: "撰寫 README 和 API 文檔",
                priority: .high,
                dueDate: Date()
            ),
            onToggle: {}
        )

        TodoRowView(
            todo: Todo(
                title: "已完成的待辦事項",
                notes: "這個已經完成了",
                isCompleted: true,
                priority: .medium
            ),
            onToggle: {}
        )

        TodoRowView(
            todo: Todo(
                title: "逾期的待辦事項",
                notes: "這個已經逾期了",
                priority: .low,
                dueDate: Calendar.current.date(byAdding: .day, value: -2, to: Date())
            ),
            onToggle: {}
        )
    }
}
