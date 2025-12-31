"""
Model Inference Example
========================
This example demonstrates how to perform inference with trained ML models,
including batch and real-time prediction, model versioning, and performance monitoring.

Features:
- Single and batch prediction
- Real-time inference API
- Model versioning and management
- Prediction caching
- Performance monitoring
- Error handling and logging
"""

import numpy as np
import pandas as pd
import joblib
import logging
from typing import Union, List, Dict, Any, Optional
from pathlib import Path
import json
from datetime import datetime
import time
from functools import lru_cache
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ModelInference:
    """
    A comprehensive inference class for making predictions with trained ML models.
    """

    def __init__(self, model_path: str, model_name: str = 'model'):
        """
        Initialize the ModelInference.

        Args:
            model_path: Path to the directory containing the model
            model_name: Name of the model file (without extension)
        """
        self.model_path = Path(model_path)
        self.model_name = model_name
        self.model = None
        self.scaler = None
        self.metadata = None
        self.prediction_history = []

        # Load model components
        self._load_model_components()

    def _load_model_components(self) -> None:
        """Load model, scaler, and metadata from disk."""
        try:
            # Load model
            model_file = self.model_path / f"{self.model_name}.joblib"
            if not model_file.exists():
                raise FileNotFoundError(f"Model file not found: {model_file}")

            self.model = joblib.load(model_file)
            logger.info(f"Model loaded from {model_file}")

            # Load scaler (optional)
            scaler_file = self.model_path / f"{self.model_name}_scaler.joblib"
            if scaler_file.exists():
                self.scaler = joblib.load(scaler_file)
                logger.info(f"Scaler loaded from {scaler_file}")

            # Load metadata (optional)
            metadata_file = self.model_path / f"{self.model_name}_metadata.json"
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    self.metadata = json.load(f)
                logger.info(f"Metadata loaded from {metadata_file}")

        except Exception as e:
            logger.error(f"Error loading model components: {str(e)}")
            raise

    def predict_single(
        self,
        features: Union[np.ndarray, List[float], Dict[str, float]],
        return_proba: bool = False
    ) -> Union[float, int, np.ndarray]:
        """
        Make a prediction for a single sample.

        Args:
            features: Input features (array, list, or dict)
            return_proba: If True, return probability estimates (classification only)

        Returns:
            Prediction (single value or probability array)
        """
        try:
            # Convert input to numpy array
            if isinstance(features, dict):
                features = np.array(list(features.values()))
            elif isinstance(features, list):
                features = np.array(features)

            # Reshape to 2D array (required by sklearn)
            features = features.reshape(1, -1)

            # Scale features if scaler is available
            if self.scaler is not None:
                features = self.scaler.transform(features)

            # Make prediction
            start_time = time.time()

            if return_proba and hasattr(self.model, 'predict_proba'):
                prediction = self.model.predict_proba(features)[0]
            else:
                prediction = self.model.predict(features)[0]

            inference_time = time.time() - start_time

            # Log prediction
            self._log_prediction(features, prediction, inference_time)

            logger.debug(f"Single prediction made in {inference_time:.4f}s")

            return prediction

        except Exception as e:
            logger.error(f"Error making single prediction: {str(e)}")
            raise

    def predict_batch(
        self,
        features: Union[np.ndarray, pd.DataFrame, List[List[float]]],
        return_proba: bool = False,
        batch_size: Optional[int] = None
    ) -> np.ndarray:
        """
        Make predictions for multiple samples.

        Args:
            features: Input features (2D array, DataFrame, or list of lists)
            return_proba: If True, return probability estimates (classification only)
            batch_size: If specified, process in batches of this size

        Returns:
            Array of predictions
        """
        try:
            # Convert input to numpy array
            if isinstance(features, pd.DataFrame):
                features = features.values
            elif isinstance(features, list):
                features = np.array(features)

            # Ensure 2D array
            if features.ndim == 1:
                features = features.reshape(-1, 1)

            # Scale features if scaler is available
            if self.scaler is not None:
                features = self.scaler.transform(features)

            logger.info(f"Making batch predictions for {len(features)} samples")

            # Process in batches if specified
            if batch_size is not None and len(features) > batch_size:
                predictions = self._predict_in_batches(
                    features, batch_size, return_proba
                )
            else:
                # Make predictions
                start_time = time.time()

                if return_proba and hasattr(self.model, 'predict_proba'):
                    predictions = self.model.predict_proba(features)
                else:
                    predictions = self.model.predict(features)

                inference_time = time.time() - start_time

                logger.info(
                    f"Batch prediction completed in {inference_time:.4f}s "
                    f"({len(features)/inference_time:.2f} samples/sec)"
                )

            return predictions

        except Exception as e:
            logger.error(f"Error making batch prediction: {str(e)}")
            raise

    def _predict_in_batches(
        self,
        features: np.ndarray,
        batch_size: int,
        return_proba: bool
    ) -> np.ndarray:
        """
        Make predictions in batches for memory efficiency.

        Args:
            features: Input features
            batch_size: Size of each batch
            return_proba: Whether to return probabilities

        Returns:
            Array of predictions
        """
        predictions = []
        n_batches = int(np.ceil(len(features) / batch_size))

        logger.info(f"Processing {n_batches} batches of size {batch_size}")

        for i in range(n_batches):
            start_idx = i * batch_size
            end_idx = min((i + 1) * batch_size, len(features))
            batch = features[start_idx:end_idx]

            if return_proba and hasattr(self.model, 'predict_proba'):
                batch_pred = self.model.predict_proba(batch)
            else:
                batch_pred = self.model.predict(batch)

            predictions.append(batch_pred)

            logger.debug(f"Batch {i+1}/{n_batches} completed")

        return np.concatenate(predictions)

    def predict_with_confidence(
        self,
        features: Union[np.ndarray, List[float]]
    ) -> Dict[str, Any]:
        """
        Make prediction with confidence score (classification only).

        Args:
            features: Input features

        Returns:
            Dictionary with prediction, confidence, and all probabilities
        """
        try:
            if not hasattr(self.model, 'predict_proba'):
                raise ValueError("Model does not support probability estimation")

            # Get probabilities
            probas = self.predict_single(features, return_proba=True)

            # Get prediction and confidence
            prediction = np.argmax(probas)
            confidence = np.max(probas)

            result = {
                'prediction': int(prediction),
                'confidence': float(confidence),
                'probabilities': probas.tolist(),
                'all_class_probabilities': {
                    f'class_{i}': float(p) for i, p in enumerate(probas)
                }
            }

            logger.debug(
                f"Prediction: {prediction}, Confidence: {confidence:.4f}"
            )

            return result

        except Exception as e:
            logger.error(f"Error making prediction with confidence: {str(e)}")
            raise

    def predict_from_dataframe(
        self,
        df: pd.DataFrame,
        feature_columns: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Make predictions from a DataFrame and return results as DataFrame.

        Args:
            df: Input DataFrame
            feature_columns: List of feature column names (if None, use all)

        Returns:
            DataFrame with predictions added
        """
        try:
            # Select feature columns
            if feature_columns is not None:
                features = df[feature_columns].values
            else:
                features = df.values

            # Make predictions
            predictions = self.predict_batch(features)

            # Add predictions to DataFrame
            result_df = df.copy()
            result_df['prediction'] = predictions

            # Add probabilities if available
            if hasattr(self.model, 'predict_proba'):
                probas = self.predict_batch(features, return_proba=True)
                for i in range(probas.shape[1]):
                    result_df[f'probability_class_{i}'] = probas[:, i]

            logger.info(f"Predictions added to DataFrame with {len(df)} rows")

            return result_df

        except Exception as e:
            logger.error(f"Error predicting from DataFrame: {str(e)}")
            raise

    def _log_prediction(
        self,
        features: np.ndarray,
        prediction: Union[float, int, np.ndarray],
        inference_time: float
    ) -> None:
        """Log prediction details to history."""
        self.prediction_history.append({
            'timestamp': datetime.now().isoformat(),
            'prediction': float(prediction) if isinstance(prediction, (int, float, np.number)) else prediction.tolist(),
            'inference_time_ms': inference_time * 1000,
            'feature_shape': features.shape
        })

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the loaded model.

        Returns:
            Dictionary with model information
        """
        info = {
            'model_name': self.model_name,
            'model_type': str(type(self.model).__name__),
            'model_path': str(self.model_path),
            'has_scaler': self.scaler is not None,
            'has_metadata': self.metadata is not None,
            'n_predictions': len(self.prediction_history)
        }

        # Add model-specific attributes
        if hasattr(self.model, 'n_features_in_'):
            info['n_features'] = self.model.n_features_in_

        if hasattr(self.model, 'feature_importances_'):
            info['has_feature_importances'] = True

        if self.metadata:
            info.update(self.metadata)

        return info

    def get_prediction_stats(self) -> Dict[str, Any]:
        """
        Get statistics about predictions made.

        Returns:
            Dictionary with prediction statistics
        """
        if not self.prediction_history:
            return {'message': 'No predictions made yet'}

        inference_times = [p['inference_time_ms'] for p in self.prediction_history]

        stats = {
            'total_predictions': len(self.prediction_history),
            'mean_inference_time_ms': np.mean(inference_times),
            'median_inference_time_ms': np.median(inference_times),
            'min_inference_time_ms': np.min(inference_times),
            'max_inference_time_ms': np.max(inference_times),
            'std_inference_time_ms': np.std(inference_times)
        }

        return stats

    def save_predictions(self, output_path: str) -> None:
        """
        Save prediction history to a JSON file.

        Args:
            output_path: Path to save the predictions
        """
        try:
            with open(output_path, 'w') as f:
                json.dump(self.prediction_history, f, indent=2)

            logger.info(f"Prediction history saved to {output_path}")

        except Exception as e:
            logger.error(f"Error saving predictions: {str(e)}")
            raise


class InferenceAPI:
    """
    A simple API wrapper for model inference with caching support.
    """

    def __init__(self, model_path: str, model_name: str = 'model', use_cache: bool = True):
        """
        Initialize the InferenceAPI.

        Args:
            model_path: Path to the model directory
            model_name: Name of the model file
            use_cache: Whether to cache predictions
        """
        self.inference = ModelInference(model_path, model_name)
        self.use_cache = use_cache
        self._cache = {}

    def _get_cache_key(self, features: np.ndarray) -> str:
        """Generate cache key from features."""
        return hashlib.md5(features.tobytes()).hexdigest()

    @lru_cache(maxsize=1000)
    def predict(self, features_hash: str, features_tuple: tuple) -> Any:
        """
        Cached prediction method.

        Args:
            features_hash: Hash of features (for cache key)
            features_tuple: Features as tuple (for actual prediction)

        Returns:
            Prediction result
        """
        features = np.array(features_tuple)
        return self.inference.predict_single(features)

    def predict_with_cache(
        self,
        features: Union[np.ndarray, List[float]]
    ) -> Dict[str, Any]:
        """
        Make prediction with caching.

        Args:
            features: Input features

        Returns:
            Dictionary with prediction and cache info
        """
        try:
            # Convert to numpy array
            if isinstance(features, list):
                features = np.array(features)

            # Generate cache key
            cache_key = self._get_cache_key(features)

            # Check cache
            if self.use_cache and cache_key in self._cache:
                logger.debug("Prediction served from cache")
                return {
                    'prediction': self._cache[cache_key],
                    'from_cache': True
                }

            # Make prediction
            prediction = self.inference.predict_single(features)

            # Store in cache
            if self.use_cache:
                self._cache[cache_key] = prediction

            return {
                'prediction': prediction,
                'from_cache': False
            }

        except Exception as e:
            logger.error(f"Error in cached prediction: {str(e)}")
            raise

    def clear_cache(self) -> None:
        """Clear the prediction cache."""
        self._cache.clear()
        logger.info("Prediction cache cleared")


def example_single_prediction():
    """Example: Make a single prediction."""
    logger.info("=" * 60)
    logger.info("Single Prediction Example")
    logger.info("=" * 60)

    # Note: This assumes you have a trained model saved
    # Run model-training.py first to create a model

    try:
        # Initialize inference
        inference = ModelInference(
            model_path='models/classification',
            model_name='random_forest_classifier'
        )

        # Sample features
        features = np.random.randn(20)

        # Make prediction
        prediction = inference.predict_single(features)
        logger.info(f"Prediction: {prediction}")

        # Make prediction with confidence
        result = inference.predict_with_confidence(features)
        logger.info(f"Prediction with confidence: {result}")

        # Display model info
        info = inference.get_model_info()
        logger.info(f"Model info: {json.dumps(info, indent=2)}")

    except FileNotFoundError:
        logger.warning("Model not found. Please train a model first using model-training.py")


def example_batch_prediction():
    """Example: Make batch predictions."""
    logger.info("=" * 60)
    logger.info("Batch Prediction Example")
    logger.info("=" * 60)

    try:
        # Initialize inference
        inference = ModelInference(
            model_path='models/classification',
            model_name='random_forest_classifier'
        )

        # Sample batch data
        n_samples = 100
        n_features = 20
        features = np.random.randn(n_samples, n_features)

        # Make batch predictions
        predictions = inference.predict_batch(features)
        logger.info(f"Made {len(predictions)} predictions")

        # Make batch predictions with probabilities
        probabilities = inference.predict_batch(features, return_proba=True)
        logger.info(f"Probability shape: {probabilities.shape}")

        # Get prediction statistics
        stats = inference.get_prediction_stats()
        logger.info(f"Prediction stats: {json.dumps(stats, indent=2)}")

    except FileNotFoundError:
        logger.warning("Model not found. Please train a model first using model-training.py")


def example_dataframe_prediction():
    """Example: Make predictions from DataFrame."""
    logger.info("=" * 60)
    logger.info("DataFrame Prediction Example")
    logger.info("=" * 60)

    try:
        # Initialize inference
        inference = ModelInference(
            model_path='models/classification',
            model_name='random_forest_classifier'
        )

        # Create sample DataFrame
        n_samples = 50
        n_features = 20
        data = np.random.randn(n_samples, n_features)
        df = pd.DataFrame(data, columns=[f'feature_{i}' for i in range(n_features)])

        # Make predictions
        result_df = inference.predict_from_dataframe(df)
        logger.info(f"DataFrame with predictions:\n{result_df.head()}")

        # Save predictions
        inference.save_predictions('predictions/prediction_history.json')

    except FileNotFoundError:
        logger.warning("Model not found. Please train a model first using model-training.py")


def example_inference_api():
    """Example: Use InferenceAPI with caching."""
    logger.info("=" * 60)
    logger.info("Inference API with Caching Example")
    logger.info("=" * 60)

    try:
        # Initialize API
        api = InferenceAPI(
            model_path='models/classification',
            model_name='random_forest_classifier',
            use_cache=True
        )

        # Make predictions
        features = np.random.randn(20)

        # First call (not cached)
        result1 = api.predict_with_cache(features)
        logger.info(f"First call: {result1}")

        # Second call (cached)
        result2 = api.predict_with_cache(features)
        logger.info(f"Second call: {result2}")

        # Clear cache
        api.clear_cache()
        logger.info("Cache cleared")

    except FileNotFoundError:
        logger.warning("Model not found. Please train a model first using model-training.py")


if __name__ == "__main__":
    # Run examples
    example_single_prediction()
    print("\n")

    example_batch_prediction()
    print("\n")

    example_dataframe_prediction()
    print("\n")

    example_inference_api()
