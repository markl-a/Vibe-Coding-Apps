// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "TodoApp",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "TodoApp",
            targets: ["TodoApp"]),
    ],
    targets: [
        .target(
            name: "TodoApp",
            path: "Sources/TodoApp"),
        .testTarget(
            name: "TodoAppTests",
            dependencies: ["TodoApp"],
            path: "Tests/TodoAppTests"),
    ]
)
