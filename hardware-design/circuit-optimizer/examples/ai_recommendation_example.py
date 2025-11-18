"""
AI 元件推荐系统使用示例
展示如何使用 AI 驱动的智能推荐功能
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.ai_recommender import AIComponentRecommender, SmartDesignValidator, DesignAnomaly


def example_basic_recommendation():
    """基本推荐示例"""
    print("=" * 70)
    print("示例 1: 基本元件推荐")
    print("=" * 70 + "\n")

    recommender = AIComponentRecommender()

    # 场景: 设计一个 3.3V 电源
    print("需求: 设计一个 3.3V 500mA 的电源电路")
    print("-" * 70)

    component, cost, confidence = recommender.recommend_component(
        voltage=3.3,
        current=0.5,
        frequency=0,
        temperature_range=(-20, 85),
        cost_target=0.5,
        power_budget=2.0
    )

    print(f"✓ 推荐元件: {component}")
    print(f"✓ 预测成本: ${cost:.3f}")
    print(f"✓ AI 置信度: {confidence*100:.1f}%")
    print()


def example_multiple_recommendations():
    """多个推荐选项示例"""
    print("=" * 70)
    print("示例 2: 获取多个推荐选项")
    print("=" * 70 + "\n")

    recommender = AIComponentRecommender()

    # 场景: 5V 1A 电源
    print("需求: 5V 1A 电源，比较多个方案")
    print("-" * 70)

    recommendations = recommender.get_top_recommendations(
        voltage=5.0,
        current=1.0,
        n_recommendations=5,
        temperature_range=(-40, 85),
        cost_target=1.0
    )

    print(f"找到 {len(recommendations)} 个推荐方案:\n")
    print(f"{'排名':<6} {'元件型号':<20} {'预测成本':<12} {'置信度':<10}")
    print("-" * 70)

    for i, (comp, cost, conf) in enumerate(recommendations, 1):
        print(f"{i:<6} {comp:<20} ${cost:<11.2f} {conf*100:<9.1f}%")

    print()


def example_anomaly_detection():
    """异常检测示例"""
    print("=" * 70)
    print("示例 3: 设计异常检测")
    print("=" * 70 + "\n")

    recommender = AIComponentRecommender()

    # 场景 1: 正常设计
    print("场景 1: 正常的 3.3V 设计")
    print("-" * 70)
    normal_design = {
        'voltage': 3.3,
        'current': 0.5,
        'temperature_range': (-40, 85),
        'cost_target': 0.5
    }

    anomalies = recommender.detect_design_anomalies(normal_design)
    if anomalies:
        for anomaly in anomalies:
            print(f"[{anomaly.severity.upper()}] {anomaly.message}")
            print(f"  → {anomaly.suggestion}")
    else:
        print("✓ 未检测到异常，设计参数合理")
    print()

    # 场景 2: 有问题的设计
    print("场景 2: 高功耗设计（可能有问题）")
    print("-" * 70)
    problematic_design = {
        'voltage': 12,
        'current': 3,  # 36W 功耗!
        'temperature_range': (-50, 150),  # 极端温度
        'cost_target': 0.05  # 成本过低
    }

    anomalies = recommender.detect_design_anomalies(problematic_design)
    if anomalies:
        print(f"检测到 {len(anomalies)} 个潜在问题:\n")
        for i, anomaly in enumerate(anomalies, 1):
            print(f"{i}. [{anomaly.severity.upper()}] {anomaly.category}: {anomaly.message}")
            print(f"   建议: {anomaly.suggestion}\n")
    else:
        print("✓ 未检测到异常")
    print()


def example_design_validation():
    """设计验证示例"""
    print("=" * 70)
    print("示例 4: 智能设计验证")
    print("=" * 70 + "\n")

    validator = SmartDesignValidator()

    # 测试案例 1: 合格设计
    print("案例 1: 验证一个 5V LDO 设计")
    print("-" * 70)

    component = {
        'name': 'AMS1117-5.0',
        'voltage_rating': 15,
        'current_rating': 1.0,
        'power_rating': 1.0,
        'temperature_range': (-40, 125)
    }

    operating_conditions = {
        'voltage': 5.0,
        'current': 0.5,
        'ambient_temp': 25
    }

    passed, warnings = validator.validate_design(component, operating_conditions)

    print(f"元件: {component['name']}")
    print(f"工作条件: {operating_conditions['voltage']}V @ {operating_conditions['current']}A")
    print(f"环境温度: {operating_conditions['ambient_temp']}°C")
    print()

    if passed:
        print("✓ 验证结果: 通过")
    else:
        print("✗ 验证结果: 失败")

    if warnings:
        print("\n警告信息:")
        for warning in warnings:
            print(f"  ⚠ {warning}")
    else:
        print("  无警告")
    print()

    # 测试案例 2: 不合格设计
    print("案例 2: 验证一个余量不足的设计")
    print("-" * 70)

    component_weak = {
        'name': 'Weak-LDO',
        'voltage_rating': 8,   # 余量不足
        'current_rating': 0.6,  # 余量不足
        'power_rating': 0.5,    # 余量不足
        'temperature_range': (-40, 85)
    }

    operating_conditions_high = {
        'voltage': 5.0,
        'current': 0.5,
        'ambient_temp': 70  # 高温
    }

    passed, warnings = validator.validate_design(component_weak, operating_conditions_high)

    print(f"元件: {component_weak['name']}")
    print(f"工作条件: {operating_conditions_high['voltage']}V @ {operating_conditions_high['current']}A")
    print(f"环境温度: {operating_conditions_high['ambient_temp']}°C")
    print()

    if passed:
        print("✓ 验证结果: 通过")
    else:
        print("✗ 验证结果: 失败")

    if warnings:
        print("\n警告信息:")
        for warning in warnings:
            print(f"  ⚠ {warning}")
    print()


def example_integrated_workflow():
    """集成工作流示例"""
    print("=" * 70)
    print("示例 5: 完整的 AI 辅助设计工作流")
    print("=" * 70 + "\n")

    recommender = AIComponentRecommender()
    validator = SmartDesignValidator()

    # 步骤 1: 定义需求
    print("步骤 1: 定义设计需求")
    print("-" * 70)
    requirements = {
        'voltage': 3.3,
        'current': 0.8,
        'temperature_range': (-40, 85),
        'cost_target': 0.3,
        'power_budget': 3.0
    }

    print(f"输出电压: {requirements['voltage']}V")
    print(f"输出电流: {requirements['current']}A")
    print(f"温度范围: {requirements['temperature_range']}°C")
    print(f"成本目标: ${requirements['cost_target']}")
    print()

    # 步骤 2: 检测异常
    print("步骤 2: AI 异常检测")
    print("-" * 70)
    anomalies = recommender.detect_design_anomalies(requirements)
    if anomalies:
        for anomaly in anomalies:
            print(f"[{anomaly.severity.upper()}] {anomaly.message}")
    else:
        print("✓ 参数检查通过")
    print()

    # 步骤 3: 获取推荐
    print("步骤 3: AI 元件推荐")
    print("-" * 70)
    component_name, cost, confidence = recommender.recommend_component(
        **requirements
    )
    print(f"推荐元件: {component_name}")
    print(f"预测成本: ${cost:.3f}")
    print(f"置信度: {confidence*100:.1f}%")
    print()

    # 步骤 4: 验证设计
    print("步骤 4: 设计验证")
    print("-" * 70)

    # 构造元件参数（这里使用假设值）
    selected_component = {
        'name': component_name,
        'voltage_rating': 15,
        'current_rating': 1.0,
        'power_rating': 1.0,
        'temperature_range': requirements['temperature_range']
    }

    operating_conditions = {
        'voltage': requirements['voltage'],
        'current': requirements['current'],
        'ambient_temp': 25
    }

    passed, warnings = validator.validate_design(
        selected_component,
        operating_conditions
    )

    if passed:
        print("✓ 设计验证通过")
    else:
        print("✗ 设计验证失败")

    if warnings:
        for warning in warnings:
            print(f"  ⚠ {warning}")
    print()

    # 步骤 5: 总结
    print("步骤 5: 设计总结")
    print("-" * 70)
    print(f"✓ 推荐方案: {component_name}")
    print(f"✓ 预计成本: ${cost:.3f}")
    print(f"✓ 设计状态: {'通过验证' if passed else '需要调整'}")
    print()


def main():
    """主函数"""
    print("\n")
    print("╔" + "=" * 68 + "╗")
    print("║" + " " * 15 + "AI 元件推荐系统 - 完整示例" + " " * 15 + "║")
    print("╚" + "=" * 68 + "╝")
    print("\n")

    # 运行所有示例
    example_basic_recommendation()
    example_multiple_recommendations()
    example_anomaly_detection()
    example_design_validation()
    example_integrated_workflow()

    print("=" * 70)
    print("所有示例运行完成！")
    print("=" * 70)
    print()


if __name__ == "__main__":
    main()
