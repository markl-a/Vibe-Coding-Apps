import SwiftUI
import SwiftData

struct FavoriteNotesView: View {
    @Query(filter: #Predicate<Note> { $0.isFavorite },
           sort: \Note.modifiedAt,
           order: .reverse)
    private var favoriteNotes: [Note]

    var body: some View {
        List {
            if favoriteNotes.isEmpty {
                ContentUnavailableView(
                    "沒有我的最愛",
                    systemImage: "star",
                    description: Text("標記喜歡的筆記為我的最愛")
                )
            } else {
                ForEach(favoriteNotes) { note in
                    NavigationLink(value: note) {
                        NoteRowView(note: note)
                    }
                }
            }
        }
        .navigationTitle("我的最愛")
        .navigationDestination(for: Note.self) { note in
            EditorView(note: note)
        }
    }
}
