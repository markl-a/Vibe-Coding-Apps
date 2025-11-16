import SwiftUI

struct ContentView: View {
    @State private var viewModel = WeatherViewModel()
    @State private var searchCity = ""
    @State private var showingCityList = false

    var body: some View {
        NavigationStack {
            ZStack {
                // 背景漸層
                if let weather = viewModel.weather {
                    LinearGradient(
                        colors: weather.condition.gradientColors,
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .ignoresSafeArea()
                } else {
                    Color.blue.gradient
                        .ignoresSafeArea()
                }

                ScrollView {
                    VStack(spacing: 20) {
                        if viewModel.isLoading {
                            ProgressView()
                                .tint(.white)
                                .scaleEffect(1.5)
                        } else if let weather = viewModel.weather {
                            WeatherDetailView(weather: weather)
                        } else {
                            WelcomeView()
                        }

                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .foregroundStyle(.white)
                                .padding()
                                .background(.red.opacity(0.8))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                    }
                    .padding()
                }
                .refreshable {
                    await viewModel.refreshWeather()
                }
            }
            .navigationTitle("天氣")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingCityList = true
                    } label: {
                        Image(systemName: "list.bullet")
                            .foregroundStyle(.white)
                    }
                }
            }
            .searchable(text: $searchCity, prompt: "搜尋城市")
            .onSubmit(of: .search) {
                Task {
                    await viewModel.fetchWeather(for: searchCity)
                    searchCity = ""
                }
            }
            .sheet(isPresented: $showingCityList) {
                CityListView(viewModel: viewModel)
            }
        }
    }
}

struct WelcomeView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "cloud.sun.fill")
                .font(.system(size: 100))
                .foregroundStyle(.white)
                .symbolRenderingMode(.hierarchical)

            Text("歡迎使用天氣應用")
                .font(.title)
                .fontWeight(.bold)
                .foregroundStyle(.white)

            Text("搜尋城市查看天氣資訊")
                .foregroundStyle(.white.opacity(0.8))
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
