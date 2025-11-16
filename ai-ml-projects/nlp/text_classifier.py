"""
Text Classification using Transformers
"""
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)
import torch
from torch.utils.data import Dataset
import numpy as np
from typing import List, Dict, Optional
from sklearn.metrics import accuracy_score, precision_recall_fscore_support


class TextDataset(Dataset):
    """Custom dataset for text classification"""

    def __init__(self, texts: List[str], labels: List[int], tokenizer, max_length: int = 512):
        self.encodings = tokenizer(
            texts,
            truncation=True,
            padding=True,
            max_length=max_length,
            return_tensors='pt'
        )
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: val[idx] for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)


class TextClassifier:
    """Text classification using transformer models"""

    def __init__(
        self,
        model_name: str = "distilbert-base-uncased",
        num_labels: int = 2,
        label_names: Optional[List[str]] = None
    ):
        """
        Initialize text classifier

        Args:
            model_name: Pre-trained model name
            num_labels: Number of classification labels
            label_names: Names of the labels
        """
        self.model_name = model_name
        self.num_labels = num_labels
        self.label_names = label_names or [f"Label_{i}" for i in range(num_labels)]

        # Load tokenizer and model
        print(f"Loading model: {model_name}")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=num_labels
        )

        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def train(
        self,
        train_texts: List[str],
        train_labels: List[int],
        val_texts: Optional[List[str]] = None,
        val_labels: Optional[List[int]] = None,
        epochs: int = 3,
        batch_size: int = 16,
        learning_rate: float = 2e-5
    ):
        """
        Train the classifier

        Args:
            train_texts: Training texts
            train_labels: Training labels
            val_texts: Validation texts
            val_labels: Validation labels
            epochs: Number of training epochs
            batch_size: Batch size
            learning_rate: Learning rate
        """
        # Create datasets
        train_dataset = TextDataset(
            train_texts,
            train_labels,
            self.tokenizer
        )

        eval_dataset = None
        if val_texts and val_labels:
            eval_dataset = TextDataset(
                val_texts,
                val_labels,
                self.tokenizer
            )

        # Training arguments
        training_args = TrainingArguments(
            output_dir='./results',
            num_train_epochs=epochs,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            learning_rate=learning_rate,
            weight_decay=0.01,
            logging_dir='./logs',
            logging_steps=10,
            evaluation_strategy="epoch" if eval_dataset else "no",
            save_strategy="epoch",
            load_best_model_at_end=True if eval_dataset else False,
        )

        # Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            compute_metrics=self._compute_metrics
        )

        # Train
        print("Starting training...")
        trainer.train()
        print("Training completed!")

    def _compute_metrics(self, pred):
        """Compute metrics for evaluation"""
        labels = pred.label_ids
        preds = pred.predictions.argmax(-1)

        precision, recall, f1, _ = precision_recall_fscore_support(
            labels,
            preds,
            average='weighted'
        )
        acc = accuracy_score(labels, preds)

        return {
            'accuracy': acc,
            'f1': f1,
            'precision': precision,
            'recall': recall
        }

    def predict(self, text: str) -> Dict:
        """
        Predict class for a single text

        Args:
            text: Input text

        Returns:
            Dictionary with prediction results
        """
        self.model.eval()

        # Tokenize
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=512
        ).to(self.device)

        # Predict
        with torch.no_grad():
            outputs = self.model(**inputs)

        # Get probabilities
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        predicted_class = torch.argmax(probs, dim=-1).item()
        confidence = probs[0][predicted_class].item()

        return {
            'text': text,
            'label': self.label_names[predicted_class],
            'label_id': predicted_class,
            'confidence': confidence,
            'probabilities': {
                self.label_names[i]: probs[0][i].item()
                for i in range(self.num_labels)
            }
        }

    def predict_batch(
        self,
        texts: List[str],
        batch_size: int = 8
    ) -> List[Dict]:
        """
        Predict classes for multiple texts

        Args:
            texts: List of texts
            batch_size: Batch size

        Returns:
            List of predictions
        """
        results = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            for text in batch:
                result = self.predict(text)
                results.append(result)

        return results

    def save_model(self, path: str):
        """Save model and tokenizer"""
        self.model.save_pretrained(path)
        self.tokenizer.save_pretrained(path)
        print(f"Model saved to {path}")

    def load_model(self, path: str):
        """Load model and tokenizer"""
        self.model = AutoModelForSequenceClassification.from_pretrained(path)
        self.tokenizer = AutoTokenizer.from_pretrained(path)
        self.model.to(self.device)
        print(f"Model loaded from {path}")


def main():
    """Example usage"""
    # Sample data
    train_texts = [
        "I love this movie, it's fantastic!",
        "This is terrible, waste of time.",
        "Great product, highly recommend!",
        "Poor quality, very disappointed.",
        "Amazing experience, will buy again!",
        "Worst purchase ever, avoid this.",
    ]

    train_labels = [1, 0, 1, 0, 1, 0]  # 1 = positive, 0 = negative

    # Initialize classifier
    print("Initializing classifier...")
    classifier = TextClassifier(
        model_name="distilbert-base-uncased",
        num_labels=2,
        label_names=["Negative", "Positive"]
    )

    # Train (in production, use more data)
    print("\nTraining classifier...")
    classifier.train(
        train_texts,
        train_labels,
        epochs=3,
        batch_size=2
    )

    # Predict
    print("\n=== Predictions ===")
    test_texts = [
        "This is absolutely wonderful!",
        "I hate this product.",
        "It's okay, nothing special."
    ]

    for text in test_texts:
        result = classifier.predict(text)
        print(f"\nText: {text}")
        print(f"Prediction: {result['label']} ({result['confidence']:.2%})")
        print(f"Probabilities: {result['probabilities']}")


if __name__ == "__main__":
    main()
