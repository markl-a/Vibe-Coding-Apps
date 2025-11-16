import SwiftUI
import SwiftData

struct AllNotesView: View {
    @Query(sort: \Note.modifiedAt, order: .reverse) private var notes: [Note]

    var body: some View {
        List {
            ForEach(notes) { note in
                NavigationLink(value: note) {
                    NoteRowView(note: note)
                }
            }
        }
        .navigationTitle("所有筆記")
        .navigationDestination(for: Note.self) { note in
            EditorView(note: note)
        }
    }
}
