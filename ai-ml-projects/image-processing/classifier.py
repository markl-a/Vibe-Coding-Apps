"""
Image Classification using Pre-trained Models
"""
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import numpy as np
from typing import List, Dict, Union, Optional
import json


class ImageClassifier:
    """Image classification using PyTorch pre-trained models"""

    def __init__(
        self,
        model_name: str = 'resnet50',
        num_classes: Optional[int] = None,
        class_names: Optional[List[str]] = None,
        device: Optional[str] = None
    ):
        """
        Initialize the image classifier

        Args:
            model_name: Name of the pre-trained model
            num_classes: Number of classes for custom model
            class_names: List of class names
            device: Device to use (cuda/cpu)
        """
        self.model_name = model_name
        self.num_classes = num_classes or 1000
        self.class_names = class_names
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')

        # Load model
        self.model = self._load_model()
        self.model.to(self.device)
        self.model.eval()

        # Define transforms
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

        # Load ImageNet labels if using default classes
        if self.class_names is None and self.num_classes == 1000:
            self._load_imagenet_labels()

    def _load_model(self) -> torch.nn.Module:
        """Load pre-trained model"""
        model_dict = {
            'resnet18': models.resnet18,
            'resnet34': models.resnet34,
            'resnet50': models.resnet50,
            'resnet101': models.resnet101,
            'vgg16': models.vgg16,
            'vgg19': models.vgg19,
            'efficientnet_b0': models.efficientnet_b0,
            'efficientnet_b1': models.efficientnet_b1,
            'mobilenet_v2': models.mobilenet_v2,
            'inception_v3': models.inception_v3,
        }

        if self.model_name not in model_dict:
            raise ValueError(f"Model {self.model_name} not supported")

        # Load model with pre-trained weights
        model = model_dict[self.model_name](pretrained=True)

        # Modify final layer if custom number of classes
        if self.num_classes != 1000:
            if 'resnet' in self.model_name:
                model.fc = torch.nn.Linear(model.fc.in_features, self.num_classes)
            elif 'vgg' in self.model_name:
                model.classifier[6] = torch.nn.Linear(4096, self.num_classes)
            elif 'efficientnet' in self.model_name:
                model.classifier[1] = torch.nn.Linear(
                    model.classifier[1].in_features,
                    self.num_classes
                )
            elif 'mobilenet' in self.model_name:
                model.classifier[1] = torch.nn.Linear(
                    model.classifier[1].in_features,
                    self.num_classes
                )

        return model

    def _load_imagenet_labels(self):
        """Load ImageNet class labels"""
        try:
            # This is a simplified version - in production, load from file
            self.class_names = [f"class_{i}" for i in range(1000)]
        except Exception:
            self.class_names = None

    def preprocess_image(self, image_path: str) -> torch.Tensor:
        """
        Preprocess image for model input

        Args:
            image_path: Path to image file

        Returns:
            Preprocessed image tensor
        """
        image = Image.open(image_path).convert('RGB')
        return self.transform(image).unsqueeze(0)

    def predict(
        self,
        image_path: str,
        top_k: int = 5
    ) -> Dict[str, Union[str, float, List]]:
        """
        Predict class for a single image

        Args:
            image_path: Path to image file
            top_k: Number of top predictions to return

        Returns:
            Dictionary with prediction results
        """
        # Preprocess image
        image_tensor = self.preprocess_image(image_path).to(self.device)

        # Make prediction
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)

        # Get top-k predictions
        top_probs, top_indices = torch.topk(probabilities, top_k)

        results = {
            'class': self._get_class_name(top_indices[0].item()),
            'class_id': top_indices[0].item(),
            'confidence': top_probs[0].item(),
            'top_k': [
                {
                    'class': self._get_class_name(idx.item()),
                    'class_id': idx.item(),
                    'confidence': prob.item()
                }
                for prob, idx in zip(top_probs, top_indices)
            ]
        }

        return results

    def predict_batch(
        self,
        image_paths: List[str],
        batch_size: int = 32
    ) -> List[Dict]:
        """
        Predict classes for multiple images

        Args:
            image_paths: List of image paths
            batch_size: Batch size for processing

        Returns:
            List of prediction results
        """
        results = []

        for i in range(0, len(image_paths), batch_size):
            batch_paths = image_paths[i:i + batch_size]
            batch_tensors = torch.cat([
                self.preprocess_image(path)
                for path in batch_paths
            ]).to(self.device)

            with torch.no_grad():
                outputs = self.model(batch_tensors)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)

            for j, probs in enumerate(probabilities):
                top_prob, top_idx = torch.max(probs, dim=0)
                results.append({
                    'image': batch_paths[j],
                    'class': self._get_class_name(top_idx.item()),
                    'class_id': top_idx.item(),
                    'confidence': top_prob.item()
                })

        return results

    def _get_class_name(self, class_id: int) -> str:
        """Get class name from class ID"""
        if self.class_names and class_id < len(self.class_names):
            return self.class_names[class_id]
        return f"class_{class_id}"

    def save_model(self, path: str):
        """Save model weights"""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'model_name': self.model_name,
            'num_classes': self.num_classes,
            'class_names': self.class_names
        }, path)
        print(f"Model saved to {path}")

    def load_model(self, path: str):
        """Load model weights"""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model_name = checkpoint['model_name']
        self.num_classes = checkpoint['num_classes']
        self.class_names = checkpoint.get('class_names')
        print(f"Model loaded from {path}")


def main():
    """Example usage"""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python classifier.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    # Initialize classifier
    print("Loading model...")
    classifier = ImageClassifier(model_name='resnet50')

    # Make prediction
    print(f"Classifying {image_path}...")
    result = classifier.predict(image_path)

    # Print results
    print(f"\nTop prediction:")
    print(f"Class: {result['class']}")
    print(f"Confidence: {result['confidence']:.2%}")

    print(f"\nTop 5 predictions:")
    for i, pred in enumerate(result['top_k'], 1):
        print(f"{i}. {pred['class']}: {pred['confidence']:.2%}")


if __name__ == "__main__":
    main()
