import SwiftUI

struct CityListView: View {
    @Environment(\.dismiss) private var dismiss
    @Bindable var viewModel: WeatherViewModel

    var body: some View {
        NavigationStack {
            List {
                if viewModel.savedCities.isEmpty {
                    ContentUnavailableView(
                        "沒有儲存的城市",
                        systemImage: "map",
                        description: Text("搜尋並查看城市天氣，將自動加入列表")
                    )
                } else {
                    ForEach(viewModel.savedCities, id: \.self) { city in
                        Button {
                            Task {
                                await viewModel.fetchWeather(for: city)
                                dismiss()
                            }
                        } label: {
                            HStack {
                                Image(systemName: "mappin.circle.fill")
                                    .foregroundStyle(.blue)
                                Text(city)
                                    .foregroundStyle(.primary)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .foregroundStyle(.secondary)
                                    .font(.caption)
                            }
                        }
                    }
                    .onDelete { indexSet in
                        indexSet.forEach { index in
                            viewModel.removeCity(viewModel.savedCities[index])
                        }
                    }
                }
            }
            .navigationTitle("已儲存的城市")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("關閉") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    CityListView(viewModel: WeatherViewModel())
}
