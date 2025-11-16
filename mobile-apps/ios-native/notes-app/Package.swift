// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "NotesApp",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "NotesApp",
            targets: ["NotesApp"]),
    ],
    targets: [
        .target(
            name: "NotesApp",
            path: "Sources/NotesApp"),
        .testTarget(
            name: "NotesAppTests",
            dependencies: ["NotesApp"],
            path: "Tests/NotesAppTests"),
    ]
)
