//
//  SwiftUIFileManagerApp.swift
//  SwiftUI File Manager
//
//  Created with AI assistance
//

import SwiftUI

@main
struct SwiftUIFileManagerApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 800, idealWidth: 1000, minHeight: 600, idealHeight: 700)
        }
        .windowStyle(.hiddenTitleBar)
        .commands {
            CommandGroup(after: .newItem) {
                Button("开启资料夹...") {
                    openFolderPicker()
                }
                .keyboardShortcut("O", modifiers: [.command])

                Divider()

                Button("重新整理") {
                    NotificationCenter.default.post(name: .refreshFileList, object: nil)
                }
                .keyboardShortcut("R", modifiers: [.command])
            }

            CommandGroup(after: .sidebar) {
                Button("显示/隐藏侧边栏") {
                    NotificationCenter.default.post(name: .toggleSidebar, object: nil)
                }
                .keyboardShortcut("S", modifiers: [.command, .control])
            }
        }
    }

    private func openFolderPicker() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false

        if panel.runModal() == .OK {
            if let url = panel.url {
                NotificationCenter.default.post(
                    name: .navigateToFolder,
                    object: nil,
                    userInfo: ["url": url]
                )
            }
        }
    }
}

// Notification names
extension Notification.Name {
    static let refreshFileList = Notification.Name("refreshFileList")
    static let toggleSidebar = Notification.Name("toggleSidebar")
    static let navigateToFolder = Notification.Name("navigateToFolder")
}
