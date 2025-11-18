"""
FastAPI REST API for Image Processing
提供圖像分類、物件偵測、圖像處理等 API 端點
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import io
import os
import tempfile
import shutil
from pathlib import Path
import numpy as np
from PIL import Image

# Import local modules
from classifier import ImageClassifier
from detector import ObjectDetector
from processor import ImageProcessor

# 創建 FastAPI 應用
app = FastAPI(
    title="Image Processing API",
    description="AI-powered image processing, classification, and object detection API",
    version="1.0.0"
)

# 添加 CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局變量存儲模型實例
classifier_cache = {}
detector_cache = {}
processor = ImageProcessor()

# 創建臨時目錄
TEMP_DIR = Path("temp_uploads")
TEMP_DIR.mkdir(exist_ok=True)


# ==================== 請求/響應模型 ====================

class ClassificationResponse(BaseModel):
    """分類結果響應"""
    class_name: str = Field(..., description="預測的類別名稱")
    class_id: int = Field(..., description="類別ID")
    confidence: float = Field(..., description="信心度 (0-1)")
    top_k: List[Dict[str, Any]] = Field(..., description="Top-K 預測結果")


class DetectionResponse(BaseModel):
    """偵測結果響應"""
    detections: List[Dict[str, Any]] = Field(..., description="偵測到的物件列表")
    count: int = Field(..., description="偵測到的物件總數")
    counts_by_class: Dict[str, int] = Field(..., description="按類別統計的物件數量")


class ProcessingResponse(BaseModel):
    """處理結果響應"""
    message: str = Field(..., description="處理狀態訊息")
    output_path: Optional[str] = Field(None, description="輸出文件路徑")


# ==================== 工具函數 ====================

def save_upload_file(upload_file: UploadFile) -> str:
    """保存上傳的文件到臨時目錄"""
    try:
        suffix = Path(upload_file.filename).suffix
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
            dir=TEMP_DIR
        )
        shutil.copyfileobj(upload_file.file, temp_file)
        temp_file.close()
        return temp_file.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        upload_file.file.close()


def get_classifier(model_name: str) -> ImageClassifier:
    """獲取或創建分類器實例（使用緩存）"""
    if model_name not in classifier_cache:
        try:
            classifier_cache[model_name] = ImageClassifier(model_name=model_name)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load classifier: {str(e)}"
            )
    return classifier_cache[model_name]


def get_detector(model_name: str) -> ObjectDetector:
    """獲取或創建偵測器實例（使用緩存）"""
    if model_name not in detector_cache:
        try:
            detector_cache[model_name] = ObjectDetector(model=model_name)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load detector: {str(e)}"
            )
    return detector_cache[model_name]


def cleanup_temp_file(file_path: str):
    """清理臨時文件"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass


# ==================== API 端點 ====================

@app.get("/")
async def root():
    """API 根端點"""
    return {
        "message": "Image Processing API",
        "version": "1.0.0",
        "endpoints": {
            "classification": "/classify",
            "detection": "/detect",
            "processing": "/process",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    """健康檢查端點"""
    return {"status": "healthy"}


# ==================== 圖像分類端點 ====================

@app.post("/classify", response_model=ClassificationResponse)
async def classify_image(
    file: UploadFile = File(..., description="要分類的圖像文件"),
    model: str = Form("resnet50", description="使用的模型名稱"),
    top_k: int = Form(5, description="返回前 K 個預測結果")
):
    """
    圖像分類端點

    上傳圖像並返回分類結果

    - **file**: 圖像文件 (jpg, png, etc.)
    - **model**: 模型名稱 (resnet50, efficientnet_b0, etc.)
    - **top_k**: 返回前 K 個預測結果
    """
    temp_path = None
    try:
        # 保存上傳文件
        temp_path = save_upload_file(file)

        # 獲取分類器
        classifier = get_classifier(model)

        # 執行分類
        result = classifier.predict(temp_path, top_k=top_k)

        return ClassificationResponse(
            class_name=result['class'],
            class_id=result['class_id'],
            confidence=result['confidence'],
            top_k=result['top_k']
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)


@app.post("/classify/batch")
async def classify_images_batch(
    files: List[UploadFile] = File(..., description="要分類的圖像文件列表"),
    model: str = Form("resnet50", description="使用的模型名稱")
):
    """
    批量圖像分類端點

    上傳多個圖像並返回分類結果
    """
    temp_paths = []
    try:
        # 保存所有上傳文件
        for file in files:
            temp_path = save_upload_file(file)
            temp_paths.append(temp_path)

        # 獲取分類器
        classifier = get_classifier(model)

        # 執行批量分類
        results = classifier.predict_batch(temp_paths)

        return {"results": results, "count": len(results)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for temp_path in temp_paths:
            cleanup_temp_file(temp_path)


# ==================== 物件偵測端點 ====================

@app.post("/detect", response_model=DetectionResponse)
async def detect_objects(
    file: UploadFile = File(..., description="要偵測的圖像文件"),
    model: str = Form("yolov8n", description="YOLO 模型變體"),
    conf_threshold: float = Form(0.25, description="信心度閾值"),
    save_annotated: bool = Form(False, description="是否保存標註圖像")
):
    """
    物件偵測端點

    上傳圖像並返回偵測到的物件

    - **file**: 圖像文件
    - **model**: YOLO 模型 (yolov8n, yolov8s, yolov8m, etc.)
    - **conf_threshold**: 信心度閾值 (0-1)
    - **save_annotated**: 是否保存帶標註的圖像
    """
    temp_path = None
    output_path = None

    try:
        # 保存上傳文件
        temp_path = save_upload_file(file)

        # 獲取偵測器
        detector = get_detector(model)
        detector.conf_threshold = conf_threshold

        # 執行偵測
        detections = detector.detect(temp_path, save=save_annotated)

        # 統計物件數量
        counts = detector.count_objects(detections)

        response = DetectionResponse(
            detections=detections,
            count=len(detections),
            counts_by_class=counts
        )

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)


# ==================== 圖像處理端點 ====================

@app.post("/process/resize")
async def resize_image(
    file: UploadFile = File(..., description="要調整大小的圖像"),
    width: Optional[int] = Form(None, description="目標寬度"),
    height: Optional[int] = Form(None, description="目標高度"),
    maintain_aspect: bool = Form(True, description="是否保持比例")
):
    """調整圖像大小"""
    temp_path = None
    output_path = None

    try:
        temp_path = save_upload_file(file)
        output_path = temp_path.replace(Path(temp_path).suffix, "_resized.jpg")

        processor.resize(
            temp_path,
            width=width,
            height=height,
            maintain_aspect=maintain_aspect,
            output_path=output_path
        )

        return FileResponse(
            output_path,
            media_type="image/jpeg",
            filename="resized_image.jpg"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)


@app.post("/process/enhance")
async def enhance_image(
    file: UploadFile = File(..., description="要增強的圖像"),
    brightness: float = Form(1.0, description="亮度因子"),
    contrast: float = Form(1.0, description="對比度因子"),
    saturation: float = Form(1.0, description="飽和度因子"),
    sharpness: float = Form(1.0, description="銳度因子")
):
    """圖像增強"""
    temp_path = None
    output_path = None

    try:
        temp_path = save_upload_file(file)
        output_path = temp_path.replace(Path(temp_path).suffix, "_enhanced.jpg")

        processor.enhance(
            temp_path,
            brightness=brightness,
            contrast=contrast,
            saturation=saturation,
            sharpness=sharpness,
            output_path=output_path
        )

        return FileResponse(
            output_path,
            media_type="image/jpeg",
            filename="enhanced_image.jpg"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)


@app.post("/process/denoise")
async def denoise_image(
    file: UploadFile = File(..., description="要降噪的圖像"),
    method: str = Form("bilateral", description="降噪方法")
):
    """圖像降噪"""
    temp_path = None
    output_path = None

    try:
        temp_path = save_upload_file(file)
        output_path = temp_path.replace(Path(temp_path).suffix, "_denoised.jpg")

        processor.denoise(temp_path, method=method, output_path=output_path)

        return FileResponse(
            output_path,
            media_type="image/jpeg",
            filename="denoised_image.jpg"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)


@app.post("/process/edge-detection")
async def detect_edges(
    file: UploadFile = File(..., description="要檢測邊緣的圖像"),
    method: str = Form("canny", description="邊緣檢測方法")
):
    """邊緣檢測"""
    temp_path = None
    output_path = None

    try:
        temp_path = save_upload_file(file)
        output_path = temp_path.replace(Path(temp_path).suffix, "_edges.jpg")

        processor.edge_detection(temp_path, method=method, output_path=output_path)

        return FileResponse(
            output_path,
            media_type="image/jpeg",
            filename="edges_image.jpg"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)


@app.post("/process/rotate")
async def rotate_image(
    file: UploadFile = File(..., description="要旋轉的圖像"),
    angle: float = Form(..., description="旋轉角度（度）")
):
    """旋轉圖像"""
    temp_path = None
    output_path = None

    try:
        temp_path = save_upload_file(file)
        output_path = temp_path.replace(Path(temp_path).suffix, "_rotated.jpg")

        processor.rotate(temp_path, angle=angle, output_path=output_path)

        return FileResponse(
            output_path,
            media_type="image/jpeg",
            filename="rotated_image.jpg"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)


@app.post("/process/convert")
async def convert_format(
    file: UploadFile = File(..., description="要轉換的圖像"),
    output_format: str = Form(..., description="輸出格式 (png, jpg, webp, etc.)")
):
    """轉換圖像格式"""
    temp_path = None

    try:
        temp_path = save_upload_file(file)
        output_path = processor.convert_format(temp_path, output_format)

        media_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'bmp': 'image/bmp'
        }

        return FileResponse(
            output_path,
            media_type=media_types.get(output_format.lower(), 'application/octet-stream'),
            filename=f"converted_image.{output_format}"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path:
            cleanup_temp_file(temp_path)


# ==================== 模型管理端點 ====================

@app.get("/models/classifiers")
async def list_classifiers():
    """列出可用的分類模型"""
    models = [
        "resnet18", "resnet34", "resnet50", "resnet101",
        "vgg16", "vgg19",
        "efficientnet_b0", "efficientnet_b1",
        "mobilenet_v2", "inception_v3"
    ]
    return {
        "available_models": models,
        "loaded_models": list(classifier_cache.keys())
    }


@app.get("/models/detectors")
async def list_detectors():
    """列出可用的偵測模型"""
    models = ["yolov8n", "yolov8s", "yolov8m", "yolov8l", "yolov8x"]
    return {
        "available_models": models,
        "loaded_models": list(detector_cache.keys())
    }


@app.post("/models/clear-cache")
async def clear_model_cache():
    """清除模型緩存"""
    classifier_cache.clear()
    detector_cache.clear()
    return {"message": "Model cache cleared"}


# ==================== 啟動應用 ====================

def main():
    """啟動 API 服務器"""
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
