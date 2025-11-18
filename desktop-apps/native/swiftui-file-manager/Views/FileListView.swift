//
//  FileListView.swift
//  SwiftUI File Manager
//
//  List view for files and folders
//

import SwiftUI

struct FileListView: View {
    @ObservedObject var viewModel: FileManagerViewModel

    var body: some View {
        Table(of: FileItem.self, selection: $viewModel.selectedFiles) {
            TableColumn("名称") { file in
                HStack(spacing: 8) {
                    Image(systemName: file.icon)
                        .foregroundColor(file.iconColor)
                        .font(.system(size: 20))

                    Text(file.name)
                        .lineLimit(1)
                }
            }
            .width(min: 200, ideal: 350, max: .infinity)

            TableColumn("大小") { file in
                Text(file.formattedSize)
                    .foregroundColor(.secondary)
            }
            .width(ideal: 100)

            TableColumn("类型") { file in
                Text(file.isDirectory ? "文件夹" : file.fileType.rawValue)
                    .foregroundColor(.secondary)
            }
            .width(ideal: 100)

            TableColumn("修改日期") { file in
                Text(file.formattedDate)
                    .foregroundColor(.secondary)
            }
            .width(ideal: 150)
        } rows: {
            ForEach(viewModel.filteredFiles) { file in
                TableRow(file)
                    .contextMenu {
                        FileContextMenu(file: file, viewModel: viewModel)
                    }
            }
        }
        .onTapGesture(count: 2, perform: {})  // Placeholder for double-tap
        .onChange(of: viewModel.selectedFiles) { oldValue, newValue in
            if let file = newValue.first,
               newValue.count == 1,
               oldValue != newValue {
                // Single selection changed - could trigger preview
            }
        }
    }
}

struct FileContextMenu: View {
    let file: FileItem
    @ObservedObject var viewModel: FileManagerViewModel

    var body: some View {
        Button("打开") {
            viewModel.openFile(file)
        }

        Button("在 Finder 中显示") {
            viewModel.revealInFinder(file)
        }

        Divider()

        Button("显示简介") {
            let info = viewModel.getFileInfo(file)
            print(info)
        }

        Divider()

        Button("删除", role: .destructive) {
            viewModel.deleteFiles([file])
        }
    }
}
