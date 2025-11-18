import Foundation
import SwiftUI

/// AI 天气助手 - 提供智能天气分析、穿衣建议和活动建议
@MainActor
class AIWeatherAssistant {

    // MARK: - Singleton
    static let shared = AIWeatherAssistant()

    private init() {}

    // MARK: - AI 穿衣建议

    /// 根据天气生成穿衣建议
    func generateClothingSuggestions(for weather: Weather) -> ClothingAdvice {
        let temp = weather.temperature
        let condition = weather.condition
        let windSpeed = weather.windSpeed

        var clothes: [ClothingItem] = []
        var accessories: [ClothingItem] = []
        var tips: [String] = []

        // 根据温度推荐服装
        switch temp {
        case ..<0:
            clothes.append(.init(name: "羽絨外套", icon: "❄️", reason: "極寒天氣"))
            clothes.append(.init(name: "毛衣", icon: "🧥", reason: "保暖必需"))
            clothes.append(.init(name: "厚褲子", icon: "👖", reason: "防寒"))
            accessories.append(.init(name: "圍巾", icon: "🧣", reason: "保護頸部"))
            accessories.append(.init(name: "手套", icon: "🧤", reason: "保護雙手"))
            accessories.append(.init(name: "毛帽", icon: "🎩", reason: "防止頭部失溫"))
            tips.append("建議多層穿搭，方便調節")

        case 0..<10:
            clothes.append(.init(name: "厚外套", icon: "🧥", reason: "天氣寒冷"))
            clothes.append(.init(name: "長袖上衣", icon: "👔", reason: "保暖"))
            clothes.append(.init(name: "長褲", icon: "👖", reason: "防寒"))
            accessories.append(.init(name: "圍巾", icon: "🧣", reason: "增加保暖"))
            tips.append("早晚溫差大，建議攜帶外套")

        case 10..<20:
            clothes.append(.init(name: "薄外套", icon: "🧥", reason: "微涼天氣"))
            clothes.append(.init(name: "長袖襯衫", icon: "👔", reason: "舒適"))
            clothes.append(.init(name: "長褲或牛仔褲", icon: "👖", reason: "適中溫度"))
            tips.append("舒適溫度，適合外出活動")

        case 20..<28:
            clothes.append(.init(name: "短袖上衣", icon: "👕", reason: "溫暖天氣"))
            clothes.append(.init(name: "薄長褲或短褲", icon: "🩳", reason: "涼爽舒適"))
            accessories.append(.init(name: "太陽眼鏡", icon: "🕶️", reason: "陽光防護"))
            tips.append("適合戶外活動的好天氣")

        default:  // >= 28
            clothes.append(.init(name: "輕薄短袖", icon: "👕", reason: "炎熱天氣"))
            clothes.append(.init(name: "短褲或裙子", icon: "🩳", reason: "透氣涼爽"))
            accessories.append(.init(name: "太陽眼鏡", icon: "🕶️", reason: "強烈日照"))
            accessories.append(.init(name: "遮陽帽", icon: "🧢", reason: "防曬必備"))
            accessories.append(.init(name: "防曬乳", icon: "🧴", reason: "保護皮膚"))
            tips.append("高溫天氣，注意防曬和補充水分")
        }

        // 根据天气状况额外建议
        switch condition {
        case .rain, .drizzle, .thunderstorm:
            accessories.append(.init(name: "雨傘", icon: "☔", reason: "降雨天氣"))
            accessories.append(.init(name: "雨衣或防水外套", icon: "🧥", reason: "防雨"))
            if temp < 15 {
                tips.append("雨天濕冷，建議穿著防水保暖衣物")
            } else {
                tips.append("記得攜帶雨具")
            }

        case .snow:
            accessories.append(.init(name: "防滑鞋", icon: "👢", reason: "雪地行走"))
            accessories.append(.init(name: "防水手套", icon: "🧤", reason: "雪天必備"))
            tips.append("雪天路滑，注意安全")

        case .mist:
            tips.append("能見度較低，外出注意安全")

        case .clear where temp > 25:
            tips.append("晴朗高溫，建議穿著透氣衣物")

        default:
            break
        }

        // 风速建议
        if windSpeed > 10 {  // 大于 36 km/h
            tips.append("風力較強，建議穿著防風外套")
            if !accessories.contains(where: { $0.name.contains("帽") }) {
                accessories.append(.init(name: "帽子", icon: "🧢", reason: "固定頭髮"))
            }
        }

        let comfortLevel = calculateComfortLevel(temp: temp, condition: condition, windSpeed: windSpeed)

        return ClothingAdvice(
            clothes: clothes,
            accessories: accessories,
            tips: tips,
            comfortLevel: comfortLevel,
            summary: generateClothingSummary(temp: temp, condition: condition)
        )
    }

    // MARK: - AI 活动建议

    /// 根据天气生成活动建议
    func generateActivitySuggestions(for weather: Weather) -> [ActivitySuggestion] {
        var suggestions: [ActivitySuggestion] = []
        let temp = weather.temperature
        let condition = weather.condition
        let windSpeed = weather.windSpeed
        let currentHour = Calendar.current.component(.hour, from: Date())

        // 理想天气：晴朗且温度适中
        if condition == .clear && temp >= 18 && temp <= 28 {
            suggestions.append(.init(
                activity: "戶外運動",
                icon: "🏃‍♂️",
                suitability: .perfect,
                reason: "天氣晴朗，溫度適宜",
                specificActivities: ["跑步", "騎自行車", "打球", "登山"]
            ))

            suggestions.append(.init(
                activity: "野餐",
                icon: "🧺",
                suitability: .perfect,
                reason: "完美的野餐天氣",
                specificActivities: ["公園野餐", "戶外聚餐", "露營"]
            ))

            if currentHour >= 17 {
                suggestions.append(.init(
                    activity: "欣賞日落",
                    icon: "🌅",
                    suitability: .perfect,
                    reason: "晴朗天氣適合觀賞日落",
                    specificActivities: ["海邊散步", "山頂觀景"]
                ))
            }
        }

        // 温和天气
        if temp >= 15 && temp < 28 && (condition == .clear || condition == .cloudy) {
            suggestions.append(.init(
                activity: "散步",
                icon: "🚶",
                suitability: .good,
                reason: "舒適的溫度適合散步",
                specificActivities: ["公園散步", "城市漫遊", "逛街購物"]
            ))

            suggestions.append(.init(
                activity: "攝影",
                icon: "📸",
                suitability: .good,
                reason: "光線適中，適合拍攝",
                specificActivities: ["街拍", "風景攝影", "人像拍攝"]
            ))
        }

        // 炎热天气
        if temp >= 28 {
            suggestions.append(.init(
                activity: "水上活動",
                icon: "🏊",
                suitability: .perfect,
                reason: "高溫天氣適合玩水",
                specificActivities: ["游泳", "水上樂園", "海灘玩水"]
            ))

            suggestions.append(.init(
                activity: "室內活動",
                icon: "🏢",
                suitability: .good,
                reason: "避暑納涼",
                specificActivities: ["電影院", "博物館", "購物中心", "健身房"]
            ))

            if condition == .clear {
                suggestions.append(.init(
                    activity: "傍晚戶外",
                    icon: "🌆",
                    suitability: .good,
                    reason: "傍晚較涼爽",
                    specificActivities: ["黃昏散步", "夜市", "露天餐廳"]
                ))
            }
        }

        // 寒冷天气
        if temp < 10 {
            suggestions.append(.init(
                activity: "室內運動",
                icon: "🏋️",
                suitability: .good,
                reason: "天氣寒冷，適合室內活動",
                specificActivities: ["健身房", "瑜伽", "游泳池"]
            ))

            suggestions.append(.init(
                activity: "溫暖場所",
                icon: "☕",
                suitability: .good,
                reason: "寒冷天氣適合取暖",
                specificActivities: ["咖啡廳", "圖書館", "溫泉", "火鍋店"]
            ))

            if condition == .snow {
                suggestions.append(.init(
                    activity: "雪上活動",
                    icon: "⛷️",
                    suitability: .perfect,
                    reason: "難得的雪天",
                    specificActivities: ["滑雪", "堆雪人", "賞雪"]
                ))
            }
        }

        // 雨天
        if condition == .rain || condition == .drizzle {
            suggestions.append(.init(
                activity: "室內娛樂",
                icon: "🎮",
                suitability: .good,
                reason: "雨天適合室內活動",
                specificActivities: ["看電影", "閱讀", "遊戲", "烘焙"]
            ))

            if temp >= 15 {
                suggestions.append(.init(
                    activity: "雨中漫步",
                    icon: "☔",
                    suitability: .moderate,
                    reason: "撐傘欣賞雨景",
                    specificActivities: ["雨中散步", "聽雨聲"]
                ))
            }
        }

        // 多云天气 - 适合摄影
        if condition == .cloudy && windSpeed < 5 {
            suggestions.append(.init(
                activity: "攝影創作",
                icon: "📷",
                suitability: .good,
                reason: "柔和光線適合攝影",
                specificActivities: ["風景攝影", "人像拍攝", "街拍"]
            ))
        }

        // 排序建议（按适合度）
        return suggestions.sorted { $0.suitability.rawValue > $1.suitability.rawValue }
    }

    // MARK: - AI 天气分析

    /// 分析天气并提供洞察
    func analyzeWeather(for weather: Weather) -> WeatherAnalysis {
        let temp = weather.temperature
        let feelsLike = weather.feelsLike
        let condition = weather.condition
        let humidity = weather.humidity
        let windSpeed = weather.windSpeed

        var insights: [String] = []
        var warnings: [WeatherWarning] = []
        var healthTips: [String] = []

        // 温度分析
        let tempDiff = abs(temp - feelsLike)
        if tempDiff > 5 {
            if feelsLike < temp {
                insights.append("由於風寒效應，體感溫度比實際溫度低 \(Int(tempDiff))°")
            } else {
                insights.append("由於濕度影響，體感溫度比實際溫度高 \(Int(tempDiff))°")
            }
        }

        // 湿度分析
        switch humidity {
        case 0..<30:
            insights.append("空氣乾燥（濕度 \(humidity)%），建議多補充水分")
            healthTips.append("使用保濕產品保護皮膚")
        case 30..<60:
            insights.append("濕度適中（\(humidity)%），體感舒適")
        case 60..<80:
            insights.append("濕度較高（\(humidity)%），可能感覺悶熱")
            if temp > 25 {
                healthTips.append("高溫高濕，注意防暑")
            }
        default:
            insights.append("濕度很高（\(humidity)%），體感較不舒適")
            warnings.append(.init(
                type: .highHumidity,
                message: "高濕度環境",
                severity: .moderate
            ))
        }

        // 温度警告
        if temp >= 35 {
            warnings.append(.init(
                type: .extremeHeat,
                message: "極端高溫警告",
                severity: .high
            ))
            healthTips.append("避免長時間戶外活動")
            healthTips.append("多喝水，注意防暑")
        } else if temp >= 30 {
            warnings.append(.init(
                type: .highTemperature,
                message: "高溫提醒",
                severity: .moderate
            ))
            healthTips.append("注意防曬和補充水分")
        }

        if temp <= 0 {
            warnings.append(.init(
                type: .freezing,
                message: "冰點以下溫度",
                severity: .high
            ))
            healthTips.append("做好保暖措施，避免凍傷")
        } else if temp < 5 {
            warnings.append(.init(
                type: .lowTemperature,
                message: "低溫提醒",
                severity: .moderate
            ))
            healthTips.append("注意保暖，預防感冒")
        }

        // 风速警告
        let windKmh = windSpeed * 3.6
        if windKmh > 50 {
            warnings.append(.init(
                type: .strongWind,
                message: "強風警告（\(Int(windKmh)) km/h）",
                severity: .high
            ))
            healthTips.append("避免高處作業，小心行走")
        } else if windKmh > 30 {
            insights.append("風力較強（\(Int(windKmh)) km/h）")
        }

        // 天气状况分析
        switch condition {
        case .thunderstorm:
            warnings.append(.init(
                type: .thunderstorm,
                message: "雷暴天氣",
                severity: .high
            ))
            healthTips.append("避免戶外活動，遠離空曠地帶")

        case .rain:
            insights.append("降雨天氣，出門記得帶雨具")
            healthTips.append("路面濕滑，注意安全")

        case .snow:
            insights.append("降雪天氣，路面可能結冰")
            healthTips.append("穿著防滑鞋，小心行走")

        case .mist:
            insights.append("能見度較低，注意交通安全")

        default:
            break
        }

        // UV 指数（基于天气和温度估算）
        let uvIndex = estimateUVIndex(condition: condition, temp: temp)
        if uvIndex > 7 {
            healthTips.append("紫外線強烈，做好防曬措施")
        }

        return WeatherAnalysis(
            insights: insights,
            warnings: warnings,
            healthTips: healthTips,
            uvIndex: uvIndex,
            comfortIndex: calculateComfortLevel(temp: temp, condition: condition, windSpeed: windSpeed)
        )
    }

    // MARK: - Private Helpers

    private func calculateComfortLevel(temp: Double, condition: WeatherCondition, windSpeed: Double) -> ComfortLevel {
        var score = 5

        // 温度评分
        if temp >= 18 && temp <= 26 {
            score += 2
        } else if temp >= 15 && temp <= 30 {
            score += 0
        } else if temp < 10 || temp > 32 {
            score -= 2
        }

        // 天气状况评分
        switch condition {
        case .clear:
            score += 2
        case .cloudy:
            score += 0
        case .rain, .drizzle:
            score -= 1
        case .thunderstorm, .snow:
            score -= 2
        case .mist:
            score -= 1
        }

        // 风速评分
        if windSpeed > 10 {
            score -= 1
        }

        switch score {
        case 8...:
            return .perfect
        case 6..<8:
            return .comfortable
        case 4..<6:
            return .moderate
        case 2..<4:
            return .uncomfortable
        default:
            return .poor
        }
    }

    private func generateClothingSummary(temp: Double, condition: WeatherCondition) -> String {
        switch temp {
        case ..<0:
            return "極寒天氣，需要厚重保暖衣物"
        case 0..<10:
            return "寒冷天氣，建議穿著保暖外套"
        case 10..<20:
            return "微涼天氣，薄外套即可"
        case 20..<28:
            return "舒適溫度，輕便服裝"
        default:
            return "炎熱天氣，穿著清涼透氣"
        }
    }

    private func estimateUVIndex(condition: WeatherCondition, temp: Double) -> Int {
        var index = 5

        switch condition {
        case .clear:
            index = temp > 25 ? 9 : 7
        case .cloudy:
            index = 5
        case .rain, .drizzle, .thunderstorm, .snow, .mist:
            index = 2
        }

        return index
    }
}

// MARK: - Supporting Types

/// 穿衣建议
struct ClothingAdvice {
    let clothes: [ClothingItem]
    let accessories: [ClothingItem]
    let tips: [String]
    let comfortLevel: ComfortLevel
    let summary: String
}

/// 服装项目
struct ClothingItem: Identifiable {
    let id = UUID()
    let name: String
    let icon: String
    let reason: String
}

/// 活动建议
struct ActivitySuggestion: Identifiable {
    let id = UUID()
    let activity: String
    let icon: String
    let suitability: ActivitySuitability
    let reason: String
    let specificActivities: [String]
}

/// 活动适合度
enum ActivitySuitability: Int {
    case perfect = 5
    case good = 4
    case moderate = 3
    case notRecommended = 2
    case avoid = 1

    var text: String {
        switch self {
        case .perfect: return "非常適合"
        case .good: return "適合"
        case .moderate: return "尚可"
        case .notRecommended: return "不推薦"
        case .avoid: return "避免"
        }
    }

    var color: Color {
        switch self {
        case .perfect: return .green
        case .good: return .blue
        case .moderate: return .orange
        case .notRecommended: return .orange
        case .avoid: return .red
        }
    }
}

/// 舒适度等级
enum ComfortLevel: Int {
    case perfect = 5
    case comfortable = 4
    case moderate = 3
    case uncomfortable = 2
    case poor = 1

    var text: String {
        switch self {
        case .perfect: return "完美"
        case .comfortable: return "舒適"
        case .moderate: return "尚可"
        case .uncomfortable: return "不適"
        case .poor: return "極差"
        }
    }

    var color: Color {
        switch self {
        case .perfect: return .green
        case .comfortable: return .blue
        case .moderate: return .yellow
        case .uncomfortable: return .orange
        case .poor: return .red
        }
    }

    var icon: String {
        switch self {
        case .perfect: return "face.smiling.fill"
        case .comfortable: return "face.smiling"
        case .moderate: return "minus.circle"
        case .uncomfortable: return "exclamationmark.triangle"
        case .poor: return "xmark.circle"
        }
    }
}

/// 天气分析
struct WeatherAnalysis {
    let insights: [String]
    let warnings: [WeatherWarning]
    let healthTips: [String]
    let uvIndex: Int
    let comfortIndex: ComfortLevel

    var uvLevel: String {
        switch uvIndex {
        case 0..<3: return "低"
        case 3..<6: return "中等"
        case 6..<8: return "高"
        case 8..<11: return "非常高"
        default: return "極高"
        }
    }
}

/// 天气警告
struct WeatherWarning: Identifiable {
    let id = UUID()
    let type: WarningType
    let message: String
    let severity: WarningSeverity

    enum WarningType {
        case extremeHeat
        case highTemperature
        case lowTemperature
        case freezing
        case strongWind
        case thunderstorm
        case highHumidity
    }

    enum WarningSeverity {
        case low
        case moderate
        case high

        var color: Color {
            switch self {
            case .low: return .yellow
            case .moderate: return .orange
            case .high: return .red
            }
        }

        var icon: String {
            switch self {
            case .low: return "exclamationmark.triangle"
            case .moderate: return "exclamationmark.triangle.fill"
            case .high: return "exclamationmark.octagon.fill"
            }
        }
    }
}
