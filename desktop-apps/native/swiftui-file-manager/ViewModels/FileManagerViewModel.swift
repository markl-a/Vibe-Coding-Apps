//
//  FileManagerViewModel.swift
//  SwiftUI File Manager
//
//  ViewModel for file manager
//

import Foundation
import SwiftUI
import Combine

@MainActor
class FileManagerViewModel: ObservableObject {
    @Published var currentPath: URL
    @Published var files: [FileItem] = []
    @Published var filteredFiles: [FileItem] = []
    @Published var searchText: String = ""
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var sortBy: SortOption = .name
    @Published var sortAscending: Bool = true
    @Published var selectedFiles: Set<FileItem> = []
    @Published var viewMode: ViewMode = .list

    private let fileService: FileService
    private var cancellables = Set<AnyCancellable>()

    enum SortOption: String, CaseIterable, Identifiable {
        case name = "名称"
        case size = "大小"
        case date = "修改日期"
        case type = "类型"

        var id: String { rawValue }
    }

    enum ViewMode: String, CaseIterable, Identifiable {
        case list = "列表"
        case grid = "网格"

        var id: String { rawValue }

        var icon: String {
            switch self {
            case .list:
                return "list.bullet"
            case .grid:
                return "square.grid.2x2"
            }
        }
    }

    init(initialPath: URL? = nil) {
        self.currentPath = initialPath ?? FileManager.default.homeDirectoryForCurrentUser
        self.fileService = FileService()

        setupBindings()
        setupNotifications()
        loadFiles()
    }

    private func setupBindings() {
        // 监听搜索文字变化
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .sink { [weak self] _ in
                self?.filterFiles()
            }
            .store(in: &cancellables)

        // 监听排序选项变化
        Publishers.CombineLatest($sortBy, $sortAscending)
            .sink { [weak self] _, _ in
                self?.sortFiles()
            }
            .store(in: &cancellables)
    }

    private func setupNotifications() {
        // 监听刷新通知
        NotificationCenter.default.publisher(for: .refreshFileList)
            .sink { [weak self] _ in
                self?.refresh()
            }
            .store(in: &cancellables)

        // 监听导航通知
        NotificationCenter.default.publisher(for: .navigateToFolder)
            .sink { [weak self] notification in
                if let url = notification.userInfo?["url"] as? URL {
                    self?.navigateTo(url)
                }
            }
            .store(in: &cancellables)
    }

    func loadFiles() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                let loadedFiles = try fileService.getFiles(at: currentPath)
                await MainActor.run {
                    self.files = loadedFiles
                    self.filterFiles()
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = "无法载入文件：\(error.localizedDescription)"
                    self.isLoading = false
                }
            }
        }
    }

    func navigateTo(_ path: URL) {
        currentPath = path
        selectedFiles.removeAll()
        loadFiles()
    }

    func navigateUp() {
        let parent = currentPath.deletingLastPathComponent()
        if parent != currentPath {
            navigateTo(parent)
        }
    }

    func refresh() {
        loadFiles()
    }

    func openFile(_ file: FileItem) {
        if file.isDirectory {
            navigateTo(file.path)
        } else {
            fileService.openFile(file.path)
        }
    }

    func revealInFinder(_ file: FileItem) {
        fileService.revealInFinder(file.path)
    }

    func getFileInfo(_ file: FileItem) -> String {
        fileService.getFileInfo(file.path)
    }

    func createNewFolder(name: String) {
        Task {
            do {
                try fileService.createFolder(at: currentPath, name: name)
                await MainActor.run {
                    self.refresh()
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = "创建文件夹失败：\(error.localizedDescription)"
                }
            }
        }
    }

    func deleteFiles(_ files: [FileItem]) {
        Task {
            do {
                for file in files {
                    try fileService.deleteItem(at: file.path)
                }
                await MainActor.run {
                    self.refresh()
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = "删除文件失败：\(error.localizedDescription)"
                }
            }
        }
    }

    private func filterFiles() {
        if searchText.isEmpty {
            filteredFiles = files
        } else {
            filteredFiles = files.filter { file in
                file.name.localizedCaseInsensitiveContains(searchText)
            }
        }
        sortFiles()
    }

    private func sortFiles() {
        switch sortBy {
        case .name:
            filteredFiles.sort { sortAscending ? $0.name < $1.name : $0.name > $1.name }
        case .size:
            filteredFiles.sort { sortAscending ? $0.size < $1.size : $0.size > $1.size }
        case .date:
            filteredFiles.sort {
                sortAscending
                    ? $0.modificationDate < $1.modificationDate
                    : $0.modificationDate > $1.modificationDate
            }
        case .type:
            filteredFiles.sort {
                sortAscending
                    ? $0.fileType.rawValue < $1.fileType.rawValue
                    : $0.fileType.rawValue > $1.fileType.rawValue
            }
        }

        // 文件夹永远在前面
        filteredFiles.sort { $0.isDirectory && !$1.isDirectory }
    }

    // Navigation history
    @Published var navigationHistory: [URL] = []
    @Published var currentHistoryIndex: Int = -1

    func canGoBack() -> Bool {
        currentHistoryIndex > 0
    }

    func canGoForward() -> Bool {
        currentHistoryIndex < navigationHistory.count - 1
    }

    func goBack() {
        guard canGoBack() else { return }
        currentHistoryIndex -= 1
        navigateTo(navigationHistory[currentHistoryIndex])
    }

    func goForward() {
        guard canGoForward() else { return }
        currentHistoryIndex += 1
        navigateTo(navigationHistory[currentHistoryIndex])
    }

    private func addToHistory(_ url: URL) {
        // Remove forward history
        if currentHistoryIndex < navigationHistory.count - 1 {
            navigationHistory.removeSubrange((currentHistoryIndex + 1)...)
        }

        navigationHistory.append(url)
        currentHistoryIndex = navigationHistory.count - 1

        // Limit history size
        if navigationHistory.count > 50 {
            navigationHistory.removeFirst()
            currentHistoryIndex -= 1
        }
    }
}
