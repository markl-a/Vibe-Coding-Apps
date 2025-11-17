import Foundation

/// iOS Notes App 使用範例
/// 展示筆記管理、資料夾和標籤功能

// MARK: - 測試數據

struct NotesTestData {
    /// 創建範例筆記
    static func createSampleNote() -> Note {
        Note(
            title: "我的第一個筆記",
            content: "這是筆記內容",
            folder: "工作",
            tags: ["重要", "待辦"],
            isPinned: false,
            color: .blue
        )
    }

    /// 創建多個範例筆記
    static func createSampleNotes() -> [Note] {
        [
            Note(
                title: "會議記錄",
                content: """
                # 團隊會議
                - 討論專案進度
                - 分配新任務
                - 下週截止日期
                """,
                folder: "工作",
                tags: ["會議", "重要"],
                isPinned: true,
                color: .orange
            ),
            Note(
                title: "購物清單",
                content: "牛奶、雞蛋、麵包、水果",
                folder: "個人",
                tags: ["購物"],
                isPinned: false,
                color: .green
            ),
            Note(
                title: "學習筆記 - Swift",
                content: """
                # Swift 學習重點
                - Protocol Oriented Programming
                - Value Types vs Reference Types
                - SwiftUI 狀態管理
                """,
                folder: "學習",
                tags: ["程式設計", "Swift"],
                isPinned: true,
                color: .purple
            ),
        ]
    }

    /// 資料夾範例
    static func getSampleFolders() -> [Folder] {
        [
            Folder(name: "工作", icon: "briefcase.fill", color: .blue),
            Folder(name: "個人", icon: "person.fill", color: .green),
            Folder(name: "學習", icon: "book.fill", color: .purple),
            Folder(name: "專案", icon: "folder.fill", color: .orange),
        ]
    }

    /// 標籤範例
    static func getSampleTags() -> [Tag] {
        [
            Tag(name: "重要", color: .red),
            Tag(name: "待辦", color: .orange),
            Tag(name: "想法", color: .yellow),
            Tag(name: "程式設計", color: .blue),
        ]
    }
}

// MARK: - 筆記操作範例

class NoteOperations {
    /// 搜尋筆記
    static func search(notes: [Note], query: String) -> [Note] {
        notes.filter { note in
            note.title.localizedCaseInsensitiveContains(query) ||
            note.content.localizedCaseInsensitiveContains(query)
        }
    }

    /// 按資料夾篩選
    static func filterByFolder(notes: [Note], folder: String) -> [Note] {
        notes.filter { $0.folder == folder }
    }

    /// 按標籤篩選
    static func filterByTag(notes: [Note], tag: String) -> [Note] {
        notes.filter { $0.tags.contains(tag) }
    }

    /// 獲取釘選的筆記
    static func getPinnedNotes(notes: [Note]) -> [Note] {
        notes.filter { $0.isPinned }
    }

    /// 統計分析
    static func getStatistics(notes: [Note]) -> (total: Int, pinned: Int, folders: Int) {
        let pinned = notes.filter { $0.isPinned }.count
        let folders = Set(notes.map { $0.folder }).count
        return (notes.count, pinned, folders)
    }
}

/*
 💡 使用方式:

 1. 創建測試筆記:
 ```swift
 let sampleNotes = NotesTestData.createSampleNotes()
 ```

 2. 搜尋功能:
 ```swift
 let results = NoteOperations.search(notes: notes, query: "會議")
 ```

 3. 篩選功能:
 ```swift
 let workNotes = NoteOperations.filterByFolder(notes: notes, folder: "工作")
 let pinnedNotes = NoteOperations.getPinnedNotes(notes: notes)
 ```

 4. 統計信息:
 ```swift
 let stats = NoteOperations.getStatistics(notes: notes)
 print("總計: \(stats.total), 釘選: \(stats.pinned), 資料夾: \(stats.folders)")
 ```
 */
