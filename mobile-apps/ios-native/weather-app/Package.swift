// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "WeatherApp",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "WeatherApp",
            targets: ["WeatherApp"]),
    ],
    targets: [
        .target(
            name: "WeatherApp",
            path: "Sources/WeatherApp"),
        .testTarget(
            name: "WeatherAppTests",
            dependencies: ["WeatherApp"],
            path: "Tests/WeatherAppTests"),
    ]
)
