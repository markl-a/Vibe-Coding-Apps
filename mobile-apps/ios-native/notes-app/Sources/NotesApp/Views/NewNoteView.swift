import SwiftUI
import SwiftData

struct NewNoteView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var content = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                TextField("標題", text: $title, axis: .vertical)
                    .font(.title)
                    .fontWeight(.bold)
                    .textFieldStyle(.plain)
                    .padding()

                Divider()

                TextEditor(text: $content)
                    .font(.body)
                    .padding()
            }
            .navigationTitle("新筆記")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("完成") {
                        createNote()
                    }
                    .disabled(title.isEmpty && content.isEmpty)
                }
            }
        }
    }

    private func createNote() {
        let note = Note(
            title: title.isEmpty ? "未命名筆記" : title,
            content: content
        )
        modelContext.insert(note)
        dismiss()
    }
}

#Preview {
    NewNoteView()
        .modelContainer(for: [Note.self], inMemory: true)
}
