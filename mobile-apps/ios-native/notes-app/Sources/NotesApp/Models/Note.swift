import SwiftData
import Foundation
import SwiftUI

@Model
final class Note {
    var id: UUID
    var title: String
    var content: String
    var createdAt: Date
    var modifiedAt: Date
    var isFavorite: Bool
    var isPinned: Bool
    var colorName: String

    @Relationship(deleteRule: .nullify)
    var folder: Folder?

    @Relationship(deleteRule: .cascade)
    var tags: [Tag]

    init(
        title: String = "新筆記",
        content: String = "",
        folder: Folder? = nil,
        tags: [Tag] = [],
        colorName: String = "default"
    ) {
        self.id = UUID()
        self.title = title
        self.content = content
        self.createdAt = Date()
        self.modifiedAt = Date()
        self.isFavorite = false
        self.isPinned = false
        self.colorName = colorName
        self.folder = folder
        self.tags = tags
    }

    var color: NoteColor {
        get { NoteColor(rawValue: colorName) ?? .default }
        set { colorName = newValue.rawValue }
    }

    var wordCount: Int {
        content.split(separator: " ").count
    }

    var characterCount: Int {
        content.count
    }

    var previewText: String {
        let lines = content.split(separator: "\n", maxSplits: 3)
        return lines.joined(separator: " ")
    }
}

enum NoteColor: String, CaseIterable, Identifiable {
    case `default` = "預設"
    case red = "紅色"
    case orange = "橙色"
    case yellow = "黃色"
    case green = "綠色"
    case blue = "藍色"
    case purple = "紫色"
    case pink = "粉色"

    var id: String { rawValue }

    var color: Color {
        switch self {
        case .default:
            return .gray
        case .red:
            return .red
        case .orange:
            return .orange
        case .yellow:
            return .yellow
        case .green:
            return .green
        case .blue:
            return .blue
        case .purple:
            return .purple
        case .pink:
            return .pink
        }
    }

    var lightColor: Color {
        color.opacity(0.2)
    }
}
