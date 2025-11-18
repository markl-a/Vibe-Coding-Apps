"""
机器学习热分析预测器

使用卷积神经网络（CNN）快速预测PCB温度分布
"""

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional, Tuple, Dict
import os


class ThermalCNN(nn.Module):
    """热分析CNN模型 - U-Net架构"""

    def __init__(self, in_channels: int = 3, out_channels: int = 1):
        """
        初始化热分析CNN

        Args:
            in_channels: 输入通道数 (功率分布, 材料属性, 边界条件)
            out_channels: 输出通道数 (温度分布)
        """
        super(ThermalCNN, self).__init__()

        # 编码器（下采样）
        self.enc1 = self._conv_block(in_channels, 64)
        self.pool1 = nn.MaxPool2d(2)

        self.enc2 = self._conv_block(64, 128)
        self.pool2 = nn.MaxPool2d(2)

        self.enc3 = self._conv_block(128, 256)
        self.pool3 = nn.MaxPool2d(2)

        # 瓶颈层
        self.bottleneck = self._conv_block(256, 512)

        # 解码器（上采样）
        self.upconv3 = nn.ConvTranspose2d(512, 256, 2, stride=2)
        self.dec3 = self._conv_block(512, 256)

        self.upconv2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2 = self._conv_block(256, 128)

        self.upconv1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = self._conv_block(128, 64)

        # 输出层
        self.out = nn.Conv2d(64, out_channels, kernel_size=1)

    def _conv_block(self, in_ch: int, out_ch: int) -> nn.Sequential:
        """创建卷积块"""
        return nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        """前向传播"""
        # 编码器
        enc1 = self.enc1(x)
        enc2 = self.enc2(self.pool1(enc1))
        enc3 = self.enc3(self.pool2(enc2))

        # 瓶颈层
        bottleneck = self.bottleneck(self.pool3(enc3))

        # 解码器（带跳跃连接）
        dec3 = self.upconv3(bottleneck)
        dec3 = torch.cat([dec3, enc3], dim=1)
        dec3 = self.dec3(dec3)

        dec2 = self.upconv2(dec3)
        dec2 = torch.cat([dec2, enc2], dim=1)
        dec2 = self.dec2(dec2)

        dec1 = self.upconv1(dec2)
        dec1 = torch.cat([dec1, enc1], dim=1)
        dec1 = self.dec1(dec1)

        # 输出
        out = self.out(dec1)

        return out


class SimpleThermalCNN(nn.Module):
    """简化的热分析CNN模型 - 适用于小型PCB"""

    def __init__(self, in_channels: int = 3):
        """
        初始化简化CNN

        Args:
            in_channels: 输入通道数
        """
        super(SimpleThermalCNN, self).__init__()

        self.features = nn.Sequential(
            nn.Conv2d(in_channels, 64, 5, padding=2),
            nn.ReLU(),
            nn.Conv2d(64, 128, 5, padding=2),
            nn.ReLU(),
            nn.Conv2d(128, 128, 5, padding=2),
            nn.ReLU(),
            nn.Conv2d(128, 64, 5, padding=2),
            nn.ReLU(),
            nn.Conv2d(64, 1, 3, padding=1)
        )

    def forward(self, x):
        return self.features(x)


class MLThermalPredictor:
    """机器学习热分析预测器"""

    def __init__(self, model_type: str = 'unet',
                 model_path: Optional[str] = None):
        """
        初始化ML预测器

        Args:
            model_type: 模型类型 ('unet', 'simple')
            model_path: 预训练模型路径
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # 创建模型
        if model_type == 'unet':
            self.model = ThermalCNN(in_channels=3, out_channels=1)
        elif model_type == 'simple':
            self.model = SimpleThermalCNN(in_channels=3)
        else:
            raise ValueError(f"未知模型类型: {model_type}")

        self.model.to(self.device)
        self.model_type = model_type

        # 加载预训练模型
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
            print(f"已加载预训练模型: {model_path}")
        else:
            print("使用未训练的模型（需要训练或提供预训练模型）")

    def prepare_input(self,
                     power_grid: np.ndarray,
                     thermal_conductivity: float = 0.3,
                     convection_coeff: float = 10.0,
                     ambient_temp: float = 25.0) -> torch.Tensor:
        """
        准备模型输入

        Args:
            power_grid: 功率分布 (W/m²)
            thermal_conductivity: 热导率
            convection_coeff: 对流系数
            ambient_temp: 环境温度

        Returns:
            输入张量 [1, 3, H, W]
        """
        h, w = power_grid.shape

        # 归一化功率分布
        power_normalized = power_grid / (np.max(power_grid) + 1e-6)

        # 材料属性图（常数）
        material_map = np.ones((h, w)) * thermal_conductivity / 400.0  # 归一化

        # 边界条件图（常数）
        boundary_map = np.ones((h, w)) * convection_coeff / 100.0  # 归一化

        # 堆叠输入通道
        input_data = np.stack([power_normalized, material_map, boundary_map], axis=0)

        # 转换为张量
        input_tensor = torch.FloatTensor(input_data).unsqueeze(0).to(self.device)

        return input_tensor

    def predict(self,
                power_grid: np.ndarray,
                thermal_conductivity: float = 0.3,
                convection_coeff: float = 10.0,
                ambient_temp: float = 25.0) -> np.ndarray:
        """
        预测温度分布

        Args:
            power_grid: 功率分布
            thermal_conductivity: 热导率
            convection_coeff: 对流系数
            ambient_temp: 环境温度

        Returns:
            温度分布网格
        """
        # 准备输入
        input_tensor = self.prepare_input(
            power_grid, thermal_conductivity,
            convection_coeff, ambient_temp
        )

        # 预测
        self.model.eval()
        with torch.no_grad():
            output = self.model(input_tensor)

        # 转换回numpy
        temp_normalized = output.squeeze().cpu().numpy()

        # 反归一化温度（假设最大温度范围 0-150°C）
        temp_grid = temp_normalized * 150.0 + ambient_temp

        # 确保温度合理
        temp_grid = np.clip(temp_grid, ambient_temp, 200.0)

        return temp_grid

    def train_model(self,
                   train_data: list,
                   val_data: Optional[list] = None,
                   epochs: int = 100,
                   learning_rate: float = 1e-3,
                   batch_size: int = 8):
        """
        训练模型

        Args:
            train_data: 训练数据列表 [(power_grid, temp_grid), ...]
            val_data: 验证数据列表
            epochs: 训练轮数
            learning_rate: 学习率
            batch_size: 批次大小
        """
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        criterion = nn.MSELoss()

        best_val_loss = float('inf')
        train_losses = []
        val_losses = []

        print(f"开始训练 {self.model_type} 模型...")
        print(f"训练样本数: {len(train_data)}")
        print(f"验证样本数: {len(val_data) if val_data else 0}")

        for epoch in range(epochs):
            self.model.train()
            epoch_loss = 0.0
            num_batches = 0

            # 训练
            for i in range(0, len(train_data), batch_size):
                batch = train_data[i:i+batch_size]

                batch_input = []
                batch_target = []

                for power_grid, temp_grid in batch:
                    # 准备输入
                    input_tensor = self.prepare_input(power_grid)

                    # 准备目标（归一化）
                    temp_normalized = (temp_grid - 25.0) / 150.0
                    target_tensor = torch.FloatTensor(temp_normalized).unsqueeze(0).to(self.device)

                    batch_input.append(input_tensor.squeeze(0))
                    batch_target.append(target_tensor.squeeze(0))

                batch_input = torch.stack(batch_input)
                batch_target = torch.stack(batch_target)

                # 前向传播
                output = self.model(batch_input)

                # 计算损失
                loss = criterion(output, batch_target)

                # 反向传播
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

                epoch_loss += loss.item()
                num_batches += 1

            avg_train_loss = epoch_loss / num_batches
            train_losses.append(avg_train_loss)

            # 验证
            if val_data:
                val_loss = self._validate(val_data, criterion)
                val_losses.append(val_loss)

                # 保存最佳模型
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    self.save_model('best_thermal_model.pth')

                if (epoch + 1) % 10 == 0:
                    print(f"Epoch {epoch+1}/{epochs} - "
                          f"Train Loss: {avg_train_loss:.6f}, "
                          f"Val Loss: {val_loss:.6f}")
            else:
                if (epoch + 1) % 10 == 0:
                    print(f"Epoch {epoch+1}/{epochs} - "
                          f"Train Loss: {avg_train_loss:.6f}")

        print("训练完成！")
        return train_losses, val_losses

    def _validate(self, val_data: list, criterion) -> float:
        """验证模型"""
        self.model.eval()
        total_loss = 0.0

        with torch.no_grad():
            for power_grid, temp_grid in val_data:
                input_tensor = self.prepare_input(power_grid)

                temp_normalized = (temp_grid - 25.0) / 150.0
                target_tensor = torch.FloatTensor(temp_normalized).unsqueeze(0).to(self.device)

                output = self.model(input_tensor)
                loss = criterion(output, target_tensor)
                total_loss += loss.item()

        return total_loss / len(val_data)

    def save_model(self, filepath: str):
        """保存模型"""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'model_type': self.model_type
        }, filepath)
        print(f"模型已保存: {filepath}")

    def load_model(self, filepath: str):
        """加载模型"""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model_type = checkpoint.get('model_type', self.model_type)
        self.model.eval()
        print(f"模型已加载: {filepath}")


def generate_training_data(num_samples: int = 1000,
                          grid_size: Tuple[int, int] = (80, 80)) -> list:
    """
    生成训练数据（使用FDM模拟）

    Args:
        num_samples: 样本数量
        grid_size: 网格大小

    Returns:
        训练数据列表 [(power_grid, temp_grid), ...]
    """
    from .fdm_solver import fdm_steady_state

    print(f"生成 {num_samples} 个训练样本...")

    training_data = []

    for i in range(num_samples):
        # 随机生成热源配置
        power_grid = np.zeros(grid_size)

        # 随机添加1-5个热源
        num_sources = np.random.randint(1, 6)

        for _ in range(num_sources):
            # 随机位置和大小
            x = np.random.randint(10, grid_size[1] - 20)
            y = np.random.randint(10, grid_size[0] - 20)
            w = np.random.randint(5, 15)
            h = np.random.randint(5, 15)

            # 随机功率密度 (500 - 10000 W/m²)
            power_density = np.random.uniform(500, 10000)

            power_grid[y:y+h, x:x+w] = power_density

        # 使用FDM计算温度分布
        temp_grid = fdm_steady_state(
            power_grid=power_grid,
            initial_temp=25.0,
            thermal_conductivity=0.3,
            convection_coeff=10.0,
            ambient_temp=25.0,
            max_iterations=500,
            convergence=0.1,
            resolution=1.0
        )

        training_data.append((power_grid, temp_grid))

        if (i + 1) % 100 == 0:
            print(f"  已生成 {i+1}/{num_samples} 样本")

    print("训练数据生成完成！")
    return training_data


def ml_predict_temperature(power_grid: np.ndarray,
                          thermal_conductivity: float = 0.3,
                          convection_coeff: float = 10.0,
                          ambient_temp: float = 25.0,
                          model_path: Optional[str] = None) -> np.ndarray:
    """
    使用ML模型预测温度的便捷函数

    Args:
        power_grid: 功率分布
        thermal_conductivity: 热导率
        convection_coeff: 对流系数
        ambient_temp: 环境温度
        model_path: 模型路径

    Returns:
        温度分布
    """
    predictor = MLThermalPredictor(model_type='simple', model_path=model_path)

    temp_grid = predictor.predict(
        power_grid,
        thermal_conductivity,
        convection_coeff,
        ambient_temp
    )

    return temp_grid
