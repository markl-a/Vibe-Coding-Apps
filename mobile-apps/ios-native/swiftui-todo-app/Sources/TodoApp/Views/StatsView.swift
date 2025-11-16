import SwiftUI

struct StatsView: View {
    let stats: TodoStats

    var body: some View {
        HStack(spacing: 12) {
            // 總計
            StatCard(
                title: "總計",
                value: "\(stats.total)",
                icon: "list.bullet.circle.fill",
                color: .blue
            )

            // 已完成
            StatCard(
                title: "已完成",
                value: "\(stats.completed)",
                icon: "checkmark.circle.fill",
                color: .green
            )

            // 今日
            StatCard(
                title: "今日",
                value: "\(stats.today)",
                icon: "calendar.circle.fill",
                color: .orange
            )

            // 逾期
            if stats.overdue > 0 {
                StatCard(
                    title: "逾期",
                    value: "\(stats.overdue)",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                )
            }
        }
        .frame(maxWidth: .infinity)
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
                .font(.title2)
                .foregroundStyle(color)
                .symbolRenderingMode(.hierarchical)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(.primary)

            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(color.opacity(0.1))
        )
    }
}

#Preview {
    StatsView(
        stats: TodoStats(
            total: 10,
            completed: 6,
            percentage: 60,
            today: 3,
            overdue: 2
        )
    )
    .padding()
}
