"""
Image Classification Model Training Script
支持自定义数据集训练、多种模型架构、数据增强等功能
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
import torchvision.models as models
from pathlib import Path
import argparse
from typing import Optional, Tuple, Dict, List
import json
import time
from tqdm import tqdm
import matplotlib.pyplot as plt
from PIL import Image
import os


class ImageFolderDataset(Dataset):
    """自定義圖像資料集類別"""

    def __init__(self, data_dir: str, transform=None):
        """
        初始化資料集

        Args:
            data_dir: 資料目錄路徑，應包含按類別分類的子資料夾
            transform: 圖像轉換操作
        """
        self.data_dir = Path(data_dir)
        self.transform = transform

        # 獲取所有類別
        self.classes = sorted([d.name for d in self.data_dir.iterdir() if d.is_dir()])
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}

        # 獲取所有圖像路徑和標籤
        self.samples = []
        for class_name in self.classes:
            class_dir = self.data_dir / class_name
            for img_path in class_dir.glob('*'):
                if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                    self.samples.append((img_path, self.class_to_idx[class_name]))

        print(f"Found {len(self.samples)} images in {len(self.classes)} classes")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert('RGB')

        if self.transform:
            image = self.transform(image)

        return image, label


class ModelTrainer:
    """模型訓練器"""

    def __init__(
        self,
        model_name: str = 'resnet50',
        num_classes: int = 10,
        device: Optional[str] = None,
        learning_rate: float = 0.001,
        weight_decay: float = 1e-4
    ):
        """
        初始化訓練器

        Args:
            model_name: 模型名稱
            num_classes: 類別數量
            device: 設備 (cuda/cpu)
            learning_rate: 學習率
            weight_decay: 權重衰減
        """
        self.model_name = model_name
        self.num_classes = num_classes
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.learning_rate = learning_rate
        self.weight_decay = weight_decay

        # 訓練歷史
        self.history = {
            'train_loss': [],
            'train_acc': [],
            'val_loss': [],
            'val_acc': []
        }

        print(f"Using device: {self.device}")

    def build_model(self) -> nn.Module:
        """構建模型"""
        model_dict = {
            'resnet18': models.resnet18,
            'resnet34': models.resnet34,
            'resnet50': models.resnet50,
            'resnet101': models.resnet101,
            'vgg16': models.vgg16,
            'vgg19': models.vgg19,
            'efficientnet_b0': models.efficientnet_b0,
            'efficientnet_b1': models.efficientnet_b1,
            'efficientnet_b2': models.efficientnet_b2,
            'mobilenet_v2': models.mobilenet_v2,
            'mobilenet_v3_small': models.mobilenet_v3_small,
            'mobilenet_v3_large': models.mobilenet_v3_large,
        }

        if self.model_name not in model_dict:
            raise ValueError(f"Model {self.model_name} not supported")

        # 載入預訓練模型
        print(f"Building {self.model_name} model...")
        model = model_dict[self.model_name](pretrained=True)

        # 修改最後一層以適應類別數量
        if 'resnet' in self.model_name:
            num_ftrs = model.fc.in_features
            model.fc = nn.Linear(num_ftrs, self.num_classes)
        elif 'vgg' in self.model_name:
            model.classifier[6] = nn.Linear(4096, self.num_classes)
        elif 'efficientnet' in self.model_name:
            num_ftrs = model.classifier[1].in_features
            model.classifier[1] = nn.Linear(num_ftrs, self.num_classes)
        elif 'mobilenet' in self.model_name:
            num_ftrs = model.classifier[-1].in_features
            model.classifier[-1] = nn.Linear(num_ftrs, self.num_classes)

        model = model.to(self.device)
        return model

    def get_data_transforms(self, augment: bool = True) -> Dict[str, transforms.Compose]:
        """
        獲取數據轉換

        Args:
            augment: 是否使用數據增強

        Returns:
            訓練和驗證的轉換字典
        """
        if augment:
            train_transform = transforms.Compose([
                transforms.RandomResizedCrop(224),
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(15),
                transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
        else:
            train_transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])

        val_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

        return {'train': train_transform, 'val': val_transform}

    def train_epoch(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        criterion: nn.Module,
        optimizer: optim.Optimizer,
        epoch: int
    ) -> Tuple[float, float]:
        """訓練一個 epoch"""
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        pbar = tqdm(train_loader, desc=f'Epoch {epoch}')
        for inputs, labels in pbar:
            inputs, labels = inputs.to(self.device), labels.to(self.device)

            # 前向傳播
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            # 反向傳播
            loss.backward()
            optimizer.step()

            # 統計
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            # 更新進度條
            pbar.set_postfix({
                'loss': f'{running_loss/len(pbar):.4f}',
                'acc': f'{100.*correct/total:.2f}%'
            })

        epoch_loss = running_loss / len(train_loader)
        epoch_acc = 100. * correct / total

        return epoch_loss, epoch_acc

    def validate(
        self,
        model: nn.Module,
        val_loader: DataLoader,
        criterion: nn.Module
    ) -> Tuple[float, float]:
        """驗證模型"""
        model.eval()
        running_loss = 0.0
        correct = 0
        total = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(self.device), labels.to(self.device)

                outputs = model(inputs)
                loss = criterion(outputs, labels)

                running_loss += loss.item()
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()

        val_loss = running_loss / len(val_loader)
        val_acc = 100. * correct / total

        return val_loss, val_acc

    def train(
        self,
        train_dir: str,
        val_dir: Optional[str] = None,
        epochs: int = 50,
        batch_size: int = 32,
        augment: bool = True,
        save_dir: str = 'models',
        save_best_only: bool = True
    ) -> nn.Module:
        """
        訓練模型

        Args:
            train_dir: 訓練數據目錄
            val_dir: 驗證數據目錄
            epochs: 訓練輪數
            batch_size: 批次大小
            augment: 是否使用數據增強
            save_dir: 模型保存目錄
            save_best_only: 是否只保存最佳模型

        Returns:
            訓練好的模型
        """
        # 創建保存目錄
        os.makedirs(save_dir, exist_ok=True)

        # 構建模型
        model = self.build_model()

        # 準備數據
        transforms_dict = self.get_data_transforms(augment)
        train_dataset = ImageFolderDataset(train_dir, transforms_dict['train'])
        train_loader = DataLoader(
            train_dataset,
            batch_size=batch_size,
            shuffle=True,
            num_workers=4,
            pin_memory=True
        )

        # 驗證集
        val_loader = None
        if val_dir:
            val_dataset = ImageFolderDataset(val_dir, transforms_dict['val'])
            val_loader = DataLoader(
                val_dataset,
                batch_size=batch_size,
                shuffle=False,
                num_workers=4,
                pin_memory=True
            )

        # 損失函數和優化器
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(
            model.parameters(),
            lr=self.learning_rate,
            weight_decay=self.weight_decay
        )

        # 學習率調度器
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            optimizer,
            mode='max',
            factor=0.5,
            patience=5,
            verbose=True
        )

        # 訓練循環
        best_acc = 0.0

        print(f"\nStarting training for {epochs} epochs...")
        print(f"Model: {self.model_name}")
        print(f"Number of classes: {self.num_classes}")
        print(f"Batch size: {batch_size}")
        print(f"Learning rate: {self.learning_rate}")
        print("-" * 60)

        for epoch in range(1, epochs + 1):
            # 訓練
            train_loss, train_acc = self.train_epoch(
                model, train_loader, criterion, optimizer, epoch
            )

            self.history['train_loss'].append(train_loss)
            self.history['train_acc'].append(train_acc)

            # 驗證
            if val_loader:
                val_loss, val_acc = self.validate(model, val_loader, criterion)
                self.history['val_loss'].append(val_loss)
                self.history['val_acc'].append(val_acc)

                print(f"\nEpoch {epoch}/{epochs}")
                print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
                print(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")

                # 調整學習率
                scheduler.step(val_acc)

                # 保存最佳模型
                if val_acc > best_acc:
                    best_acc = val_acc
                    self.save_model(
                        model,
                        os.path.join(save_dir, f'{self.model_name}_best.pth'),
                        train_dataset.classes,
                        val_acc
                    )
                    print(f"✓ Saved new best model (acc: {val_acc:.2f}%)")
            else:
                print(f"\nEpoch {epoch}/{epochs}")
                print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")

            # 定期保存
            if not save_best_only:
                if epoch % 10 == 0:
                    self.save_model(
                        model,
                        os.path.join(save_dir, f'{self.model_name}_epoch{epoch}.pth'),
                        train_dataset.classes,
                        train_acc
                    )

            print("-" * 60)

        # 保存最終模型
        self.save_model(
            model,
            os.path.join(save_dir, f'{self.model_name}_final.pth'),
            train_dataset.classes,
            train_acc
        )

        # 繪製訓練曲線
        self.plot_history(os.path.join(save_dir, 'training_history.png'))

        print("\nTraining completed!")
        print(f"Best validation accuracy: {best_acc:.2f}%")

        return model

    def save_model(
        self,
        model: nn.Module,
        path: str,
        class_names: List[str],
        accuracy: float
    ):
        """保存模型"""
        torch.save({
            'model_state_dict': model.state_dict(),
            'model_name': self.model_name,
            'num_classes': self.num_classes,
            'class_names': class_names,
            'accuracy': accuracy,
            'history': self.history
        }, path)

    def plot_history(self, save_path: str):
        """繪製訓練歷史"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

        # 損失曲線
        ax1.plot(self.history['train_loss'], label='Train Loss')
        if self.history['val_loss']:
            ax1.plot(self.history['val_loss'], label='Val Loss')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.set_title('Training and Validation Loss')
        ax1.legend()
        ax1.grid(True)

        # 準確率曲線
        ax2.plot(self.history['train_acc'], label='Train Acc')
        if self.history['val_acc']:
            ax2.plot(self.history['val_acc'], label='Val Acc')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('Accuracy (%)')
        ax2.set_title('Training and Validation Accuracy')
        ax2.legend()
        ax2.grid(True)

        plt.tight_layout()
        plt.savefig(save_path, dpi=150)
        print(f"Training history plot saved to {save_path}")


def main():
    """主函數"""
    parser = argparse.ArgumentParser(description='Train image classification model')
    parser.add_argument('--train-dir', type=str, required=True,
                        help='Training data directory')
    parser.add_argument('--val-dir', type=str, default=None,
                        help='Validation data directory')
    parser.add_argument('--model', type=str, default='resnet50',
                        choices=['resnet18', 'resnet34', 'resnet50', 'resnet101',
                                'vgg16', 'vgg19', 'efficientnet_b0', 'efficientnet_b1',
                                'mobilenet_v2', 'mobilenet_v3_small', 'mobilenet_v3_large'],
                        help='Model architecture')
    parser.add_argument('--epochs', type=int, default=50,
                        help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32,
                        help='Batch size')
    parser.add_argument('--lr', type=float, default=0.001,
                        help='Learning rate')
    parser.add_argument('--weight-decay', type=float, default=1e-4,
                        help='Weight decay')
    parser.add_argument('--no-augment', action='store_true',
                        help='Disable data augmentation')
    parser.add_argument('--save-dir', type=str, default='models',
                        help='Directory to save models')
    parser.add_argument('--save-all', action='store_true',
                        help='Save model at every 10 epochs (default: save best only)')

    args = parser.parse_args()

    # 計算類別數量
    train_path = Path(args.train_dir)
    num_classes = len([d for d in train_path.iterdir() if d.is_dir()])

    # 創建訓練器
    trainer = ModelTrainer(
        model_name=args.model,
        num_classes=num_classes,
        learning_rate=args.lr,
        weight_decay=args.weight_decay
    )

    # 開始訓練
    trainer.train(
        train_dir=args.train_dir,
        val_dir=args.val_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        augment=not args.no_augment,
        save_dir=args.save_dir,
        save_best_only=not args.save_all
    )


if __name__ == "__main__":
    main()
