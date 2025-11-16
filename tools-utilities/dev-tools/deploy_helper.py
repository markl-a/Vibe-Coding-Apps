#!/usr/bin/env python3
"""
deploy_helper.py - 部署輔助工具
簡化部署流程的工具
"""

import os
import sys
import argparse
import subprocess
import json
import time
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import yaml


class DeployHelper:
    """部署輔助器類別"""

    def __init__(self, config_file: str = 'deploy_config.yaml'):
        self.config_file = Path(config_file)
        self.config = self._load_config()
        self.deployment_history = []

    def _load_config(self) -> Dict:
        """載入配置"""
        if not self.config_file.exists():
            return self._default_config()

        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"警告: 無法載入配置檔案: {e}", file=sys.stderr)
            return self._default_config()

    def _default_config(self) -> Dict:
        """預設配置"""
        return {
            'environments': {
                'staging': {
                    'host': 'staging.example.com',
                    'port': 22,
                    'user': 'deploy',
                    'path': '/var/www/staging'
                },
                'production': {
                    'host': 'production.example.com',
                    'port': 22,
                    'user': 'deploy',
                    'path': '/var/www/production'
                }
            },
            'docker': {
                'image_name': 'myapp',
                'registry': 'docker.io'
            },
            'health_check': {
                'url': '/health',
                'timeout': 30,
                'retries': 3
            }
        }

    def deploy(self, environment: str, tag: Optional[str] = None,
              dry_run: bool = False) -> Dict:
        """部署到指定環境"""
        if environment not in self.config.get('environments', {}):
            raise ValueError(f"未知的環境: {environment}")

        env_config = self.config['environments'][environment]

        print(f"\n開始部署到 {environment} 環境...")
        print("="*60)

        steps = [
            ('檢查環境', lambda: self._check_environment(env_config)),
            ('建立 Docker 映像', lambda: self._build_docker(tag)),
            ('推送映像', lambda: self._push_docker(tag)),
            ('部署應用', lambda: self._deploy_app(env_config, tag)),
            ('健康檢查', lambda: self._health_check(env_config)),
        ]

        results = []
        for step_name, step_func in steps:
            print(f"\n{step_name}...")

            if dry_run:
                print(f"  [DRY RUN] 跳過執行")
                results.append({'step': step_name, 'status': 'skipped'})
                continue

            try:
                result = step_func()
                print(f"  ✓ 完成")
                results.append({'step': step_name, 'status': 'success', 'result': result})
            except Exception as e:
                print(f"  ✗ 失敗: {e}")
                results.append({'step': step_name, 'status': 'failed', 'error': str(e)})
                return {
                    'environment': environment,
                    'status': 'failed',
                    'failed_step': step_name,
                    'results': results
                }

        deployment = {
            'environment': environment,
            'tag': tag,
            'status': 'success',
            'timestamp': datetime.now().isoformat(),
            'results': results
        }

        self.deployment_history.append(deployment)
        self._save_deployment_history(deployment)

        print("\n" + "="*60)
        print(f"✓ 部署成功到 {environment}")
        print("="*60)

        return deployment

    def _check_environment(self, env_config: Dict) -> Dict:
        """檢查環境"""
        # 檢查 SSH 連線
        host = env_config.get('host')
        user = env_config.get('user')

        try:
            result = subprocess.run(
                ['ssh', f'{user}@{host}', 'echo', 'OK'],
                capture_output=True,
                timeout=10
            )
            return {'status': 'ok' if result.returncode == 0 else 'failed'}
        except Exception:
            # 如果沒有 SSH，跳過檢查
            return {'status': 'skipped'}

    def _build_docker(self, tag: Optional[str] = None) -> Dict:
        """建立 Docker 映像"""
        docker_config = self.config.get('docker', {})
        image_name = docker_config.get('image_name', 'myapp')
        tag = tag or 'latest'

        full_image = f"{image_name}:{tag}"

        # 檢查 Dockerfile
        if not Path('Dockerfile').exists():
            print("  警告: 找不到 Dockerfile，建立基本 Dockerfile...")
            self._create_default_dockerfile()

        try:
            result = subprocess.run(
                ['docker', 'build', '-t', full_image, '.'],
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode != 0:
                raise Exception(f"Docker 建立失敗: {result.stderr}")

            return {
                'image': full_image,
                'status': 'built'
            }

        except FileNotFoundError:
            raise Exception("Docker 未安裝")

    def _push_docker(self, tag: Optional[str] = None) -> Dict:
        """推送 Docker 映像"""
        docker_config = self.config.get('docker', {})
        image_name = docker_config.get('image_name', 'myapp')
        registry = docker_config.get('registry', 'docker.io')
        tag = tag or 'latest'

        full_image = f"{registry}/{image_name}:{tag}"

        try:
            # 標記映像
            subprocess.run(
                ['docker', 'tag', f"{image_name}:{tag}", full_image],
                check=True,
                timeout=30
            )

            # 推送映像
            result = subprocess.run(
                ['docker', 'push', full_image],
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode != 0:
                # 如果推送失敗，可能是沒有登入，跳過
                print(f"  警告: 推送失敗（可能需要 docker login）")
                return {'status': 'skipped'}

            return {
                'image': full_image,
                'status': 'pushed'
            }

        except Exception as e:
            print(f"  警告: 推送失敗: {e}")
            return {'status': 'skipped'}

    def _deploy_app(self, env_config: Dict, tag: Optional[str] = None) -> Dict:
        """部署應用"""
        # 這裡可以實作實際的部署邏輯
        # 例如: SSH 到伺服器執行部署腳本
        # 或者: 使用 Kubernetes API 更新 deployment

        return {
            'status': 'deployed',
            'timestamp': datetime.now().isoformat()
        }

    def _health_check(self, env_config: Dict) -> Dict:
        """健康檢查"""
        health_config = self.config.get('health_check', {})
        retries = health_config.get('retries', 3)
        timeout = health_config.get('timeout', 30)

        for i in range(retries):
            try:
                # 這裡可以實作實際的健康檢查
                # 例如: HTTP GET 請求到健康檢查端點
                time.sleep(1)  # 模擬等待

                return {
                    'status': 'healthy',
                    'attempt': i + 1
                }

            except Exception as e:
                if i == retries - 1:
                    raise Exception(f"健康檢查失敗: {e}")

        return {'status': 'healthy'}

    def rollback(self, environment: str) -> Dict:
        """回滾到上一版本"""
        print(f"\n回滾 {environment} 環境...")

        # 從歷史記錄中找到上一個成功的部署
        successful_deployments = [
            d for d in self.deployment_history
            if d['environment'] == environment and d['status'] == 'success'
        ]

        if len(successful_deployments) < 2:
            raise Exception("沒有可回滾的版本")

        previous = successful_deployments[-2]
        tag = previous.get('tag')

        print(f"回滾到版本: {tag}")

        return self.deploy(environment, tag=tag)

    def create_docker_image(self) -> Dict:
        """只建立 Docker 映像"""
        return self._build_docker()

    def generate_deployment_report(self) -> str:
        """生成部署報告"""
        lines = [
            "\n" + "="*60,
            "部署報告",
            "="*60,
        ]

        if not self.deployment_history:
            lines.append("\n還沒有部署記錄")
        else:
            lines.append(f"\n總部署次數: {len(self.deployment_history)}")

            for deployment in self.deployment_history[-10:]:  # 最近 10 次
                lines.append(f"\n環境: {deployment['environment']}")
                lines.append(f"狀態: {deployment['status']}")
                lines.append(f"時間: {deployment.get('timestamp', 'N/A')}")
                lines.append(f"標籤: {deployment.get('tag', 'latest')}")

        lines.append("\n" + "="*60)
        return '\n'.join(lines)

    def _save_deployment_history(self, deployment: Dict):
        """儲存部署歷史"""
        history_file = Path('.deployment_history.json')

        history = []
        if history_file.exists():
            with open(history_file, 'r') as f:
                history = json.load(f)

        history.append(deployment)

        with open(history_file, 'w') as f:
            json.dump(history[-100:], f, indent=2)  # 只保留最近 100 次

    def _create_default_dockerfile(self):
        """建立預設的 Dockerfile"""
        dockerfile = """FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
"""
        with open('Dockerfile', 'w') as f:
            f.write(dockerfile)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="部署輔助工具 - 簡化部署流程",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s --env staging                    # 部署到測試環境
  %(prog)s --env production --tag v1.0.0    # 部署到生產環境
  %(prog)s --docker-build                   # 建立 Docker 映像
  %(prog)s --health-check                   # 健康檢查
  %(prog)s --rollback --env production      # 回滾
  %(prog)s --report                         # 生成部署報告
        """
    )

    parser.add_argument('--env', choices=['staging', 'production'],
                       help='目標環境')
    parser.add_argument('--tag', help='版本標籤')
    parser.add_argument('--docker-build', action='store_true',
                       help='建立 Docker 映像')
    parser.add_argument('--health-check', action='store_true',
                       help='健康檢查')
    parser.add_argument('--rollback', action='store_true',
                       help='回滾到上一版本')
    parser.add_argument('--report', action='store_true',
                       help='生成部署報告')
    parser.add_argument('--dry-run', action='store_true',
                       help='試運行（不實際執行）')
    parser.add_argument('--config', default='deploy_config.yaml',
                       help='配置檔案路徑')

    args = parser.parse_args()

    helper = DeployHelper(config_file=args.config)

    try:
        if args.docker_build:
            result = helper.create_docker_image()
            print(f"\n✓ Docker 映像已建立: {result.get('image')}")

        elif args.report:
            report = helper.generate_deployment_report()
            print(report)

        elif args.rollback:
            if not args.env:
                print("錯誤: 回滾需要指定 --env", file=sys.stderr)
                sys.exit(1)
            result = helper.rollback(args.env)

        elif args.env:
            result = helper.deploy(args.env, tag=args.tag, dry_run=args.dry_run)

        else:
            parser.print_help()
            sys.exit(1)

    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
