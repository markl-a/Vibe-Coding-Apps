import SwiftData
import Foundation
import SwiftUI

@Model
final class Tag {
    var id: UUID
    var name: String
    var colorName: String

    @Relationship(deleteRule: .nullify, inverse: \Note.tags)
    var notes: [Note]

    init(name: String, colorName: String = "blue") {
        self.id = UUID()
        self.name = name
        self.colorName = colorName
        self.notes = []
    }

    var color: Color {
        Color(colorName)
    }

    var noteCount: Int {
        notes.count
    }
}
