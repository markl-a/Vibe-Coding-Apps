//
//  FileService.swift
//  SwiftUI File Manager
//
//  Service for file system operations
//

import Foundation
import AppKit

class FileService {
    private let fileManager = FileManager.default

    /// Get files and folders at the specified URL
    func getFiles(at url: URL) throws -> [FileItem] {
        let urls = try fileManager.contentsOfDirectory(
            at: url,
            includingPropertiesForKeys: [
                .fileSizeKey,
                .contentModificationDateKey,
                .creationDateKey,
                .isDirectoryKey,
                .isHiddenKey
            ],
            options: [.skipsHiddenFiles]
        )

        return urls.compactMap { url -> FileItem? in
            guard let resourceValues = try? url.resourceValues(forKeys: [
                .fileSizeKey,
                .contentModificationDateKey,
                .creationDateKey,
                .isDirectoryKey,
                .isHiddenKey
            ]) else {
                return nil
            }

            // Skip hidden files
            if resourceValues.isHidden == true {
                return nil
            }

            let isDirectory = resourceValues.isDirectory ?? false
            let size = Int64(resourceValues.fileSize ?? 0)
            let modificationDate = resourceValues.contentModificationDate ?? Date()
            let creationDate = resourceValues.creationDate ?? Date()
            let fileExtension = url.pathExtension
            let fileType = FileType.from(extension: fileExtension)

            return FileItem(
                name: url.lastPathComponent,
                path: url,
                isDirectory: isDirectory,
                size: size,
                modificationDate: modificationDate,
                creationDate: creationDate,
                fileType: fileType
            )
        }
    }

    /// Open file with default application
    func openFile(_ url: URL) {
        NSWorkspace.shared.open(url)
    }

    /// Reveal file in Finder
    func revealInFinder(_ url: URL) {
        NSWorkspace.shared.activateFileViewerSelecting([url])
    }

    /// Get file info
    func getFileInfo(_ url: URL) -> String {
        var info = ""

        info += "Name: \(url.lastPathComponent)\n"
        info += "Path: \(url.path)\n"

        if let attributes = try? fileManager.attributesOfItem(atPath: url.path) {
            if let size = attributes[.size] as? Int64 {
                let formatter = ByteCountFormatter()
                formatter.countStyle = .file
                info += "Size: \(formatter.string(fromByteCount: size))\n"
            }

            if let modDate = attributes[.modificationDate] as? Date {
                let formatter = DateFormatter()
                formatter.dateStyle = .medium
                formatter.timeStyle = .short
                info += "Modified: \(formatter.string(from: modDate))\n"
            }

            if let creDate = attributes[.creationDate] as? Date {
                let formatter = DateFormatter()
                formatter.dateStyle = .medium
                formatter.timeStyle = .short
                info += "Created: \(formatter.string(from: creDate))\n"
            }
        }

        return info
    }

    /// Create new folder
    func createFolder(at parentURL: URL, name: String) throws {
        let newFolderURL = parentURL.appendingPathComponent(name)
        try fileManager.createDirectory(at: newFolderURL, withIntermediateDirectories: false)
    }

    /// Delete file or folder
    func deleteItem(at url: URL) throws {
        try fileManager.trashItem(at: url, resultingItemURL: nil)
    }

    /// Rename file or folder
    func renameItem(at url: URL, to newName: String) throws {
        let newURL = url.deletingLastPathComponent().appendingPathComponent(newName)
        try fileManager.moveItem(at: url, to: newURL)
    }

    /// Copy file or folder
    func copyItem(from sourceURL: URL, to destinationURL: URL) throws {
        try fileManager.copyItem(at: sourceURL, to: destinationURL)
    }

    /// Move file or folder
    func moveItem(from sourceURL: URL, to destinationURL: URL) throws {
        try fileManager.moveItem(at: sourceURL, to: destinationURL)
    }

    /// Check if path exists
    func itemExists(at url: URL) -> Bool {
        fileManager.fileExists(atPath: url.path)
    }

    /// Get folder size (recursive)
    func getFolderSize(at url: URL) -> Int64 {
        var totalSize: Int64 = 0

        if let enumerator = fileManager.enumerator(
            at: url,
            includingPropertiesForKeys: [.fileSizeKey],
            options: [.skipsHiddenFiles]
        ) {
            for case let fileURL as URL in enumerator {
                if let size = try? fileURL.resourceValues(forKeys: [.fileSizeKey]).fileSize {
                    totalSize += Int64(size)
                }
            }
        }

        return totalSize
    }
}
