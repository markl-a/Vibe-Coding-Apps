import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Note.modifiedAt, order: .reverse) private var allNotes: [Note]
    @Query private var folders: [Folder]

    @State private var showingNewNote = false
    @State private var selectedNote: Note?
    @State private var searchText = ""

    var filteredNotes: [Note] {
        if searchText.isEmpty {
            return allNotes
        }
        return allNotes.filter {
            $0.title.localizedCaseInsensitiveContains(searchText) ||
            $0.content.localizedCaseInsensitiveContains(searchText)
        }
    }

    var pinnedNotes: [Note] {
        filteredNotes.filter { $0.isPinned }
    }

    var regularNotes: [Note] {
        filteredNotes.filter { !$0.isPinned }
    }

    var body: some View {
        NavigationSplitView {
            List {
                // 快速訪問
                Section("快速訪問") {
                    NavigationLink {
                        AllNotesView()
                    } label: {
                        Label("所有筆記", systemImage: "note.text")
                        Spacer()
                        Text("\(allNotes.count)")
                            .foregroundStyle(.secondary)
                    }

                    NavigationLink {
                        FavoriteNotesView()
                    } label: {
                        Label("我的最愛", systemImage: "star.fill")
                            .symbolRenderingMode(.multicolor)
                        Spacer()
                        Text("\(allNotes.filter { $0.isFavorite }.count)")
                            .foregroundStyle(.secondary)
                    }
                }

                // 資料夾
                Section("資料夾") {
                    ForEach(folders) { folder in
                        NavigationLink {
                            FolderNotesView(folder: folder)
                        } label: {
                            Label(folder.name, systemImage: folder.icon)
                            Spacer()
                            Text("\(folder.noteCount)")
                                .foregroundStyle(.secondary)
                        }
                    }

                    Button {
                        createFolder()
                    } label: {
                        Label("新增資料夾", systemImage: "plus")
                    }
                }
            }
            .navigationTitle("筆記")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingNewNote = true
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                }
            }
        } content: {
            // 筆記列表
            List {
                if !pinnedNotes.isEmpty {
                    Section("置頂") {
                        ForEach(pinnedNotes) { note in
                            NoteRowView(note: note)
                                .onTapGesture {
                                    selectedNote = note
                                }
                        }
                    }
                }

                Section(regularNotes.isEmpty ? "沒有筆記" : "所有筆記") {
                    ForEach(regularNotes) { note in
                        NoteRowView(note: note)
                            .onTapGesture {
                                selectedNote = note
                            }
                    }
                    .onDelete(perform: deleteNotes)
                }
            }
            .searchable(text: $searchText, prompt: "搜尋筆記")
            .navigationTitle("筆記")
        } detail: {
            if let note = selectedNote {
                EditorView(note: note)
            } else {
                ContentUnavailableView(
                    "選擇筆記",
                    systemImage: "note.text",
                    description: Text("選擇一個筆記來查看或編輯")
                )
            }
        }
        .sheet(isPresented: $showingNewNote) {
            NewNoteView()
        }
    }

    private func createFolder() {
        let folder = Folder(name: "新資料夾")
        modelContext.insert(folder)
    }

    private func deleteNotes(at offsets: IndexSet) {
        for index in offsets {
            let note = regularNotes[index]
            modelContext.delete(note)
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [Note.self, Folder.self, Tag.self],
                       inMemory: true)
}
