import SwiftUI

/// AI 辅助的任务创建视图
struct AIAssistedAddTodoView: View {
    @Environment(\.dismiss) var dismiss
    let onSave: (Todo) -> Void

    @State private var title = ""
    @State private var notes = ""
    @State private var priority: Priority = .medium
    @State private var dueDate = Date()
    @State private var hasDueDate = false

    // AI 功能
    @State private var showingAISuggestions = false
    @State private var aiDescriptionSuggestions: [String] = []
    @State private var aiDateSuggestion: DateSuggestion?
    @State private var aiDetectedCategory: TaskCategory = .personal

    var body: some View {
        NavigationStack {
            Form {
                // 基本信息
                Section {
                    TextField("任務標題", text: $title, axis: .vertical)
                        .onChange(of: title) { _, newValue in
                            if !newValue.isEmpty {
                                generateAISuggestions()
                            }
                        }

                    TextField("備註", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                } header: {
                    Text("基本資訊")
                }

                // AI 智能分类
                if !title.isEmpty {
                    Section {
                        HStack {
                            Label("AI 分類", systemImage: "sparkles")
                                .foregroundColor(.blue)

                            Spacer()

                            Text(aiDetectedCategory.rawValue)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                // AI 描述建议
                if !aiDescriptionSuggestions.isEmpty {
                    Section {
                        ForEach(aiDescriptionSuggestions, id: \.self) { suggestion in
                            Button {
                                notes = suggestion
                            } label: {
                                HStack {
                                    Image(systemName: "lightbulb.fill")
                                        .foregroundColor(.yellow)
                                        .font(.caption)

                                    Text(suggestion)
                                        .foregroundColor(.primary)
                                        .font(.subheadline)

                                    Spacer()

                                    Image(systemName: "plus.circle")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                    } header: {
                        Label("AI 建議描述", systemImage: "sparkles")
                    }
                }

                // 优先级
                Section {
                    Picker("優先級", selection: $priority) {
                        ForEach(Priority.allCases) { priority in
                            HStack {
                                Image(systemName: priority.icon)
                                    .foregroundColor(priority.color)
                                Text(priority.rawValue)
                            }
                            .tag(priority)
                        }
                    }
                    .pickerStyle(.segmented)
                } header: {
                    Text("優先級")
                }

                // 截止日期
                Section {
                    Toggle("設置截止日期", isOn: $hasDueDate)

                    if hasDueDate {
                        DatePicker(
                            "截止日期",
                            selection: $dueDate,
                            displayedComponents: [.date, .hourAndMinute]
                        )

                        // AI 日期建议
                        if let dateSuggestion = aiDateSuggestion {
                            Button {
                                dueDate = dateSuggestion.suggestedDate
                            } label: {
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Image(systemName: "sparkles")
                                            .foregroundColor(.blue)
                                            .font(.caption)

                                        Text("AI 建議時間")
                                            .font(.caption)
                                            .foregroundColor(.blue)
                                    }

                                    Text(dateSuggestion.suggestedDate, style: .date)
                                        .font(.subheadline)

                                    Text(dateSuggestion.reason)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                } header: {
                    Text("截止日期")
                }

                // AI 洞察
                Section {
                    Button {
                        showingAISuggestions = true
                    } label: {
                        Label("查看更多 AI 建議", systemImage: "brain.head.profile")
                    }
                } footer: {
                    Text("AI 助手可以為您提供任務建議、最佳時間安排等智能功能")
                        .font(.caption)
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
                        saveTodo()
                    }
                    .disabled(title.isEmpty)
                }
            }
            .sheet(isPresented: $showingAISuggestions) {
                AIQuickTipsView()
            }
        }
    }

    // MARK: - Actions

    private func saveTodo() {
        let todo = Todo(
            title: title,
            notes: notes,
            priority: priority,
            dueDate: hasDueDate ? dueDate : nil
        )
        onSave(todo)
        dismiss()
    }

    private func generateAISuggestions() {
        let aiService = AIAssistantService.shared

        // 生成描述建议
        aiDescriptionSuggestions = aiService.generateTaskDescriptionSuggestions(for: title)

        // 检测分类
        let mockTodo = Todo(title: title, notes: notes)
        aiDetectedCategory = aiService.categorizeTask(mockTodo)

        // 生成日期建议
        aiDateSuggestion = aiService.suggestBestTime(for: mockTodo, existingTodos: [])
    }
}

// MARK: - AI Quick Tips View

struct AIQuickTipsView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    TipRow(
                        icon: "lightbulb.fill",
                        title: "智能任務分類",
                        description: "AI 會自動識別任務類型（工作、學習、健康等）"
                    )

                    TipRow(
                        icon: "calendar.badge.clock",
                        title: "最佳時間建議",
                        description: "基於優先級和現有任務，建議最佳完成時間"
                    )

                    TipRow(
                        icon: "text.bubble",
                        title: "描述建議",
                        description: "根據任務標題，AI 提供相關的任務步驟建議"
                    )

                    TipRow(
                        icon: "chart.line.uptrend.xyaxis",
                        title: "生產力分析",
                        description: "分析您的任務模式，提供改進建議"
                    )
                } header: {
                    Text("AI 功能")
                }

                Section {
                    TipRow(
                        icon: "1.circle.fill",
                        title: "明確具體",
                        description: "任務標題越具體，AI 建議越準確"
                    )

                    TipRow(
                        icon: "2.circle.fill",
                        title: "添加細節",
                        description: "在備註中添加更多信息，幫助 AI 理解需求"
                    )

                    TipRow(
                        icon: "3.circle.fill",
                        title: "使用關鍵詞",
                        description: "使用「會議」「學習」「運動」等關鍵詞幫助分類"
                    )
                } header: {
                    Text("使用技巧")
                }
            }
            .navigationTitle("AI 助手使用指南")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("完成") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct TipRow: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .font(.title3)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Preview

#Preview("Add Todo") {
    AIAssistedAddTodoView { todo in
        print("Added: \(todo.title)")
    }
}

#Preview("Quick Tips") {
    AIQuickTipsView()
}
