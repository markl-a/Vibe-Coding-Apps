import SwiftUI

struct NoteRowView: View {
    let note: Note

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // 顏色指示器
            RoundedRectangle(cornerRadius: 4)
                .fill(note.color.color)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 6) {
                // 標題和圖標
                HStack {
                    Text(note.title.isEmpty ? "未命名筆記" : note.title)
                        .font(.headline)
                        .lineLimit(1)

                    Spacer()

                    HStack(spacing: 4) {
                        if note.isPinned {
                            Image(systemName: "pin.fill")
                                .font(.caption)
                                .foregroundStyle(.orange)
                        }

                        if note.isFavorite {
                            Image(systemName: "star.fill")
                                .font(.caption)
                                .foregroundStyle(.yellow)
                        }
                    }
                }

                // 預覽文字
                if !note.content.isEmpty {
                    Text(note.previewText)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                // 底部資訊
                HStack {
                    Text(note.modifiedAt, style: .relative)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if note.folder != nil {
                        Text("•")
                            .foregroundStyle(.secondary)
                        Label(note.folder?.name ?? "", systemImage: "folder")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Text("\(note.wordCount) 字")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    List {
        NoteRowView(note: Note(
            title: "範例筆記",
            content: "這是一個範例筆記的內容，用來展示筆記卡片的樣式。"
        ))
    }
}
