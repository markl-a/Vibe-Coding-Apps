"""
AI 驱动的元件推荐系统
使用机器学习模型提供智能化的元件推荐和设计验证
"""

from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
import pickle
import warnings
warnings.filterwarnings('ignore')


@dataclass
class DesignPattern:
    """设计模式数据"""
    application: str  # 应用类型
    voltage: float  # 工作电压
    current: float  # 工作电流
    frequency: float  # 工作频率
    temperature_range: Tuple[float, float]  # 温度范围
    cost_target: float  # 成本目标
    power_budget: float  # 功耗预算
    selected_component: str  # 选择的元件


@dataclass
class DesignAnomaly:
    """设计异常"""
    severity: str  # 严重程度: 'warning', 'error', 'critical'
    category: str  # 类别
    message: str  # 描述
    suggestion: str  # 建议


class AIComponentRecommender:
    """AI 元件推荐器"""

    def __init__(self):
        """初始化推荐器"""
        self.component_classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.cost_predictor = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.component_mapping = {}

        # 生成训练数据
        self._generate_training_data()

    def _generate_training_data(self):
        """生成训练数据（模拟历史设计数据）"""
        np.random.seed(42)

        # 定义元件类型
        components = [
            'LM7805',      # 5V 稳压器
            'AMS1117-3.3', # 3.3V LDO
            'AMS1117-5.0', # 5V LDO
            'LM2596',      # 开关稳压器
            'TLV1117-33',  # 低压差稳压器
            'XC6206',      # 微功耗 LDO
        ]

        self.component_mapping = {i: comp for i, comp in enumerate(components)}

        # 生成训练样本
        n_samples = 500
        features = []
        labels = []
        costs = []

        for _ in range(n_samples):
            # 随机生成设计参数
            voltage = np.random.choice([3.3, 5.0, 12.0])
            current = np.random.uniform(0.1, 2.0)
            frequency = np.random.uniform(0, 1000000)
            temp_min = np.random.choice([-40, -20, 0])
            temp_max = np.random.choice([85, 105, 125])
            cost_target = np.random.uniform(0.1, 5.0)
            power_budget = voltage * current

            # 基于规则选择元件
            if voltage == 5.0 and current < 1.5:
                if cost_target < 0.3:
                    component_idx = 0  # LM7805
                    cost = 0.25
                else:
                    component_idx = 2  # AMS1117-5.0
                    cost = 0.15
            elif voltage == 3.3:
                if current < 0.3:
                    component_idx = 5  # XC6206
                    cost = 0.12
                elif current < 1.0:
                    component_idx = 1  # AMS1117-3.3
                    cost = 0.15
                else:
                    component_idx = 4  # TLV1117-33
                    cost = 0.20
            else:  # 12V 或大电流
                component_idx = 3  # LM2596
                cost = 0.50

            features.append([
                voltage, current, frequency,
                temp_min, temp_max,
                cost_target, power_budget
            ])
            labels.append(component_idx)
            costs.append(cost)

        self.X_train = np.array(features)
        self.y_train = np.array(labels)
        self.costs_train = np.array(costs)

    def train(self):
        """训练模型"""
        print("训练 AI 推荐模型...")

        # 标准化特征
        X_scaled = self.scaler.fit_transform(self.X_train)

        # 分割训练集和测试集
        X_train, X_test, y_train, y_test, cost_train, cost_test = train_test_split(
            X_scaled, self.y_train, self.costs_train,
            test_size=0.2, random_state=42
        )

        # 训练分类器（元件选择）
        self.component_classifier.fit(X_train, y_train)
        y_pred = self.component_classifier.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"  元件分类准确率: {accuracy*100:.1f}%")

        # 训练成本预测器
        self.cost_predictor.fit(X_train, cost_train)
        cost_pred = self.cost_predictor.predict(X_test)
        mse = mean_squared_error(cost_test, cost_pred)
        print(f"  成本预测 MSE: {mse:.4f}")

        self.is_trained = True
        print("模型训练完成！\n")

    def recommend_component(
        self,
        voltage: float,
        current: float,
        frequency: float = 0,
        temperature_range: Tuple[float, float] = (-40, 85),
        cost_target: float = 1.0,
        power_budget: float = 10.0
    ) -> Tuple[str, float, float]:
        """
        推荐元件

        Args:
            voltage: 输出电压 (V)
            current: 输出电流 (A)
            frequency: 工作频率 (Hz)
            temperature_range: 温度范围 (°C)
            cost_target: 成本目标 ($)
            power_budget: 功耗预算 (W)

        Returns:
            (推荐元件, 预测成本, 置信度)
        """
        if not self.is_trained:
            self.train()

        # 准备特征
        features = np.array([[
            voltage, current, frequency,
            temperature_range[0], temperature_range[1],
            cost_target, power_budget
        ]])

        # 标准化
        features_scaled = self.scaler.transform(features)

        # 预测元件
        component_idx = self.component_classifier.predict(features_scaled)[0]
        component_name = self.component_mapping[component_idx]

        # 预测成本
        predicted_cost = self.cost_predictor.predict(features_scaled)[0]

        # 计算置信度
        probabilities = self.component_classifier.predict_proba(features_scaled)[0]
        confidence = max(probabilities)

        return component_name, predicted_cost, confidence

    def get_top_recommendations(
        self,
        voltage: float,
        current: float,
        n_recommendations: int = 3,
        **kwargs
    ) -> List[Tuple[str, float, float]]:
        """
        获取多个推荐选项

        Args:
            voltage: 输出电压
            current: 输出电流
            n_recommendations: 推荐数量
            **kwargs: 其他参数

        Returns:
            推荐列表 [(元件, 成本, 置信度), ...]
        """
        if not self.is_trained:
            self.train()

        # 准备特征
        features = np.array([[
            voltage,
            current,
            kwargs.get('frequency', 0),
            kwargs.get('temperature_range', (-40, 85))[0],
            kwargs.get('temperature_range', (-40, 85))[1],
            kwargs.get('cost_target', 1.0),
            kwargs.get('power_budget', 10.0)
        ]])

        features_scaled = self.scaler.transform(features)

        # 获取所有元件的概率
        probabilities = self.component_classifier.predict_proba(features_scaled)[0]

        # 排序并获取 top N
        top_indices = np.argsort(probabilities)[::-1][:n_recommendations]

        recommendations = []
        for idx in top_indices:
            component_name = self.component_mapping[idx]
            confidence = probabilities[idx]

            # 预测成本（这里简化处理）
            predicted_cost = self.cost_predictor.predict(features_scaled)[0]

            recommendations.append((component_name, predicted_cost, confidence))

        return recommendations

    def detect_design_anomalies(
        self,
        design_params: Dict[str, Any]
    ) -> List[DesignAnomaly]:
        """
        检测设计异常

        Args:
            design_params: 设计参数字典

        Returns:
            异常列表
        """
        anomalies = []

        voltage = design_params.get('voltage', 0)
        current = design_params.get('current', 0)
        power = voltage * current

        # 检查功耗
        if power > 5:
            anomalies.append(DesignAnomaly(
                severity='warning',
                category='power',
                message=f'功耗过高: {power:.2f}W',
                suggestion='考虑使用开关稳压器以提高效率'
            ))

        # 检查电流
        if current > 2:
            anomalies.append(DesignAnomaly(
                severity='warning',
                category='current',
                message=f'电流过大: {current:.2f}A',
                suggestion='确保选择合适的电流等级元件'
            ))

        # 检查电压
        if voltage > 12:
            anomalies.append(DesignAnomaly(
                severity='warning',
                category='voltage',
                message=f'电压较高: {voltage:.1f}V',
                suggestion='注意元件耐压等级，建议至少 1.5 倍余量'
            ))

        # 检查温度范围
        temp_range = design_params.get('temperature_range', (-40, 85))
        if temp_range[0] < -40 or temp_range[1] > 125:
            anomalies.append(DesignAnomaly(
                severity='error',
                category='temperature',
                message=f'温度范围超出常规范围: {temp_range}',
                suggestion='检查是否需要工业级或军规级元件'
            ))

        # 检查成本合理性
        cost_target = design_params.get('cost_target', 1.0)
        if cost_target < 0.1:
            anomalies.append(DesignAnomaly(
                severity='warning',
                category='cost',
                message=f'成本目标过低: ${cost_target:.2f}',
                suggestion='可能难以找到满足要求的元件'
            ))

        return anomalies

    def save_model(self, filepath: str):
        """保存模型"""
        model_data = {
            'classifier': self.component_classifier,
            'regressor': self.cost_predictor,
            'scaler': self.scaler,
            'mapping': self.component_mapping,
            'is_trained': self.is_trained
        }
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        print(f"模型已保存到: {filepath}")

    def load_model(self, filepath: str):
        """加载模型"""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)

        self.component_classifier = model_data['classifier']
        self.cost_predictor = model_data['regressor']
        self.scaler = model_data['scaler']
        self.component_mapping = model_data['mapping']
        self.is_trained = model_data['is_trained']
        print(f"模型已从 {filepath} 加载")


class SmartDesignValidator:
    """智能设计验证器"""

    def __init__(self):
        """初始化验证器"""
        self.rules = self._load_validation_rules()

    def _load_validation_rules(self) -> Dict:
        """加载验证规则"""
        return {
            'voltage_derating': 1.5,  # 电压降额系数
            'current_derating': 1.2,  # 电流降额系数
            'power_derating': 1.5,    # 功率降额系数
            'max_temp_rise': 20,      # 最大温升 (°C)
            'min_efficiency': 0.7,     # 最小效率
        }

    def validate_design(
        self,
        component: Dict[str, Any],
        operating_conditions: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """
        验证设计

        Args:
            component: 元件参数
            operating_conditions: 工作条件

        Returns:
            (是否通过, 警告列表)
        """
        warnings = []
        passed = True

        # 验证电压余量
        if 'voltage_rating' in component and 'voltage' in operating_conditions:
            required_rating = operating_conditions['voltage'] * self.rules['voltage_derating']
            if component['voltage_rating'] < required_rating:
                warnings.append(
                    f"电压余量不足: 需要 {required_rating:.1f}V, "
                    f"实际 {component['voltage_rating']:.1f}V"
                )
                passed = False

        # 验证电流余量
        if 'current_rating' in component and 'current' in operating_conditions:
            required_rating = operating_conditions['current'] * self.rules['current_derating']
            if component['current_rating'] < required_rating:
                warnings.append(
                    f"电流余量不足: 需要 {required_rating:.2f}A, "
                    f"实际 {component['current_rating']:.2f}A"
                )
                passed = False

        # 验证功率
        if 'power_rating' in component:
            operating_power = (
                operating_conditions.get('voltage', 0) *
                operating_conditions.get('current', 0)
            )
            required_rating = operating_power * self.rules['power_derating']
            if component['power_rating'] < required_rating:
                warnings.append(
                    f"功率余量不足: 需要 {required_rating:.2f}W, "
                    f"实际 {component['power_rating']:.2f}W"
                )
                passed = False

        # 验证温度
        if 'temperature_range' in component and 'ambient_temp' in operating_conditions:
            ambient = operating_conditions['ambient_temp']
            max_temp = ambient + self.rules['max_temp_rise']
            if max_temp > component['temperature_range'][1]:
                warnings.append(
                    f"温度可能超出范围: 预计 {max_temp}°C, "
                    f"最大 {component['temperature_range'][1]}°C"
                )

        return passed, warnings


def demonstrate_ai_recommender():
    """演示 AI 推荐器"""
    print("=" * 60)
    print("AI 元件推荐系统示范")
    print("=" * 60 + "\n")

    # 创建推荐器
    recommender = AIComponentRecommender()

    # 训练模型
    recommender.train()

    # 示例 1: 推荐 3.3V 稳压器
    print("示例 1: 推荐 3.3V 500mA 稳压器")
    print("-" * 60)
    component, cost, confidence = recommender.recommend_component(
        voltage=3.3,
        current=0.5,
        temperature_range=(-40, 85),
        cost_target=0.5
    )
    print(f"推荐元件: {component}")
    print(f"预测成本: ${cost:.2f}")
    print(f"置信度: {confidence*100:.1f}%\n")

    # 示例 2: 获取多个推荐
    print("示例 2: 获取 5V 1A 稳压器的多个推荐")
    print("-" * 60)
    recommendations = recommender.get_top_recommendations(
        voltage=5.0,
        current=1.0,
        n_recommendations=3
    )
    for i, (comp, cost, conf) in enumerate(recommendations, 1):
        print(f"{i}. {comp:20} - 成本: ${cost:.2f}, 置信度: {conf*100:.1f}%")
    print()

    # 示例 3: 异常检测
    print("示例 3: 设计异常检测")
    print("-" * 60)
    design_params = {
        'voltage': 12,
        'current': 3,
        'temperature_range': (-40, 125),
        'cost_target': 0.05
    }
    anomalies = recommender.detect_design_anomalies(design_params)
    if anomalies:
        for i, anomaly in enumerate(anomalies, 1):
            print(f"{i}. [{anomaly.severity.upper()}] {anomaly.category}")
            print(f"   问题: {anomaly.message}")
            print(f"   建议: {anomaly.suggestion}")
    else:
        print("未检测到异常")
    print()

    # 示例 4: 设计验证
    print("示例 4: 智能设计验证")
    print("-" * 60)
    validator = SmartDesignValidator()

    component = {
        'voltage_rating': 15,
        'current_rating': 1.0,
        'power_rating': 1.0,
        'temperature_range': (-40, 125)
    }

    operating_conditions = {
        'voltage': 12,
        'current': 0.8,
        'ambient_temp': 50
    }

    passed, warnings = validator.validate_design(component, operating_conditions)

    if passed:
        print("✓ 设计验证通过")
    else:
        print("✗ 设计验证失败")

    if warnings:
        print("\n警告:")
        for warning in warnings:
            print(f"  - {warning}")
    print()


if __name__ == "__main__":
    demonstrate_ai_recommender()
