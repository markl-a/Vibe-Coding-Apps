//
//  ContentView.swift
//  SwiftUI File Manager
//
//  Main content view
//

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = FileManagerViewModel()
    @State private var showNewFolderSheet = false
    @State private var newFolderName = ""

    var body: some View {
        NavigationSplitView {
            SidebarView(viewModel: viewModel)
                .frame(minWidth: 200, idealWidth: 250)
        } detail: {
            VStack(spacing: 0) {
                // Toolbar
                ToolbarView(viewModel: viewModel, showNewFolderSheet: $showNewFolderSheet)
                    .padding(.horizontal)
                    .padding(.vertical, 8)

                Divider()

                // File list
                if viewModel.isLoading {
                    ProgressView("载入中...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error = viewModel.errorMessage {
                    ErrorView(message: error) {
                        viewModel.refresh()
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    if viewModel.viewMode == .list {
                        FileListView(viewModel: viewModel)
                    } else {
                        FileGridView(viewModel: viewModel)
                    }
                }
            }
            .navigationTitle(viewModel.currentPath.lastPathComponent)
        }
        .sheet(isPresented: $showNewFolderSheet) {
            NewFolderSheet(
                isPresented: $showNewFolderSheet,
                folderName: $newFolderName,
                onCreate: {
                    viewModel.createNewFolder(name: newFolderName)
                    newFolderName = ""
                }
            )
        }
    }
}

struct ErrorView: View {
    let message: String
    let onRetry: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundColor(.orange)
            Text(message)
                .multilineTextAlignment(.center)
            Button("重试", action: onRetry)
                .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

struct NewFolderSheet: View {
    @Binding var isPresented: Bool
    @Binding var folderName: String
    let onCreate: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Text("新建文件夹")
                .font(.headline)

            TextField("文件夹名称", text: $folderName)
                .textFieldStyle(.roundedBorder)
                .frame(width: 300)

            HStack(spacing: 12) {
                Button("取消") {
                    isPresented = false
                }
                .keyboardShortcut(.escape)

                Button("创建") {
                    onCreate()
                    isPresented = false
                }
                .keyboardShortcut(.return)
                .buttonStyle(.borderedProminent)
                .disabled(folderName.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .padding(30)
        .frame(width: 400, height: 200)
    }
}

#Preview {
    ContentView()
}
