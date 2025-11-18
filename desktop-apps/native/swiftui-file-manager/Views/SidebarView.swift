//
//  SidebarView.swift
//  SwiftUI File Manager
//
//  Sidebar with quick access locations
//

import SwiftUI

struct SidebarView: View {
    @ObservedObject var viewModel: FileManagerViewModel

    var body: some View {
        List {
            Section("常用位置") {
                QuickAccessItem(
                    icon: "house.fill",
                    title: "主目录",
                    action: {
                        viewModel.navigateTo(FileManager.default.homeDirectoryForCurrentUser)
                    }
                )

                QuickAccessItem(
                    icon: "desktopcomputer",
                    title: "桌面",
                    action: {
                        let desktopURL = FileManager.default.homeDirectoryForCurrentUser
                            .appendingPathComponent("Desktop")
                        viewModel.navigateTo(desktopURL)
                    }
                )

                QuickAccessItem(
                    icon: "doc.fill",
                    title: "文件",
                    action: {
                        let documentsURL = FileManager.default.homeDirectoryForCurrentUser
                            .appendingPathComponent("Documents")
                        viewModel.navigateTo(documentsURL)
                    }
                )

                QuickAccessItem(
                    icon: "arrow.down.circle.fill",
                    title: "下载",
                    action: {
                        let downloadsURL = FileManager.default.homeDirectoryForCurrentUser
                            .appendingPathComponent("Downloads")
                        viewModel.navigateTo(downloadsURL)
                    }
                )

                QuickAccessItem(
                    icon: "photo.fill",
                    title: "图片",
                    action: {
                        let picturesURL = FileManager.default.homeDirectoryForCurrentUser
                            .appendingPathComponent("Pictures")
                        viewModel.navigateTo(picturesURL)
                    }
                )

                QuickAccessItem(
                    icon: "music.note",
                    title: "音乐",
                    action: {
                        let musicURL = FileManager.default.homeDirectoryForCurrentUser
                            .appendingPathComponent("Music")
                        viewModel.navigateTo(musicURL)
                    }
                )

                QuickAccessItem(
                    icon: "video.fill",
                    title: "影片",
                    action: {
                        let moviesURL = FileManager.default.homeDirectoryForCurrentUser
                            .appendingPathComponent("Movies")
                        viewModel.navigateTo(moviesURL)
                    }
                )
            }

            Section("设备") {
                QuickAccessItem(
                    icon: "internaldrive",
                    title: "根目录",
                    action: {
                        viewModel.navigateTo(URL(fileURLWithPath: "/"))
                    }
                )

                QuickAccessItem(
                    icon: "person.fill",
                    title: "用户",
                    action: {
                        viewModel.navigateTo(URL(fileURLWithPath: "/Users"))
                    }
                )

                QuickAccessItem(
                    icon: "app.fill",
                    title: "应用程序",
                    action: {
                        viewModel.navigateTo(URL(fileURLWithPath: "/Applications"))
                    }
                )
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("位置")
    }
}

struct QuickAccessItem: View {
    let icon: String
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: icon)
        }
        .buttonStyle(.plain)
    }
}
