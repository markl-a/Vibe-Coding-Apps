import SwiftUI
import SwiftData

struct EditorView: View {
    @Bindable var note: Note
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        VStack(spacing: 0) {
            // 標題編輯器
            TextField("標題", text: $note.title, axis: .vertical)
                .font(.title)
                .fontWeight(.bold)
                .textFieldStyle(.plain)
                .padding()

            Divider()

            // 內容編輯器
            TextEditor(text: $note.content)
                .font(.body)
                .padding()
        }
        .onChange(of: note.title) { _, _ in
            note.modifiedAt = Date()
        }
        .onChange(of: note.content) { _, _ in
            note.modifiedAt = Date()
        }
        .navigationTitle(note.title.isEmpty ? "新筆記" : note.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                // 顏色選擇
                Menu {
                    ForEach(NoteColor.allCases) { color in
                        Button {
                            note.color = color
                        } label: {
                            Label(color.rawValue, systemImage: "circle.fill")
                                .foregroundStyle(color.color)
                        }
                    }
                } label: {
                    Image(systemName: "paintpalette")
                        .foregroundStyle(note.color.color)
                }

                // 我的最愛
                Button {
                    note.isFavorite.toggle()
                } label: {
                    Image(systemName: note.isFavorite ? "star.fill" : "star")
                        .foregroundStyle(note.isFavorite ? .yellow : .primary)
                }

                // 置頂
                Button {
                    note.isPinned.toggle()
                } label: {
                    Image(systemName: note.isPinned ? "pin.fill" : "pin")
                        .foregroundStyle(note.isPinned ? .orange : .primary)
                }

                // 更多選項
                Menu {
                    Button {
                        // 分享
                    } label: {
                        Label("分享", systemImage: "square.and.arrow.up")
                    }

                    Button(role: .destructive) {
                        modelContext.delete(note)
                    } label: {
                        Label("刪除", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }

            ToolbarItemGroup(placement: .bottomBar) {
                Text("\(note.wordCount) 字 • \(note.characterCount) 字元")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Spacer()

                Text("修改於 \(note.modifiedAt.formatted(date: .omitted, time: .shortened))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
