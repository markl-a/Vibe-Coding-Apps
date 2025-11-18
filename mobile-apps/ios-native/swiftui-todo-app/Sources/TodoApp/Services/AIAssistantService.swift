import Foundation

/// AI 助手服务 - 提供智能任务建议、分析和优化
@MainActor
class AIAssistantService {

    // MARK: - Singleton
    static let shared = AIAssistantService()

    private init() {}

    // MARK: - AI 任务建议

    /// 基于历史数据生成智能任务建议
    func generateTaskSuggestions(basedOn todos: [Todo]) -> [TaskSuggestion] {
        var suggestions: [TaskSuggestion] = []

        // 1. 分析逾期任务，建议重新安排
        let overdueTodos = todos.filter { $0.isOverdue }
        if !overdueTodos.isEmpty {
            suggestions.append(TaskSuggestion(
                type: .reschedule,
                title: "重新安排逾期任務",
                description: "您有 \(overdueTodos.count) 個逾期任務，建議重新安排時間",
                priority: .high,
                relatedTodos: overdueTodos.map { $0.id }
            ))
        }

        // 2. 分析高优先级未完成任务
        let highPriorityPending = todos.filter { $0.priority == .high && !$0.isCompleted }
        if highPriorityPending.count > 3 {
            suggestions.append(TaskSuggestion(
                type: .prioritize,
                title: "專注高優先級任務",
                description: "您有 \(highPriorityPending.count) 個高優先級待辦，建議優先完成",
                priority: .high,
                relatedTodos: highPriorityPending.map { $0.id }
            ))
        }

        // 3. 建议今日任务
        let todayTodos = todos.filter { todo in
            guard let dueDate = todo.dueDate else { return false }
            return Calendar.current.isDateInToday(dueDate) && !todo.isCompleted
        }
        if !todayTodos.isEmpty {
            suggestions.append(TaskSuggestion(
                type: .todayFocus,
                title: "今日待辦清單",
                description: "您今天有 \(todayTodos.count) 個待辦事項需要完成",
                priority: .medium,
                relatedTodos: todayTodos.map { $0.id }
            ))
        }

        // 4. 建议清理已完成任务
        let completedTodos = todos.filter { $0.isCompleted }
        if completedTodos.count > 20 {
            suggestions.append(TaskSuggestion(
                type: .cleanup,
                title: "清理已完成任務",
                description: "您有 \(completedTodos.count) 個已完成任務，建議清理以保持整潔",
                priority: .low,
                relatedTodos: []
            ))
        }

        // 5. 分析工作生活平衡（基于关键词）
        let workRelatedCount = todos.filter { isWorkRelated($0) && !$0.isCompleted }.count
        let personalCount = todos.filter { !isWorkRelated($0) && !$0.isCompleted }.count

        if workRelatedCount > personalCount * 3 {
            suggestions.append(TaskSuggestion(
                type: .balance,
                title: "注意工作生活平衡",
                description: "工作相關任務較多（\(workRelatedCount)），建議增加個人時間",
                priority: .medium,
                relatedTodos: []
            ))
        }

        // 6. 建议设置截止日期
        let noDeadlineTodos = todos.filter { $0.dueDate == nil && !$0.isCompleted }
        if noDeadlineTodos.count > 5 {
            suggestions.append(TaskSuggestion(
                type: .setDeadline,
                title: "設置任務截止日期",
                description: "有 \(noDeadlineTodos.count) 個任務未設置截止日期，建議添加以提高效率",
                priority: .medium,
                relatedTodos: noDeadlineTodos.map { $0.id }
            ))
        }

        return suggestions.sorted { $0.priority.sortOrder > $1.priority.sortOrder }
    }

    // MARK: - AI 任务分析

    /// 分析任务模式和生产力
    func analyzeProductivity(from todos: [Todo]) -> ProductivityAnalysis {
        let total = todos.count
        let completed = todos.filter { $0.isCompleted }.count
        let completionRate = total > 0 ? Double(completed) / Double(total) : 0

        // 计算平均完成时间
        let completedWithDates = todos.filter {
            $0.isCompleted && $0.completedAt != nil
        }

        var averageCompletionTime: TimeInterval = 0
        if !completedWithDates.isEmpty {
            let totalTime = completedWithDates.reduce(0.0) { sum, todo in
                guard let completedAt = todo.completedAt else { return sum }
                return sum + completedAt.timeIntervalSince(todo.createdAt)
            }
            averageCompletionTime = totalTime / Double(completedWithDates.count)
        }

        // 分析最常用的优先级
        let priorityDistribution = analyzePriorityDistribution(todos)

        // 生成洞察
        let insights = generateProductivityInsights(
            completionRate: completionRate,
            averageCompletionTime: averageCompletionTime,
            todos: todos
        )

        return ProductivityAnalysis(
            totalTasks: total,
            completedTasks: completed,
            completionRate: completionRate,
            averageCompletionTime: averageCompletionTime,
            priorityDistribution: priorityDistribution,
            insights: insights
        )
    }

    /// 智能分类任务
    func categorizeTask(_ todo: Todo) -> TaskCategory {
        let text = (todo.title + " " + todo.notes).lowercased()

        // 工作相关关键词
        if text.contains("會議") || text.contains("报告") || text.contains("项目") ||
           text.contains("工作") || text.contains("客户") || text.contains("开发") ||
           text.contains("meeting") || text.contains("report") || text.contains("project") {
            return .work
        }

        // 学习相关
        if text.contains("學習") || text.contains("課程") || text.contains("閱讀") ||
           text.contains("study") || text.contains("learn") || text.contains("read") {
            return .learning
        }

        // 健康相关
        if text.contains("運動") || text.contains("健身") || text.contains("醫生") ||
           text.contains("exercise") || text.contains("health") || text.contains("gym") {
            return .health
        }

        // 购物相关
        if text.contains("購買") || text.contains("買") || text.contains("shopping") ||
           text.contains("buy") {
            return .shopping
        }

        // 家务相关
        if text.contains("打掃") || text.contains("清潔") || text.contains("整理") ||
           text.contains("clean") || text.contains("organize") {
            return .household
        }

        return .personal
    }

    /// 生成任务描述建议
    func generateTaskDescriptionSuggestions(for title: String) -> [String] {
        let lowercased = title.lowercased()
        var suggestions: [String] = []

        if lowercased.contains("會議") || lowercased.contains("meeting") {
            suggestions.append("準備會議議程和相關資料")
            suggestions.append("確認參會人員和時間")
            suggestions.append("預訂會議室")
        } else if lowercased.contains("报告") || lowercased.contains("report") {
            suggestions.append("收集相關數據和資料")
            suggestions.append("撰寫報告草稿")
            suggestions.append("審核並完善內容")
        } else if lowercased.contains("學習") || lowercased.contains("learn") {
            suggestions.append("制定學習計劃和目標")
            suggestions.append("準備學習材料")
            suggestions.append("預留專注學習時間")
        } else if lowercased.contains("運動") || lowercased.contains("exercise") {
            suggestions.append("準備運動裝備")
            suggestions.append("熱身和拉伸")
            suggestions.append("記錄運動數據")
        }

        // 通用建议
        if suggestions.isEmpty {
            suggestions.append("將任務分解為具體步驟")
            suggestions.append("設定明確的完成標準")
            suggestions.append("預估所需時間")
        }

        return suggestions
    }

    /// 建议最佳执行时间
    func suggestBestTime(for todo: Todo, existingTodos: [Todo]) -> DateSuggestion {
        // 分析现有任务的时间分布
        let calendar = Calendar.current
        let now = Date()

        // 检查今天是否已经有很多任务
        let todayTasks = existingTodos.filter { existingTodo in
            guard let dueDate = existingTodo.dueDate else { return false }
            return calendar.isDateInToday(dueDate)
        }

        // 根据优先级建议时间
        switch todo.priority {
        case .high:
            if todayTasks.count < 3 {
                return DateSuggestion(
                    suggestedDate: now,
                    reason: "高優先級任務，建議今天完成"
                )
            } else {
                return DateSuggestion(
                    suggestedDate: calendar.date(byAdding: .day, value: 1, to: now) ?? now,
                    reason: "今天任務較多，建議明天優先處理"
                )
            }
        case .medium:
            return DateSuggestion(
                suggestedDate: calendar.date(byAdding: .day, value: 2, to: now) ?? now,
                reason: "中優先級任務，建議2天內完成"
            )
        case .low:
            return DateSuggestion(
                suggestedDate: calendar.date(byAdding: .day, value: 7, to: now) ?? now,
                reason: "低優先級任務，可在一週內完成"
            )
        }
    }

    // MARK: - Private Helpers

    private func isWorkRelated(_ todo: Todo) -> Bool {
        let text = (todo.title + " " + todo.notes).lowercased()
        let workKeywords = ["工作", "會議", "报告", "项目", "客户", "开发",
                          "work", "meeting", "report", "project", "client"]
        return workKeywords.contains { text.contains($0) }
    }

    private func analyzePriorityDistribution(_ todos: [Todo]) -> [Priority: Int] {
        var distribution: [Priority: Int] = [
            .high: 0,
            .medium: 0,
            .low: 0
        ]

        for todo in todos where !todo.isCompleted {
            distribution[todo.priority, default: 0] += 1
        }

        return distribution
    }

    private func generateProductivityInsights(
        completionRate: Double,
        averageCompletionTime: TimeInterval,
        todos: [Todo]
    ) -> [String] {
        var insights: [String] = []

        // 完成率洞察
        if completionRate > 0.8 {
            insights.append("✨ 完成率優秀（\(Int(completionRate * 100))%），保持良好習慣！")
        } else if completionRate < 0.5 {
            insights.append("💡 完成率偏低（\(Int(completionRate * 100))%），建議減少同時進行的任務")
        }

        // 平均完成时间洞察
        let days = averageCompletionTime / (24 * 3600)
        if days < 1 {
            insights.append("⚡ 任務完成速度很快，平均不到一天")
        } else if days > 7 {
            insights.append("⏰ 任務完成時間較長，建議將大任務分解")
        }

        // 逾期洞察
        let overdueCount = todos.filter { $0.isOverdue }.count
        if overdueCount > 0 {
            insights.append("⚠️ 有 \(overdueCount) 個逾期任務需要關注")
        }

        // 优先级洞察
        let highPriorityCount = todos.filter { $0.priority == .high && !$0.isCompleted }.count
        if highPriorityCount > 5 {
            insights.append("🎯 高優先級任務較多（\(highPriorityCount)），建議聚焦最重要的3項")
        }

        return insights
    }
}

// MARK: - Supporting Types

/// 任务建议类型
enum SuggestionType {
    case reschedule      // 重新安排
    case prioritize      // 优先处理
    case todayFocus      // 今日聚焦
    case cleanup         // 清理任务
    case balance         // 工作生活平衡
    case setDeadline     // 设置截止日期
}

/// 任务建议
struct TaskSuggestion: Identifiable {
    let id = UUID()
    let type: SuggestionType
    let title: String
    let description: String
    let priority: Priority
    let relatedTodos: [UUID]
}

/// 生产力分析
struct ProductivityAnalysis {
    let totalTasks: Int
    let completedTasks: Int
    let completionRate: Double
    let averageCompletionTime: TimeInterval
    let priorityDistribution: [Priority: Int]
    let insights: [String]

    var completionRateText: String {
        "\(Int(completionRate * 100))%"
    }

    var averageCompletionDays: Int {
        Int(averageCompletionTime / (24 * 3600))
    }
}

/// 任务分类
enum TaskCategory: String, CaseIterable {
    case work = "工作"
    case learning = "學習"
    case health = "健康"
    case shopping = "購物"
    case household = "家務"
    case personal = "個人"
}

/// 日期建议
struct DateSuggestion {
    let suggestedDate: Date
    let reason: String
}

// MARK: - Priority Extension

extension Priority {
    var sortOrder: Int {
        switch self {
        case .high: return 3
        case .medium: return 2
        case .low: return 1
        }
    }
}
