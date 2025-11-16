import SwiftUI
import SwiftData

@main
struct NotesAppApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [Note.self, Folder.self, Tag.self],
                       isAutosaveEnabled: true,
                       isUndoEnabled: true)
    }
}
