"""
Image utility functions
"""
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, List


def load_image(path: str, mode: str = 'rgb') -> np.ndarray:
    """
    Load image from file

    Args:
        path: Image file path
        mode: Color mode ('rgb', 'bgr', 'grayscale')

    Returns:
        Image array
    """
    if mode == 'rgb':
        image = cv2.imread(path)
        return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    elif mode == 'bgr':
        return cv2.imread(path)
    elif mode == 'grayscale':
        return cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    else:
        raise ValueError(f"Unknown mode: {mode}")


def save_image(image: np.ndarray, path: str, mode: str = 'rgb'):
    """
    Save image to file

    Args:
        image: Image array
        path: Output file path
        mode: Color mode ('rgb', 'bgr', 'grayscale')
    """
    if mode == 'rgb':
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    cv2.imwrite(path, image)


def get_image_stats(image: np.ndarray) -> dict:
    """
    Get image statistics

    Args:
        image: Image array

    Returns:
        Dictionary with image statistics
    """
    stats = {
        'shape': image.shape,
        'dtype': str(image.dtype),
        'min': float(np.min(image)),
        'max': float(np.max(image)),
        'mean': float(np.mean(image)),
        'std': float(np.std(image))
    }

    if len(image.shape) == 3:
        stats['channels'] = image.shape[2]

    return stats


def normalize_image(image: np.ndarray, method: str = 'minmax') -> np.ndarray:
    """
    Normalize image values

    Args:
        image: Input image
        method: Normalization method ('minmax', 'zscore')

    Returns:
        Normalized image
    """
    if method == 'minmax':
        return (image - image.min()) / (image.max() - image.min())
    elif method == 'zscore':
        return (image - image.mean()) / image.std()
    else:
        raise ValueError(f"Unknown normalization method: {method}")


def create_thumbnail(image_path: str, size: Tuple[int, int] = (128, 128)) -> Image.Image:
    """
    Create thumbnail of image

    Args:
        image_path: Input image path
        size: Thumbnail size (width, height)

    Returns:
        Thumbnail image
    """
    image = Image.open(image_path)
    image.thumbnail(size, Image.Resampling.LANCZOS)
    return image
