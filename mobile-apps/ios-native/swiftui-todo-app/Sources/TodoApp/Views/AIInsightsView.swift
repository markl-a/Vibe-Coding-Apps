import SwiftUI

/// AI 洞察视图 - 显示智能建议和生产力分析
struct AIInsightsView: View {
    @Environment(\.dismiss) var dismiss
    @State private var viewModel: TodoViewModel

    @State private var suggestions: [TaskSuggestion] = []
    @State private var analysis: ProductivityAnalysis?
    @State private var selectedTab = 0

    init(viewModel: TodoViewModel) {
        self._viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab 选择器
                Picker("視圖", selection: $selectedTab) {
                    Text("智能建議").tag(0)
                    Text("生產力分析").tag(1)
                }
                .pickerStyle(.segmented)
                .padding()

                // 内容
                TabView(selection: $selectedTab) {
                    suggestionsView
                        .tag(0)

                    analysisView
                        .tag(1)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .navigationTitle("🤖 AI 助手")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("關閉") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .primaryAction) {
                    Button {
                        refreshData()
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .onAppear {
                refreshData()
            }
        }
    }

    // MARK: - Suggestions View

    private var suggestionsView: some View {
        ScrollView {
            VStack(spacing: 16) {
                if suggestions.isEmpty {
                    emptyStateView
                } else {
                    ForEach(suggestions) { suggestion in
                        SuggestionCard(suggestion: suggestion) {
                            // 处理建议操作
                            handleSuggestion(suggestion)
                        }
                    }
                }
            }
            .padding()
        }
    }

    // MARK: - Analysis View

    private var analysisView: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let analysis = analysis {
                    // 总览卡片
                    overviewCard(analysis)

                    // 完成率卡片
                    completionRateCard(analysis)

                    // 优先级分布
                    priorityDistributionCard(analysis)

                    // AI 洞察
                    insightsCard(analysis)
                } else {
                    ProgressView("分析中...")
                }
            }
            .padding()
        }
    }

    // MARK: - Analysis Cards

    private func overviewCard(_ analysis: ProductivityAnalysis) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("任務總覽")
                .font(.headline)

            HStack(spacing: 20) {
                StatItem(
                    title: "總任務",
                    value: "\(analysis.totalTasks)",
                    icon: "list.bullet",
                    color: .blue
                )

                StatItem(
                    title: "已完成",
                    value: "\(analysis.completedTasks)",
                    icon: "checkmark.circle.fill",
                    color: .green
                )

                StatItem(
                    title: "完成率",
                    value: analysis.completionRateText,
                    icon: "chart.bar.fill",
                    color: .orange
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    private func completionRateCard(_ analysis: ProductivityAnalysis) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("完成率")
                .font(.headline)

            // 进度条
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 20)

                    Rectangle()
                        .fill(LinearGradient(
                            colors: [.green, .blue],
                            startPoint: .leading,
                            endPoint: .trailing
                        ))
                        .frame(
                            width: geometry.size.width * analysis.completionRate,
                            height: 20
                        )
                }
                .cornerRadius(10)
            }
            .frame(height: 20)

            Text("\(analysis.completedTasks) / \(analysis.totalTasks) 任務已完成")
                .font(.caption)
                .foregroundColor(.secondary)

            if analysis.averageCompletionDays > 0 {
                Text("平均完成時間：\(analysis.averageCompletionDays) 天")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    private func priorityDistributionCard(_ analysis: ProductivityAnalysis) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("優先級分佈")
                .font(.headline)

            VStack(spacing: 8) {
                ForEach(Priority.allCases, id: \.self) { priority in
                    HStack {
                        Image(systemName: priority.icon)
                            .foregroundColor(priority.color)

                        Text(priority.rawValue)
                            .font(.subheadline)

                        Spacer()

                        Text("\(analysis.priorityDistribution[priority] ?? 0)")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(priority.color)
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    private func insightsCard(_ analysis: ProductivityAnalysis) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("AI 洞察")
                .font(.headline)

            if analysis.insights.isEmpty {
                Text("暫無洞察")
                    .foregroundColor(.secondary)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(analysis.insights, id: \.self) { insight in
                        HStack(alignment: .top, spacing: 12) {
                            Image(systemName: "lightbulb.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)

                            Text(insight)
                                .font(.subheadline)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "sparkles")
                .font(.system(size: 60))
                .foregroundColor(.blue)

            Text("暫無建議")
                .font(.headline)

            Text("當您有更多任務時，AI 將為您提供智能建議")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Actions

    private func refreshData() {
        let aiService = AIAssistantService.shared
        suggestions = aiService.generateTaskSuggestions(basedOn: viewModel.todos)
        analysis = aiService.analyzeProductivity(from: viewModel.todos)
    }

    private func handleSuggestion(_ suggestion: TaskSuggestion) {
        // 可以根据建议类型执行不同操作
        dismiss()
    }
}

// MARK: - Supporting Views

/// 建议卡片
struct SuggestionCard: View {
    let suggestion: TaskSuggestion
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: suggestion.priority.icon)
                    .foregroundColor(suggestion.priority.color)

                Text(suggestion.title)
                    .font(.headline)

                Spacer()

                Button(action: action) {
                    Image(systemName: "arrow.right.circle.fill")
                        .foregroundColor(.blue)
                        .font(.title3)
                }
            }

            Text(suggestion.description)
                .font(.subheadline)
                .foregroundColor(.secondary)

            if !suggestion.relatedTodos.isEmpty {
                Text("相關任務：\(suggestion.relatedTodos.count) 個")
                    .font(.caption)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

/// 统计项
struct StatItem: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Preview

#Preview {
    let viewModel = TodoViewModel()

    // 添加一些示例数据
    viewModel.addTodo(Todo(
        title: "完成項目報告",
        notes: "需要整理數據",
        priority: .high,
        dueDate: Date()
    ))

    viewModel.addTodo(Todo(
        title: "運動",
        priority: .medium,
        dueDate: Calendar.current.date(byAdding: .day, value: -1, to: Date())
    ))

    return AIInsightsView(viewModel: viewModel)
}
