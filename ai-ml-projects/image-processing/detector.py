"""
Object Detection using YOLO
"""
from ultralytics import YOLO
from PIL import Image
import cv2
import numpy as np
from typing import List, Dict, Optional, Tuple


class ObjectDetector:
    """Object detection using YOLO models"""

    def __init__(
        self,
        model: str = 'yolov8n',
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        device: Optional[str] = None
    ):
        """
        Initialize the object detector

        Args:
            model: YOLO model variant (yolov8n, yolov8s, yolov8m, yolov8l, yolov8x)
            conf_threshold: Confidence threshold for detections
            iou_threshold: IOU threshold for NMS
            device: Device to use (cuda/cpu)
        """
        self.model_name = model
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.device = device or 'cpu'

        # Load YOLO model
        print(f"Loading {model} model...")
        self.model = YOLO(f'{model}.pt')

        # Get class names
        self.class_names = self.model.names

    def detect(
        self,
        image_path: str,
        save: bool = False,
        save_path: Optional[str] = None
    ) -> List[Dict]:
        """
        Detect objects in an image

        Args:
            image_path: Path to image file
            save: Whether to save annotated image
            save_path: Path to save annotated image

        Returns:
            List of detection dictionaries
        """
        # Run inference
        results = self.model(
            image_path,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            device=self.device
        )

        # Parse results
        detections = []
        for result in results:
            boxes = result.boxes

            for box in boxes:
                detection = {
                    'class': self.class_names[int(box.cls[0])],
                    'class_id': int(box.cls[0]),
                    'confidence': float(box.conf[0]),
                    'bbox': box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
                    'bbox_normalized': box.xywhn[0].tolist()  # [x, y, w, h] normalized
                }
                detections.append(detection)

        # Save annotated image if requested
        if save:
            output_path = save_path or image_path.replace('.', '_detected.')
            self.visualize(image_path, detections, output_path)

        return detections

    def detect_batch(
        self,
        image_paths: List[str],
        save: bool = False
    ) -> Dict[str, List[Dict]]:
        """
        Detect objects in multiple images

        Args:
            image_paths: List of image paths
            save: Whether to save annotated images

        Returns:
            Dictionary mapping image paths to detections
        """
        results_dict = {}

        for image_path in image_paths:
            detections = self.detect(image_path, save=save)
            results_dict[image_path] = detections

        return results_dict

    def visualize(
        self,
        image_path: str,
        detections: List[Dict],
        output_path: str
    ):
        """
        Visualize detections on image

        Args:
            image_path: Path to original image
            detections: List of detections
            output_path: Path to save annotated image
        """
        # Read image
        image = cv2.imread(image_path)

        # Draw detections
        for det in detections:
            x1, y1, x2, y2 = map(int, det['bbox'])

            # Draw bounding box
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)

            # Draw label
            label = f"{det['class']} {det['confidence']:.2f}"
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)

            # Draw label background
            cv2.rectangle(
                image,
                (x1, y1 - label_size[1] - 10),
                (x1 + label_size[0], y1),
                (0, 255, 0),
                -1
            )

            # Draw label text
            cv2.putText(
                image,
                label,
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 0),
                2
            )

        # Save image
        cv2.imwrite(output_path, image)
        print(f"Annotated image saved to {output_path}")

    def count_objects(self, detections: List[Dict]) -> Dict[str, int]:
        """
        Count detected objects by class

        Args:
            detections: List of detections

        Returns:
            Dictionary mapping class names to counts
        """
        counts = {}
        for det in detections:
            class_name = det['class']
            counts[class_name] = counts.get(class_name, 0) + 1
        return counts

    def filter_by_class(
        self,
        detections: List[Dict],
        classes: List[str]
    ) -> List[Dict]:
        """
        Filter detections by class names

        Args:
            detections: List of detections
            classes: List of class names to keep

        Returns:
            Filtered detections
        """
        return [det for det in detections if det['class'] in classes]

    def get_largest_object(
        self,
        detections: List[Dict],
        class_name: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Get the largest detected object

        Args:
            detections: List of detections
            class_name: Optional class name to filter by

        Returns:
            Largest object detection or None
        """
        if not detections:
            return None

        # Filter by class if specified
        if class_name:
            detections = self.filter_by_class(detections, [class_name])

        if not detections:
            return None

        # Calculate areas and find largest
        largest = max(detections, key=lambda d: (
            (d['bbox'][2] - d['bbox'][0]) * (d['bbox'][3] - d['bbox'][1])
        ))

        return largest


def main():
    """Example usage"""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python detector.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    # Initialize detector
    print("Loading detector...")
    detector = ObjectDetector(model='yolov8n')

    # Detect objects
    print(f"Detecting objects in {image_path}...")
    detections = detector.detect(image_path, save=True)

    # Print results
    print(f"\nFound {len(detections)} objects:")
    counts = detector.count_objects(detections)

    for class_name, count in counts.items():
        print(f"  {class_name}: {count}")

    print("\nDetailed detections:")
    for i, det in enumerate(detections, 1):
        print(f"{i}. {det['class']}: {det['confidence']:.2%}")


if __name__ == "__main__":
    main()
