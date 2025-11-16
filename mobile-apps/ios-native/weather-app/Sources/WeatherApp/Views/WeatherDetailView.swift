import SwiftUI

struct WeatherDetailView: View {
    let weather: Weather

    var body: some View {
        VStack(spacing: 30) {
            // 城市名稱
            Text(weather.cityName)
                .font(.system(size: 40, weight: .medium))
                .foregroundStyle(.white)

            // 天氣圖示
            Image(systemName: weather.condition.icon)
                .font(.system(size: 100))
                .foregroundStyle(.white)
                .symbolRenderingMode(.hierarchical)
                .shadow(radius: 10)

            // 溫度
            Text(weather.temperatureString)
                .font(.system(size: 80, weight: .thin))
                .foregroundStyle(.white)

            // 天氣描述
            Text(weather.description)
                .font(.title2)
                .foregroundStyle(.white.opacity(0.9))

            // 體感溫度和最高最低溫
            HStack(spacing: 30) {
                Text(weather.feelsLikeString)
                Text("↑\(Int(weather.tempMax))°")
                Text("↓\(Int(weather.tempMin))°")
            }
            .font(.title3)
            .foregroundStyle(.white.opacity(0.8))

            Divider()
                .background(.white.opacity(0.5))
                .padding(.vertical)

            // 詳細資訊
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 20) {
                WeatherInfoCard(
                    icon: "humidity.fill",
                    title: "濕度",
                    value: "\(weather.humidity)%"
                )

                WeatherInfoCard(
                    icon: "wind",
                    title: "風速",
                    value: weather.windSpeedString
                )

                WeatherInfoCard(
                    icon: "gauge",
                    title: "氣壓",
                    value: "\(weather.pressure) hPa"
                )

                WeatherInfoCard(
                    icon: "sunrise.fill",
                    title: "日出",
                    value: weather.sunrise.formatted(date: .omitted, time: .shortened)
                )

                WeatherInfoCard(
                    icon: "sunset.fill",
                    title: "日落",
                    value: weather.sunset.formatted(date: .omitted, time: .shortened)
                )

                WeatherInfoCard(
                    icon: "clock.fill",
                    title: "更新時間",
                    value: weather.timestamp.formatted(date: .omitted, time: .shortened)
                )
            }
        }
        .padding()
    }
}

struct WeatherInfoCard: View {
    let icon: String
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(.white)

            Text(title)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))

            Text(value)
                .font(.headline)
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(.white.opacity(0.2))
        .clipShape(RoundedRectangle(cornerRadius: 15))
    }
}

#Preview {
    ZStack {
        Color.blue.gradient
            .ignoresSafeArea()

        WeatherDetailView(
            weather: Weather(
                from: WeatherResponse(
                    coord: .init(lat: 25.0, lon: 121.0),
                    weather: [.init(id: 800, main: "Clear", description: "晴朗", icon: "01d")],
                    main: .init(temp: 25, feelsLike: 26, tempMin: 23, tempMax: 28, pressure: 1013, humidity: 65),
                    wind: .init(speed: 3.5, deg: 180),
                    sys: .init(sunrise: 1700000000, sunset: 1700050000),
                    name: "Taipei",
                    dt: 1700025000
                )
            )
        )
    }
}
