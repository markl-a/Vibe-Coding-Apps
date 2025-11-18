//
//  FileGridView.swift
//  SwiftUI File Manager
//
//  Grid view for files and folders
//

import SwiftUI

struct FileGridView: View {
    @ObservedObject var viewModel: FileManagerViewModel

    private let columns = [
        GridItem(.adaptive(minimum: 120, maximum: 150), spacing: 20)
    ]

    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 20) {
                ForEach(viewModel.filteredFiles) { file in
                    FileGridItem(file: file)
                        .onTapGesture(count: 2) {
                            viewModel.openFile(file)
                        }
                        .onTapGesture {
                            if viewModel.selectedFiles.contains(file) {
                                viewModel.selectedFiles.remove(file)
                            } else {
                                viewModel.selectedFiles = [file]
                            }
                        }
                        .contextMenu {
                            FileContextMenu(file: file, viewModel: viewModel)
                        }
                }
            }
            .padding()
        }
    }
}

struct FileGridItem: View {
    let file: FileItem

    var body: some View {
        VStack(spacing: 8) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(nsColor: .controlBackgroundColor))
                    .frame(width: 80, height: 80)

                Image(systemName: file.icon)
                    .font(.system(size: 40))
                    .foregroundColor(file.iconColor)
            }

            // File name
            Text(file.name)
                .font(.system(size: 12))
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(height: 36)

            // File size (for files only)
            if !file.isDirectory {
                Text(file.formattedSize)
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }
        }
        .frame(width: 120)
        .padding(.vertical, 8)
    }
}
