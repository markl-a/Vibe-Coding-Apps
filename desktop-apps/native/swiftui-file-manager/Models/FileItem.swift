//
//  FileItem.swift
//  SwiftUI File Manager
//
//  File item model representing a file or directory
//

import Foundation
import SwiftUI

struct FileItem: Identifiable, Equatable, Hashable {
    let id = UUID()
    let name: String
    let path: URL
    let isDirectory: Bool
    let size: Int64
    let modificationDate: Date
    let creationDate: Date
    let fileType: FileType

    // Formatted size string
    var formattedSize: String {
        if isDirectory {
            return "--"
        }
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        formatter.allowedUnits = [.useAll]
        formatter.includesUnit = true
        formatter.includesCount = true
        return formatter.string(fromByteCount: size)
    }

    // Formatted date string
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "zh_TW")
        return formatter.string(from: modificationDate)
    }

    // Icon name for SF Symbols
    var icon: String {
        if isDirectory {
            return "folder.fill"
        }
        return fileType.icon
    }

    // Icon color
    var iconColor: Color {
        if isDirectory {
            return .blue
        }
        return fileType.color
    }

    // Extension
    var fileExtension: String {
        path.pathExtension.lowercased()
    }

    static func == (lhs: FileItem, rhs: FileItem) -> Bool {
        lhs.path == rhs.path
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(path)
    }
}

enum FileType: String, CaseIterable {
    case image
    case video
    case audio
    case document
    case code
    case archive
    case executable
    case pdf
    case text
    case other

    var icon: String {
        switch self {
        case .image:
            return "photo.fill"
        case .video:
            return "video.fill"
        case .audio:
            return "music.note"
        case .document:
            return "doc.text.fill"
        case .code:
            return "chevron.left.forwardslash.chevron.right"
        case .archive:
            return "doc.zipper"
        case .executable:
            return "gearshape.fill"
        case .pdf:
            return "doc.richtext.fill"
        case .text:
            return "doc.plaintext"
        case .other:
            return "doc.fill"
        }
    }

    var color: Color {
        switch self {
        case .image:
            return .purple
        case .video:
            return .red
        case .audio:
            return .pink
        case .document:
            return .blue
        case .code:
            return .green
        case .archive:
            return .orange
        case .executable:
            return .gray
        case .pdf:
            return .red
        case .text:
            return .primary
        case .other:
            return .secondary
        }
    }

    static func from(extension ext: String) -> FileType {
        switch ext.lowercased() {
        // Images
        case "jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "heic", "heif":
            return .image
        // Videos
        case "mp4", "mov", "avi", "mkv", "wmv", "flv", "webm", "m4v":
            return .video
        // Audio
        case "mp3", "wav", "aac", "flac", "m4a", "ogg", "wma", "aiff":
            return .audio
        // Documents
        case "doc", "docx", "rtf", "pages", "odt":
            return .document
        // PDF
        case "pdf":
            return .pdf
        // Text
        case "txt", "md", "markdown", "log":
            return .text
        // Code
        case "swift", "js", "ts", "py", "java", "c", "cpp", "h", "cs", "go", "rs", "rb", "php",
             "html", "css", "json", "xml", "yaml", "yml", "toml", "sh", "bash":
            return .code
        // Archives
        case "zip", "rar", "7z", "tar", "gz", "bz2", "xz", "dmg", "iso":
            return .archive
        // Executables
        case "app", "exe", "pkg", "deb", "rpm", "appimage":
            return .executable
        default:
            return .other
        }
    }
}
