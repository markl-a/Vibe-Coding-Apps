import SwiftUI

/// AI 天气建议视图 - 显示穿衣建议、活动建议和天气分析
struct AIWeatherAdviceView: View {
    let weather: Weather

    @State private var clothingAdvice: ClothingAdvice?
    @State private var activitySuggestions: [ActivitySuggestion] = []
    @State private var weatherAnalysis: WeatherAnalysis?
    @State private var selectedTab = 0

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab 选择器
                Picker("視圖", selection: $selectedTab) {
                    Text("穿衣建議").tag(0)
                    Text("活動建議").tag(1)
                    Text("天氣分析").tag(2)
                }
                .pickerStyle(.segmented)
                .padding()

                // 内容
                TabView(selection: $selectedTab) {
                    clothingAdviceView
                        .tag(0)

                    activitySuggestionsView
                        .tag(1)

                    weatherAnalysisView
                        .tag(2)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .navigationTitle("🤖 AI 天氣助手")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                loadAIAdvice()
            }
        }
    }

    // MARK: - Clothing Advice View

    private var clothingAdviceView: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let advice = clothingAdvice {
                    // 舒适度卡片
                    ComfortLevelCard(level: advice.comfortLevel, summary: advice.summary)

                    // 服装建议
                    VStack(alignment: .leading, spacing: 12) {
                        Text("建議服裝")
                            .font(.headline)

                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 12) {
                            ForEach(advice.clothes) { item in
                                ClothingItemCard(item: item)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)

                    // 配件建议
                    if !advice.accessories.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("建議配件")
                                .font(.headline)

                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 12) {
                                ForEach(advice.accessories) { item in
                                    ClothingItemCard(item: item)
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                    }

                    // 贴士
                    if !advice.tips.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("💡 穿搭小貼士")
                                .font(.headline)

                            VStack(alignment: .leading, spacing: 8) {
                                ForEach(advice.tips, id: \.self) { tip in
                                    HStack(alignment: .top, spacing: 8) {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.green)
                                            .font(.caption)

                                        Text(tip)
                                            .font(.subheadline)
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                    }
                } else {
                    ProgressView("分析中...")
                }
            }
            .padding()
        }
    }

    // MARK: - Activity Suggestions View

    private var activitySuggestionsView: some View {
        ScrollView {
            VStack(spacing: 16) {
                if activitySuggestions.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "figure.walk")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)

                        Text("暫無活動建議")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxHeight: .infinity)
                    .padding()
                } else {
                    ForEach(activitySuggestions) { suggestion in
                        ActivitySuggestionCard(suggestion: suggestion)
                    }
                }
            }
            .padding()
        }
    }

    // MARK: - Weather Analysis View

    private var weatherAnalysisView: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let analysis = weatherAnalysis {
                    // 舒适度总览
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: analysis.comfortIndex.icon)
                                .font(.title)
                                .foregroundColor(analysis.comfortIndex.color)

                            Text("舒適度：\(analysis.comfortIndex.text)")
                                .font(.title3)
                                .fontWeight(.semibold)

                            Spacer()
                        }

                        HStack {
                            Label("紫外線指數", systemImage: "sun.max.fill")
                                .font(.subheadline)

                            Spacer()

                            Text("\(analysis.uvIndex) (\(analysis.uvLevel))")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)

                    // 警告
                    if !analysis.warnings.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("⚠️ 天氣警告")
                                .font(.headline)

                            VStack(spacing: 8) {
                                ForEach(analysis.warnings) { warning in
                                    WarningCard(warning: warning)
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                    }

                    // 洞察
                    if !analysis.insights.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("🔍 AI 洞察")
                                .font(.headline)

                            VStack(alignment: .leading, spacing: 8) {
                                ForEach(analysis.insights, id: \.self) { insight in
                                    HStack(alignment: .top, spacing: 8) {
                                        Image(systemName: "lightbulb.fill")
                                            .foregroundColor(.yellow)
                                            .font(.caption)

                                        Text(insight)
                                            .font(.subheadline)
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                    }

                    // 健康提示
                    if !analysis.healthTips.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("💊 健康提示")
                                .font(.headline)

                            VStack(alignment: .leading, spacing: 8) {
                                ForEach(analysis.healthTips, id: \.self) { tip in
                                    HStack(alignment: .top, spacing: 8) {
                                        Image(systemName: "heart.fill")
                                            .foregroundColor(.red)
                                            .font(.caption)

                                        Text(tip)
                                            .font(.subheadline)
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
                    }
                } else {
                    ProgressView("分析中...")
                }
            }
            .padding()
        }
    }

    // MARK: - Actions

    private func loadAIAdvice() {
        let aiAssistant = AIWeatherAssistant.shared
        clothingAdvice = aiAssistant.generateClothingSuggestions(for: weather)
        activitySuggestions = aiAssistant.generateActivitySuggestions(for: weather)
        weatherAnalysis = aiAssistant.analyzeWeather(for: weather)
    }
}

// MARK: - Supporting Views

struct ComfortLevelCard: View {
    let level: ComfortLevel
    let summary: String

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: level.icon)
                    .font(.largeTitle)
                    .foregroundColor(level.color)

                VStack(alignment: .leading, spacing: 4) {
                    Text("體感舒適度")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(level.text)
                        .font(.title2)
                        .fontWeight(.bold)
                }

                Spacer()
            }

            Text(summary)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(
            LinearGradient(
                colors: [level.color.opacity(0.1), level.color.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct ClothingItemCard: View {
    let item: ClothingItem

    var body: some View {
        VStack(spacing: 8) {
            Text(item.icon)
                .font(.largeTitle)

            Text(item.name)
                .font(.subheadline)
                .fontWeight(.semibold)

            Text(item.reason)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }
}

struct ActivitySuggestionCard: View {
    let suggestion: ActivitySuggestion

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(suggestion.icon)
                    .font(.largeTitle)

                VStack(alignment: .leading, spacing: 4) {
                    Text(suggestion.activity)
                        .font(.headline)

                    HStack {
                        Text(suggestion.suitability.text)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(suggestion.suitability.color)

                        Circle()
                            .fill(suggestion.suitability.color)
                            .frame(width: 8, height: 8)
                    }
                }

                Spacer()
            }

            Text(suggestion.reason)
                .font(.subheadline)
                .foregroundColor(.secondary)

            if !suggestion.specificActivities.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("推薦項目：")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    FlowLayout(spacing: 6) {
                        ForEach(suggestion.specificActivities, id: \.self) { activity in
                            Text(activity)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(suggestion.suitability.color.opacity(0.2))
                                .foregroundColor(suggestion.suitability.color)
                                .cornerRadius(4)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct WarningCard: View {
    let warning: WeatherWarning

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: warning.severity.icon)
                .foregroundColor(warning.severity.color)
                .font(.title3)

            Text(warning.message)
                .font(.subheadline)
                .fontWeight(.medium)

            Spacer()
        }
        .padding()
        .background(warning.severity.color.opacity(0.1))
        .cornerRadius(8)
    }
}

// 简单的流式布局
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(
            in: proposal.replacingUnspecifiedDimensions().width,
            subviews: subviews,
            spacing: spacing
        )
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(
            in: bounds.width,
            subviews: subviews,
            spacing: spacing
        )
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x,
                                     y: bounds.minY + result.positions[index].y),
                         proposal: .unspecified)
        }
    }

    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []

        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if currentX + size.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }

                positions.append(CGPoint(x: currentX, y: currentY))
                currentX += size.width + spacing
                lineHeight = max(lineHeight, size.height)
            }

            self.size = CGSize(width: maxWidth, height: currentY + lineHeight)
        }
    }
}

// MARK: - Preview

#Preview {
    let mockWeather = Weather(from: WeatherResponse(
        coord: WeatherResponse.Coordinates(lat: 25.0, lon: 121.5),
        weather: [WeatherResponse.WeatherInfo(id: 800, main: "Clear", description: "晴朗", icon: "01d")],
        main: WeatherResponse.MainWeather(temp: 25, feelsLike: 26, tempMin: 22, tempMax: 28, pressure: 1013, humidity: 65),
        wind: WeatherResponse.Wind(speed: 3.5, deg: 180),
        sys: WeatherResponse.System(sunrise: 1609459200, sunset: 1609499200),
        name: "台北",
        dt: 1609459200
    ))

    return AIWeatherAdviceView(weather: mockWeather)
}
