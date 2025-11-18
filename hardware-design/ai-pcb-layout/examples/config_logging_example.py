"""
配置文件和日志系统使用示例
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from config_manager import ConfigManager, get_config, get_value, set_value
from logger import get_logger, info, warning, error, ProgressLogger, log_function_call


def demo_config_manager():
    """演示配置管理器"""
    print("=" * 60)
    print("配置管理器示例")
    print("=" * 60)

    # 1. 创建配置模板
    print("\n1. 创建配置模板...")
    config = ConfigManager()
    config.create_template('my_config.yaml')

    # 2. 加载配置
    print("\n2. 加载配置文件...")
    config.load('my_config.yaml')

    # 3. 读取配置
    print("\n3. 读取配置值:")
    algorithm = config.get('routing.algorithm')
    print(f"   路由算法: {algorithm}")

    solver = config.get('thermal.solver')
    print(f"   热分析求解器: {solver}")

    learning_rate = config.get('ml.learning_rate')
    print(f"   学习率: {learning_rate}")

    # 4. 修改配置
    print("\n4. 修改配置...")
    config.set('routing.algorithm', 'lee')
    config.set('thermal.max_iterations', 2000)
    config.set('ml.batch_size', 16)

    print(f"   新的路由算法: {config.get('routing.algorithm')}")
    print(f"   新的最大迭代次数: {config.get('thermal.max_iterations')}")

    # 5. 获取配置节
    print("\n5. 获取配置节:")
    routing_config = config.get_section('routing')
    print(f"   路由配置: {routing_config}")

    # 6. 验证配置
    print("\n6. 验证配置:")
    is_valid = config.validate()
    print(f"   配置有效: {is_valid}")

    # 7. 保存配置
    print("\n7. 保存修改后的配置...")
    config.save('my_config_modified.yaml')

    # 8. 打印配置
    print("\n8. 打印当前配置:")
    config.print_config()


def demo_logger():
    """演示日志系统"""
    print("\n" + "=" * 60)
    print("日志系统示例")
    print("=" * 60)

    # 1. 创建日志器
    print("\n1. 创建日志器...")
    logger = get_logger(
        name='demo_logger',
        level='DEBUG',
        log_file='logs/demo.log',
        console_output=True
    )

    # 2. 不同级别的日志
    print("\n2. 记录不同级别的日志:")

    logger.debug("这是调试信息")
    logger.info("这是普通信息")
    logger.warning("这是警告信息")
    logger.error("这是错误信息")
    logger.critical("这是严重错误信息")

    # 3. 使用便捷函数
    print("\n3. 使用便捷函数:")

    info("使用便捷函数记录信息")
    warning("使用便捷函数记录警告")
    error("使用便捷函数记录错误")

    # 4. 进度日志
    print("\n4. 进度日志示例:")

    import time

    progress = ProgressLogger(total=100, desc="处理数据")
    for i in range(100):
        time.sleep(0.01)  # 模拟处理
        progress.update(1)
    progress.finish()


@log_function_call
def example_function(x, y):
    """带日志装饰器的函数示例"""
    info(f"执行计算: {x} + {y}")
    return x + y


def demo_function_logging():
    """演示函数日志装饰器"""
    print("\n" + "=" * 60)
    print("函数日志装饰器示例")
    print("=" * 60)

    result = example_function(5, 3)
    print(f"\n结果: {result}")


def demo_integrated_usage():
    """演示配置和日志的集成使用"""
    print("\n" + "=" * 60)
    print("配置和日志集成使用示例")
    print("=" * 60)

    # 1. 加载配置
    print("\n1. 加载配置...")
    config = get_config('my_config.yaml')

    # 2. 从配置设置日志
    print("\n2. 根据配置设置日志...")
    from logger import setup_logging_from_config

    setup_logging_from_config(config)

    # 3. 使用配置的值
    print("\n3. 使用配置值:")

    algorithm = get_value('routing.algorithm', 'astar')
    info(f"使用路由算法: {algorithm}")

    solver = get_value('thermal.solver', 'fdm')
    info(f"使用热分析求解器: {solver}")

    # 4. 根据配置执行不同逻辑
    print("\n4. 根据配置执行逻辑:")

    debug_mode = get_value('general.debug', False)

    if debug_mode:
        get_logger().set_level('DEBUG')
        info("调试模式已启用")
    else:
        info("运行在正常模式")

    # 5. 使用配置参数
    print("\n5. 使用配置参数进行计算:")

    max_iterations = get_value('thermal.max_iterations', 1000)
    convergence = get_value('thermal.convergence', 0.01)

    info(f"开始迭代求解...")
    info(f"  最大迭代次数: {max_iterations}")
    info(f"  收敛标准: {convergence}")

    # 模拟迭代
    for i in range(min(5, max_iterations)):
        if i % 100 == 0:
            info(f"  迭代 {i}/{max_iterations}")

    info("求解完成！")


def create_project_config():
    """创建项目专用配置"""
    print("\n" + "=" * 60)
    print("创建项目专用配置")
    print("=" * 60)

    config = ConfigManager()

    # 自定义项目配置
    config.set('general.project_name', 'My PCB Project')
    config.set('general.version', '1.0.0')

    # 路由配置
    config.set('routing.algorithm', 'rl')  # 使用强化学习
    config.set('routing.grid_resolution', 0.05)  # 更精细的网格

    # 热分析配置
    config.set('thermal.solver', 'ml')  # 使用ML预测
    config.set('thermal.ambient_temp', 30.0)  # 环境温度30°C

    # ML配置
    config.set('ml.model_type', 'unet')
    config.set('ml.epochs', 200)

    # 保存项目配置
    config.save('project_config.yaml')

    print("\n✓ 项目配置已创建: project_config.yaml")


def main():
    """主函数"""
    print("\n" + "🔧" * 30)
    print("配置管理和日志系统 - 综合示例")
    print("🔧" * 30 + "\n")

    try:
        # 1. 配置管理器示例
        demo_config_manager()

        # 2. 日志系统示例
        demo_logger()

        # 3. 函数日志装饰器示例
        demo_function_logging()

        # 4. 集成使用示例
        demo_integrated_usage()

        # 5. 创建项目配置
        create_project_config()

        print("\n" + "=" * 60)
        print("✓ 所有示例运行完成！")
        print("=" * 60)

        print("\n生成的文件:")
        files = [
            "my_config.yaml",
            "my_config_modified.yaml",
            "project_config.yaml",
            "logs/demo.log"
        ]

        for f in files:
            print(f"  • {f}")

    except Exception as e:
        error(f"运行示例时发生错误: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
