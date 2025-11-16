"""
Image Processing Utilities
"""
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from typing import Tuple, Optional, List
import os


class ImageProcessor:
    """Image processing and enhancement utilities"""

    def __init__(self):
        """Initialize image processor"""
        pass

    def resize(
        self,
        image_path: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        maintain_aspect: bool = True,
        output_path: Optional[str] = None
    ) -> np.ndarray:
        """
        Resize image

        Args:
            image_path: Path to input image
            width: Target width
            height: Target height
            maintain_aspect: Whether to maintain aspect ratio
            output_path: Path to save resized image

        Returns:
            Resized image array
        """
        image = cv2.imread(image_path)
        h, w = image.shape[:2]

        if maintain_aspect:
            if width and not height:
                height = int(h * (width / w))
            elif height and not width:
                width = int(w * (height / h))
            elif width and height:
                # Use the smaller scaling factor
                scale = min(width / w, height / h)
                width = int(w * scale)
                height = int(h * scale)

        resized = cv2.resize(image, (width, height), interpolation=cv2.INTER_LANCZOS4)

        if output_path:
            cv2.imwrite(output_path, resized)

        return resized

    def enhance(
        self,
        image_path: str,
        brightness: float = 1.0,
        contrast: float = 1.0,
        saturation: float = 1.0,
        sharpness: float = 1.0,
        output_path: Optional[str] = None
    ) -> Image.Image:
        """
        Enhance image

        Args:
            image_path: Path to input image
            brightness: Brightness factor (1.0 = original)
            contrast: Contrast factor (1.0 = original)
            saturation: Saturation factor (1.0 = original)
            sharpness: Sharpness factor (1.0 = original)
            output_path: Path to save enhanced image

        Returns:
            Enhanced image
        """
        image = Image.open(image_path)

        # Apply enhancements
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(brightness)

        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(contrast)

        if saturation != 1.0:
            enhancer = ImageEnhance.Color(image)
            image = enhancer.enhance(saturation)

        if sharpness != 1.0:
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(sharpness)

        if output_path:
            image.save(output_path)

        return image

    def denoise(
        self,
        image_path: str,
        method: str = 'bilateral',
        output_path: Optional[str] = None
    ) -> np.ndarray:
        """
        Denoise image

        Args:
            image_path: Path to input image
            method: Denoising method ('bilateral', 'gaussian', 'median', 'nlm')
            output_path: Path to save denoised image

        Returns:
            Denoised image array
        """
        image = cv2.imread(image_path)

        if method == 'bilateral':
            denoised = cv2.bilateralFilter(image, 9, 75, 75)
        elif method == 'gaussian':
            denoised = cv2.GaussianBlur(image, (5, 5), 0)
        elif method == 'median':
            denoised = cv2.medianBlur(image, 5)
        elif method == 'nlm':
            denoised = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
        else:
            raise ValueError(f"Unknown denoising method: {method}")

        if output_path:
            cv2.imwrite(output_path, denoised)

        return denoised

    def edge_detection(
        self,
        image_path: str,
        method: str = 'canny',
        output_path: Optional[str] = None
    ) -> np.ndarray:
        """
        Detect edges in image

        Args:
            image_path: Path to input image
            method: Edge detection method ('canny', 'sobel', 'laplacian')
            output_path: Path to save edge image

        Returns:
            Edge detection result
        """
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

        if method == 'canny':
            edges = cv2.Canny(image, 100, 200)
        elif method == 'sobel':
            sobelx = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=5)
            sobely = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=5)
            edges = np.sqrt(sobelx**2 + sobely**2)
            edges = np.uint8(edges)
        elif method == 'laplacian':
            edges = cv2.Laplacian(image, cv2.CV_64F)
            edges = np.uint8(np.absolute(edges))
        else:
            raise ValueError(f"Unknown edge detection method: {method}")

        if output_path:
            cv2.imwrite(output_path, edges)

        return edges

    def convert_format(
        self,
        image_path: str,
        output_format: str,
        output_path: Optional[str] = None
    ) -> str:
        """
        Convert image format

        Args:
            image_path: Path to input image
            output_format: Target format (png, jpg, webp, etc.)
            output_path: Path to save converted image

        Returns:
            Path to converted image
        """
        if output_path is None:
            base = os.path.splitext(image_path)[0]
            output_path = f"{base}.{output_format}"

        image = Image.open(image_path)

        # Handle transparency for JPG
        if output_format.lower() in ['jpg', 'jpeg'] and image.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[-1])
            image = background

        image.save(output_path, format=output_format.upper())
        return output_path

    def batch_convert(
        self,
        input_dir: str,
        output_dir: str,
        output_format: str,
        extensions: List[str] = None
    ):
        """
        Batch convert images in a directory

        Args:
            input_dir: Input directory
            output_dir: Output directory
            output_format: Target format
            extensions: List of input extensions to process
        """
        if extensions is None:
            extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']

        os.makedirs(output_dir, exist_ok=True)

        for filename in os.listdir(input_dir):
            ext = os.path.splitext(filename)[1].lower()

            if ext in extensions:
                input_path = os.path.join(input_dir, filename)
                output_filename = f"{os.path.splitext(filename)[0]}.{output_format}"
                output_path = os.path.join(output_dir, output_filename)

                try:
                    self.convert_format(input_path, output_format, output_path)
                    print(f"Converted: {filename} -> {output_filename}")
                except Exception as e:
                    print(f"Error converting {filename}: {e}")

    def crop(
        self,
        image_path: str,
        x: int,
        y: int,
        width: int,
        height: int,
        output_path: Optional[str] = None
    ) -> np.ndarray:
        """
        Crop image

        Args:
            image_path: Path to input image
            x: X coordinate of top-left corner
            y: Y coordinate of top-left corner
            width: Crop width
            height: Crop height
            output_path: Path to save cropped image

        Returns:
            Cropped image array
        """
        image = cv2.imread(image_path)
        cropped = image[y:y+height, x:x+width]

        if output_path:
            cv2.imwrite(output_path, cropped)

        return cropped

    def rotate(
        self,
        image_path: str,
        angle: float,
        output_path: Optional[str] = None
    ) -> np.ndarray:
        """
        Rotate image

        Args:
            image_path: Path to input image
            angle: Rotation angle in degrees (positive = counter-clockwise)
            output_path: Path to save rotated image

        Returns:
            Rotated image array
        """
        image = cv2.imread(image_path)
        h, w = image.shape[:2]
        center = (w // 2, h // 2)

        # Get rotation matrix
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)

        # Calculate new image size
        cos = np.abs(matrix[0, 0])
        sin = np.abs(matrix[0, 1])
        new_w = int((h * sin) + (w * cos))
        new_h = int((h * cos) + (w * sin))

        # Adjust rotation matrix
        matrix[0, 2] += (new_w / 2) - center[0]
        matrix[1, 2] += (new_h / 2) - center[1]

        # Rotate image
        rotated = cv2.warpAffine(image, matrix, (new_w, new_h), flags=cv2.INTER_LINEAR)

        if output_path:
            cv2.imwrite(output_path, rotated)

        return rotated


def main():
    """Example usage"""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python processor.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    processor = ImageProcessor()

    # Example operations
    print("Resizing image...")
    processor.resize(image_path, width=800, output_path='resized.jpg')

    print("Enhancing image...")
    processor.enhance(
        image_path,
        brightness=1.2,
        contrast=1.1,
        saturation=1.1,
        output_path='enhanced.jpg'
    )

    print("Detecting edges...")
    processor.edge_detection(image_path, method='canny', output_path='edges.jpg')

    print("Done!")


if __name__ == "__main__":
    main()
