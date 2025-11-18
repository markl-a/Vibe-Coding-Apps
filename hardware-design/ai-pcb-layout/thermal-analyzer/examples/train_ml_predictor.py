"""
训练热分析ML预测器示例
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import numpy as np
import matplotlib.pyplot as plt
from solvers.ml_predictor import MLThermalPredictor, generate_training_data
from solvers.fdm_solver import fdm_steady_state


def visualize_prediction_comparison(power_grid, fdm_result, ml_result, ambient_temp=25.0):
    """比较FDM和ML预测结果"""
    fig, axes = plt.subplots(2, 2, figsize=(14, 12))

    # 功率分布
    im0 = axes[0, 0].imshow(power_grid, cmap='YlOrRd', origin='lower')
    axes[0, 0].set_title('Power Distribution (W/m²)')
    plt.colorbar(im0, ax=axes[0, 0])

    # FDM结果
    im1 = axes[0, 1].imshow(fdm_result, cmap='hot', origin='lower',
                           vmin=ambient_temp, vmax=np.max(fdm_result))
    axes[0, 1].set_title('FDM Result (Ground Truth)')
    plt.colorbar(im1, ax=axes[0, 1], label='Temperature (°C)')

    # ML结果
    im2 = axes[1, 0].imshow(ml_result, cmap='hot', origin='lower',
                           vmin=ambient_temp, vmax=np.max(fdm_result))
    axes[1, 0].set_title('ML Prediction')
    plt.colorbar(im2, ax=axes[1, 0], label='Temperature (°C)')

    # 误差图
    error = np.abs(fdm_result - ml_result)
    im3 = axes[1, 1].imshow(error, cmap='viridis', origin='lower')
    axes[1, 1].set_title(f'Absolute Error (Mean: {np.mean(error):.2f}°C)')
    plt.colorbar(im3, ax=axes[1, 1], label='Error (°C)')

    plt.tight_layout()
    plt.savefig('ml_vs_fdm_comparison.png', dpi=150)
    plt.show()

    # 统计信息
    print(f"\n预测性能统计:")
    print(f"  平均绝对误差: {np.mean(error):.3f} °C")
    print(f"  最大绝对误差: {np.max(error):.3f} °C")
    print(f"  均方根误差: {np.sqrt(np.mean(error**2)):.3f} °C")
    print(f"  相对误差: {np.mean(error / (fdm_result - ambient_temp + 1e-6)) * 100:.2f}%")


def plot_training_curves(train_losses, val_losses):
    """绘制训练曲线"""
    plt.figure(figsize=(10, 6))

    plt.plot(train_losses, label='Training Loss', alpha=0.7)
    if val_losses:
        plt.plot(val_losses, label='Validation Loss', alpha=0.7)

    plt.xlabel('Epoch')
    plt.ylabel('Loss (MSE)')
    plt.title('Training Progress')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.yscale('log')

    plt.tight_layout()
    plt.savefig('training_curves.png', dpi=150)
    plt.show()


def test_predictor_speed(predictor, power_grid, num_runs=10):
    """测试预测速度"""
    import time

    print(f"\n速度测试 ({num_runs} 次运行)...")

    # ML预测速度
    start_time = time.time()
    for _ in range(num_runs):
        ml_result = predictor.predict(power_grid)
    ml_time = (time.time() - start_time) / num_runs

    # FDM速度（参考）
    start_time = time.time()
    for _ in range(num_runs):
        fdm_result = fdm_steady_state(
            power_grid=power_grid,
            initial_temp=25.0,
            thermal_conductivity=0.3,
            convection_coeff=10.0,
            ambient_temp=25.0,
            max_iterations=500,
            convergence=0.1,
            resolution=1.0
        )
    fdm_time = (time.time() - start_time) / num_runs

    print(f"  ML 预测时间: {ml_time*1000:.2f} ms")
    print(f"  FDM 求解时间: {fdm_time*1000:.2f} ms")
    print(f"  加速比: {fdm_time/ml_time:.1f}x")


def create_test_case(grid_size=(80, 80)):
    """创建测试用例"""
    power_grid = np.zeros(grid_size)

    # 添加几个热源
    # 中心热源（高功率）
    power_grid[30:40, 35:45] = 8000

    # 左上角热源
    power_grid[10:18, 10:18] = 3000

    # 右下角热源
    power_grid[60:70, 60:70] = 5000

    return power_grid


def main():
    """主函数"""
    print("=" * 60)
    print("PCB 热分析 - ML预测器训练示例")
    print("=" * 60)

    # 设置参数
    grid_size = (80, 80)
    num_train_samples = 500
    num_val_samples = 100
    epochs = 50

    # 生成训练数据
    print(f"\n生成训练数据...")
    print(f"  训练样本: {num_train_samples}")
    print(f"  验证样本: {num_val_samples}")

    train_data = generate_training_data(num_train_samples, grid_size)
    val_data = generate_training_data(num_val_samples, grid_size)

    # 创建预测器
    print(f"\n创建ML预测器...")
    predictor = MLThermalPredictor(model_type='simple')

    # 训练模型
    print(f"\n开始训练...")
    train_losses, val_losses = predictor.train_model(
        train_data=train_data,
        val_data=val_data,
        epochs=epochs,
        learning_rate=1e-3,
        batch_size=8
    )

    # 保存模型
    print(f"\n保存模型...")
    predictor.save_model('thermal_ml_model.pth')

    # 绘制训练曲线
    print(f"\n绘制训练曲线...")
    plot_training_curves(train_losses, val_losses)

    # 测试模型
    print(f"\n测试模型...")
    test_power_grid = create_test_case(grid_size)

    # FDM ground truth
    print("  计算FDM ground truth...")
    fdm_result = fdm_steady_state(
        power_grid=test_power_grid,
        initial_temp=25.0,
        thermal_conductivity=0.3,
        convection_coeff=10.0,
        ambient_temp=25.0,
        max_iterations=1000,
        convergence=0.01,
        resolution=1.0
    )

    # ML预测
    print("  执行ML预测...")
    ml_result = predictor.predict(test_power_grid)

    # 可视化比较
    print("\n可视化预测结果...")
    visualize_prediction_comparison(test_power_grid, fdm_result, ml_result)

    # 速度测试
    test_predictor_speed(predictor, test_power_grid, num_runs=10)

    print("\n" + "=" * 60)
    print("训练和测试完成！")
    print("生成的文件:")
    print("  - thermal_ml_model.pth (训练好的模型)")
    print("  - best_thermal_model.pth (最佳模型)")
    print("  - training_curves.png (训练曲线)")
    print("  - ml_vs_fdm_comparison.png (预测结果对比)")
    print("=" * 60)


if __name__ == '__main__':
    main()
