import SwiftUI

struct EmptyStateView: View {
    let filterOption: FilterOption

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: emptyIcon)
                .font(.system(size: 60))
                .foregroundStyle(.secondary)
                .symbolRenderingMode(.hierarchical)

            Text(emptyTitle)
                .font(.title2)
                .fontWeight(.semibold)

            Text(emptyMessage)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    private var emptyIcon: String {
        switch filterOption {
        case .all:
            return "checklist"
        case .active:
            return "circle.dashed"
        case .completed:
            return "checkmark.circle"
        case .overdue:
            return "clock.badge.exclamationmark"
        }
    }

    private var emptyTitle: String {
        switch filterOption {
        case .all:
            return "沒有待辦事項"
        case .active:
            return "沒有進行中的待辦事項"
        case .completed:
            return "還沒有完成任何待辦事項"
        case .overdue:
            return "沒有逾期的待辦事項"
        }
    }

    private var emptyMessage: String {
        switch filterOption {
        case .all:
            return "點擊右上角的 + 按鈕\n開始新增您的第一個待辦事項"
        case .active:
            return "太棒了！所有待辦事項都已完成\n或者您可以新增更多待辦事項"
        case .completed:
            return "開始完成您的待辦事項吧！"
        case .overdue:
            return "太好了！沒有逾期的待辦事項"
        }
    }
}

#Preview {
    EmptyStateView(filterOption: .all)
}
