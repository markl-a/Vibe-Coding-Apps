import SwiftUI
import SwiftData

struct FolderNotesView: View {
    @Bindable var folder: Folder

    var sortedNotes: [Note] {
        folder.notes.sorted { $0.modifiedAt > $1.modifiedAt }
    }

    var body: some View {
        List {
            if sortedNotes.isEmpty {
                ContentUnavailableView(
                    "資料夾是空的",
                    systemImage: "folder",
                    description: Text("將筆記移到此資料夾")
                )
            } else {
                ForEach(sortedNotes) { note in
                    NavigationLink(value: note) {
                        NoteRowView(note: note)
                    }
                }
            }
        }
        .navigationTitle(folder.name)
        .navigationDestination(for: Note.self) { note in
            EditorView(note: note)
        }
    }
}
