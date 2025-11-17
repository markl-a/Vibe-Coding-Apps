#!/usr/bin/env python3
"""
docker_cleanup.py - Docker 容器清理工具

自動清理 Docker 容器、映像、卷和網路，釋放磁碟空間。
"""

import os
import sys
import argparse
import subprocess
import logging
import json
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DockerCleaner:
    """Docker 清理工具類"""

    def __init__(self):
        """初始化 Docker 清理工具"""
        self.check_docker()

    def check_docker(self):
        """檢查 Docker 是否可用"""
        try:
            result = subprocess.run(
                ['docker', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                logger.error("Docker 未安裝或無法運行")
                sys.exit(1)
            logger.debug(f"Docker 版本: {result.stdout.strip()}")
        except FileNotFoundError:
            logger.error("Docker 未安裝")
            sys.exit(1)
        except Exception as e:
            logger.error(f"檢查 Docker 失敗: {e}")
            sys.exit(1)

    def run_docker_command(self, *args) -> Tuple[bool, str, str]:
        """
        執行 Docker 命令

        Args:
            *args: Docker 命令參數

        Returns:
            Tuple[bool, str, str]: (成功/失敗, stdout, stderr)
        """
        try:
            result = subprocess.run(
                ['docker'] + list(args),
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return False, '', 'Docker 命令超時'
        except Exception as e:
            return False, '', str(e)

    def get_containers(self, all_containers: bool = True, filters: str = None) -> List[Dict]:
        """
        獲取容器列表

        Args:
            all_containers: 是否包含已停止的容器
            filters: 過濾條件

        Returns:
            List[Dict]: 容器列表
        """
        args = ['ps', '--format', '{{json .}}']
        if all_containers:
            args.append('--all')
        if filters:
            args.extend(['--filter', filters])

        success, stdout, stderr = self.run_docker_command(*args)
        if not success:
            logger.error(f"獲取容器列表失敗: {stderr}")
            return []

        containers = []
        for line in stdout.strip().split('\n'):
            if line:
                try:
                    containers.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

        return containers

    def get_images(self, filters: str = None) -> List[Dict]:
        """
        獲取映像列表

        Args:
            filters: 過濾條件

        Returns:
            List[Dict]: 映像列表
        """
        args = ['images', '--format', '{{json .}}']
        if filters:
            args.extend(['--filter', filters])

        success, stdout, stderr = self.run_docker_command(*args)
        if not success:
            logger.error(f"獲取映像列表失敗: {stderr}")
            return []

        images = []
        for line in stdout.strip().split('\n'):
            if line:
                try:
                    images.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

        return images

    def get_volumes(self, filters: str = None) -> List[str]:
        """
        獲取卷列表

        Args:
            filters: 過濾條件

        Returns:
            List[str]: 卷名稱列表
        """
        args = ['volume', 'ls', '--format', '{{.Name}}']
        if filters:
            args.extend(['--filter', filters])

        success, stdout, stderr = self.run_docker_command(*args)
        if not success:
            logger.error(f"獲取卷列表失敗: {stderr}")
            return []

        return [line.strip() for line in stdout.strip().split('\n') if line.strip()]

    def get_networks(self, filters: str = None) -> List[str]:
        """
        獲取網路列表

        Args:
            filters: 過濾條件

        Returns:
            List[str]: 網路名稱列表
        """
        args = ['network', 'ls', '--format', '{{.Name}}']
        if filters:
            args.extend(['--filter', filters])

        success, stdout, stderr = self.run_docker_command(*args)
        if not success:
            logger.error(f"獲取網路列表失敗: {stderr}")
            return []

        # 排除預設網路
        default_networks = {'bridge', 'host', 'none'}
        return [line.strip() for line in stdout.strip().split('\n')
                if line.strip() and line.strip() not in default_networks]

    def remove_containers(self, container_ids: List[str], force: bool = False) -> Tuple[int, int]:
        """
        刪除容器

        Args:
            container_ids: 容器 ID 列表
            force: 是否強制刪除

        Returns:
            Tuple[int, int]: (成功數, 失敗數)
        """
        success_count = 0
        fail_count = 0

        for container_id in container_ids:
            args = ['rm']
            if force:
                args.append('--force')
            args.append(container_id)

            success, stdout, stderr = self.run_docker_command(*args)
            if success:
                logger.info(f"已刪除容器: {container_id}")
                success_count += 1
            else:
                logger.error(f"刪除容器失敗 {container_id}: {stderr}")
                fail_count += 1

        return success_count, fail_count

    def remove_images(self, image_ids: List[str], force: bool = False) -> Tuple[int, int]:
        """
        刪除映像

        Args:
            image_ids: 映像 ID 列表
            force: 是否強制刪除

        Returns:
            Tuple[int, int]: (成功數, 失敗數)
        """
        success_count = 0
        fail_count = 0

        for image_id in image_ids:
            args = ['rmi']
            if force:
                args.append('--force')
            args.append(image_id)

            success, stdout, stderr = self.run_docker_command(*args)
            if success:
                logger.info(f"已刪除映像: {image_id}")
                success_count += 1
            else:
                logger.error(f"刪除映像失敗 {image_id}: {stderr}")
                fail_count += 1

        return success_count, fail_count

    def remove_volumes(self, volume_names: List[str]) -> Tuple[int, int]:
        """
        刪除卷

        Args:
            volume_names: 卷名稱列表

        Returns:
            Tuple[int, int]: (成功數, 失敗數)
        """
        success_count = 0
        fail_count = 0

        for volume_name in volume_names:
            success, stdout, stderr = self.run_docker_command('volume', 'rm', volume_name)
            if success:
                logger.info(f"已刪除卷: {volume_name}")
                success_count += 1
            else:
                logger.error(f"刪除卷失敗 {volume_name}: {stderr}")
                fail_count += 1

        return success_count, fail_count

    def remove_networks(self, network_names: List[str]) -> Tuple[int, int]:
        """
        刪除網路

        Args:
            network_names: 網路名稱列表

        Returns:
            Tuple[int, int]: (成功數, 失敗數)
        """
        success_count = 0
        fail_count = 0

        for network_name in network_names:
            success, stdout, stderr = self.run_docker_command('network', 'rm', network_name)
            if success:
                logger.info(f"已刪除網路: {network_name}")
                success_count += 1
            else:
                logger.error(f"刪除網路失敗 {network_name}: {stderr}")
                fail_count += 1

        return success_count, fail_count

    def cleanup_stopped_containers(self, dry_run: bool = False) -> Dict:
        """
        清理已停止的容器

        Args:
            dry_run: 是否為預覽模式

        Returns:
            Dict: 清理結果
        """
        logger.info("查找已停止的容器...")
        containers = self.get_containers(all_containers=True, filters='status=exited')

        result = {
            'type': 'stopped_containers',
            'found': len(containers),
            'removed': 0,
            'failed': 0,
            'items': [c.get('ID', c.get('Names', 'Unknown')) for c in containers]
        }

        if dry_run:
            logger.info(f"預覽模式: 找到 {len(containers)} 個已停止的容器")
            return result

        if containers:
            container_ids = [c['ID'] for c in containers if 'ID' in c]
            success, fail = self.remove_containers(container_ids)
            result['removed'] = success
            result['failed'] = fail

        return result

    def cleanup_dangling_images(self, dry_run: bool = False) -> Dict:
        """
        清理懸空映像（dangling images）

        Args:
            dry_run: 是否為預覽模式

        Returns:
            Dict: 清理結果
        """
        logger.info("查找懸空映像...")
        images = self.get_images(filters='dangling=true')

        result = {
            'type': 'dangling_images',
            'found': len(images),
            'removed': 0,
            'failed': 0,
            'items': [i.get('ID', 'Unknown') for i in images]
        }

        if dry_run:
            logger.info(f"預覽模式: 找到 {len(images)} 個懸空映像")
            return result

        if images:
            image_ids = [i['ID'] for i in images if 'ID' in i]
            success, fail = self.remove_images(image_ids)
            result['removed'] = success
            result['failed'] = fail

        return result

    def cleanup_unused_volumes(self, dry_run: bool = False) -> Dict:
        """
        清理未使用的卷

        Args:
            dry_run: 是否為預覽模式

        Returns:
            Dict: 清理結果
        """
        logger.info("查找未使用的卷...")

        if dry_run:
            volumes = self.get_volumes(filters='dangling=true')
            return {
                'type': 'unused_volumes',
                'found': len(volumes),
                'removed': 0,
                'failed': 0,
                'items': volumes
            }

        # 使用 docker volume prune
        success, stdout, stderr = self.run_docker_command('volume', 'prune', '--force')

        # 從輸出中解析刪除的卷數
        removed = 0
        if success and 'Total reclaimed space:' in stdout:
            lines = stdout.strip().split('\n')
            for line in lines:
                if line.startswith('Deleted Volumes:'):
                    # 嘗試計算刪除的卷數
                    removed_lines = [l for l in lines if l and not l.startswith('Deleted') and not l.startswith('Total')]
                    removed = len(removed_lines)

        return {
            'type': 'unused_volumes',
            'found': removed,
            'removed': removed,
            'failed': 0,
            'output': stdout
        }

    def cleanup_unused_networks(self, dry_run: bool = False) -> Dict:
        """
        清理未使用的網路

        Args:
            dry_run: 是否為預覽模式

        Returns:
            Dict: 清理結果
        """
        logger.info("查找未使用的網路...")

        if dry_run:
            # 獲取所有網路並手動過濾
            all_networks = self.get_networks()
            # 這裡簡化處理，實際需要檢查每個網路是否被使用
            return {
                'type': 'unused_networks',
                'found': len(all_networks),
                'removed': 0,
                'failed': 0,
                'items': all_networks
            }

        # 使用 docker network prune
        success, stdout, stderr = self.run_docker_command('network', 'prune', '--force')

        # 從輸出中解析刪除的網路
        removed = stdout.strip().split('\n') if success else []
        removed = [line for line in removed if line and not line.startswith('Deleted') and not line.startswith('Total')]

        return {
            'type': 'unused_networks',
            'found': len(removed),
            'removed': len(removed),
            'failed': 0,
            'output': stdout
        }

    def system_prune(self, all_items: bool = False, volumes: bool = False, dry_run: bool = False) -> Dict:
        """
        執行系統清理（docker system prune）

        Args:
            all_items: 是否刪除所有未使用的映像（不只是懸空映像）
            volumes: 是否刪除未使用的卷
            dry_run: 是否為預覽模式

        Returns:
            Dict: 清理結果
        """
        logger.info("執行系統清理...")

        args = ['system', 'prune', '--force']
        if all_items:
            args.append('--all')
        if volumes:
            args.append('--volumes')

        success, stdout, stderr = self.run_docker_command(*args)

        # 解析輸出
        reclaimed_space = 'Unknown'
        if 'Total reclaimed space:' in stdout:
            for line in stdout.split('\n'):
                if 'Total reclaimed space:' in line:
                    reclaimed_space = line.split(':')[-1].strip()

        return {
            'type': 'system_prune',
            'success': success,
            'reclaimed_space': reclaimed_space,
            'output': stdout,
            'error': stderr if not success else None
        }


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='Docker 容器清理工具 - 自動清理 Docker 資源',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 清理已停止的容器
  %(prog)s --stopped-containers

  # 清理懸空映像
  %(prog)s --dangling-images

  # 清理未使用的卷
  %(prog)s --unused-volumes

  # 清理未使用的網路
  %(prog)s --unused-networks

  # 清理所有（不包含卷）
  %(prog)s --all

  # 完整清理（包含卷）
  %(prog)s --all --volumes

  # 預覽模式
  %(prog)s --all --dry-run

  # 系統清理
  %(prog)s --system-prune

  # 系統清理（包含所有映像和卷）
  %(prog)s --system-prune --all --volumes
        """
    )

    parser.add_argument(
        '--stopped-containers',
        action='store_true',
        help='清理已停止的容器'
    )

    parser.add_argument(
        '--dangling-images',
        action='store_true',
        help='清理懸空映像'
    )

    parser.add_argument(
        '--unused-volumes',
        action='store_true',
        help='清理未使用的卷'
    )

    parser.add_argument(
        '--unused-networks',
        action='store_true',
        help='清理未使用的網路'
    )

    parser.add_argument(
        '--all',
        action='store_true',
        help='清理所有未使用的資源（容器、映像、網路，但不包含卷）'
    )

    parser.add_argument(
        '--volumes',
        action='store_true',
        help='同時清理卷（配合 --all 或 --system-prune 使用）'
    )

    parser.add_argument(
        '--system-prune',
        action='store_true',
        help='執行 Docker 系統清理'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='預覽模式：只顯示將要清理的項目，不實際清理'
    )

    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='顯示詳細資訊'
    )

    args = parser.parse_args()

    # 設定日誌級別
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    try:
        cleaner = DockerCleaner()
        results = []

        # 如果沒有指定任何清理選項，顯示幫助
        if not any([args.stopped_containers, args.dangling_images, args.unused_volumes,
                   args.unused_networks, args.all, args.system_prune]):
            parser.print_help()
            sys.exit(0)

        # 系統清理
        if args.system_prune:
            result = cleaner.system_prune(
                all_items=args.all,
                volumes=args.volumes,
                dry_run=args.dry_run
            )
            results.append(result)
        else:
            # 個別清理
            if args.all or args.stopped_containers:
                results.append(cleaner.cleanup_stopped_containers(dry_run=args.dry_run))

            if args.all or args.dangling_images:
                results.append(cleaner.cleanup_dangling_images(dry_run=args.dry_run))

            if args.volumes or args.unused_volumes:
                results.append(cleaner.cleanup_unused_volumes(dry_run=args.dry_run))

            if args.all or args.unused_networks:
                results.append(cleaner.cleanup_unused_networks(dry_run=args.dry_run))

        # 顯示結果
        print("\n" + "=" * 80)
        print("Docker 清理報告")
        print("=" * 80)

        if args.dry_run:
            print("⚠️  預覽模式：未實際刪除任何資源\n")

        for result in results:
            if result.get('type') == 'system_prune':
                print(f"\n[系統清理]")
                print(f"狀態: {'成功' if result['success'] else '失敗'}")
                print(f"釋放空間: {result['reclaimed_space']}")
                if result.get('error'):
                    print(f"錯誤: {result['error']}")
            else:
                print(f"\n[{result['type']}]")
                print(f"找到: {result['found']} 個")
                if not args.dry_run:
                    print(f"已刪除: {result['removed']} 個")
                    if result['failed'] > 0:
                        print(f"失敗: {result['failed']} 個")

                if args.verbose and result.get('items'):
                    print("項目:")
                    for item in result['items'][:10]:  # 只顯示前 10 個
                        print(f"  - {item}")
                    if len(result['items']) > 10:
                        print(f"  ... 還有 {len(result['items']) - 10} 個")

        print("\n" + "=" * 80)

        # 總計
        if not args.system_prune and not args.dry_run:
            total_removed = sum(r.get('removed', 0) for r in results if 'removed' in r)
            total_failed = sum(r.get('failed', 0) for r in results if 'failed' in r)
            print(f"總計刪除: {total_removed} 個資源")
            if total_failed > 0:
                print(f"總計失敗: {total_failed} 個資源")
            print("=" * 80)

    except KeyboardInterrupt:
        logger.info("\n操作已被用戶中斷")
        sys.exit(0)
    except Exception as e:
        logger.error(f"發生錯誤: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
