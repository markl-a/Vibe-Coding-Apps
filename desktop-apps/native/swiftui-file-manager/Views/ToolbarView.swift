//
//  ToolbarView.swift
//  SwiftUI File Manager
//
//  Toolbar with navigation and actions
//

import SwiftUI

struct ToolbarView: View {
    @ObservedObject var viewModel: FileManagerViewModel
    @Binding var showNewFolderSheet: Bool

    var body: some View {
        HStack(spacing: 12) {
            // Navigation buttons
            HStack(spacing: 4) {
                Button(action: { viewModel.navigateUp() }) {
                    Image(systemName: "arrow.up")
                        .font(.system(size: 16))
                }
                .help("上一层")

                Button(action: { viewModel.refresh() }) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 16))
                }
                .help("刷新")
            }

            Divider()
                .frame(height: 20)

            // Path display
            ScrollView(.horizontal, showsIndicators: false) {
                Text(viewModel.currentPath.path)
                    .font(.system(.body, design: .monospaced))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Divider()
                .frame(height: 20)

            // View mode toggle
            Picker("视图", selection: $viewModel.viewMode) {
                ForEach(FileManagerViewModel.ViewMode.allCases) { mode in
                    Label(mode.rawValue, systemImage: mode.icon)
                        .tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .frame(width: 120)

            // Sort options
            Menu {
                Picker("排序", selection: $viewModel.sortBy) {
                    ForEach(FileManagerViewModel.SortOption.allCases) { option in
                        Text(option.rawValue).tag(option)
                    }
                }

                Divider()

                Button(action: { viewModel.sortAscending.toggle() }) {
                    Label(
                        viewModel.sortAscending ? "升序" : "降序",
                        systemImage: viewModel.sortAscending ? "arrow.up" : "arrow.down"
                    )
                }
            } label: {
                Image(systemName: "arrow.up.arrow.down")
            }
            .menuStyle(.borderlessButton)
            .frame(width: 30)

            // New folder button
            Button(action: { showNewFolderSheet = true }) {
                Image(systemName: "folder.badge.plus")
            }
            .help("新建文件夹")

            // Search field
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                    .font(.system(size: 14))

                TextField("搜索...", text: $viewModel.searchText)
                    .textFieldStyle(.plain)
                    .frame(width: 150)

                if !viewModel.searchText.isEmpty {
                    Button(action: { viewModel.searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color(nsColor: .controlBackgroundColor))
            .cornerRadius(6)
        }
    }
}
