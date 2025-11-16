"""
FastAPI 服務範例
提供 REST API 介面進行情感分析
"""

import sys
sys.path.insert(0, '../src')

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sentiment_analyzer import SentimentAnalyzer
import uvicorn


app = FastAPI(
    title="情感分析 API",
    description="使用 Transformers 進行文本情感分析的 REST API",
    version="1.0.0"
)

# 全局分析器實例
analyzer = None


class TextInput(BaseModel):
    text: str
    model: Optional[str] = None


class BatchTextInput(BaseModel):
    texts: List[str]
    batch_size: Optional[int] = 8
    model: Optional[str] = None


class SentimentResult(BaseModel):
    label: str
    score: float
    text: Optional[str] = None


@app.on_event("startup")
async def startup_event():
    """啟動時初始化模型"""
    global analyzer
    print("正在載入情感分析模型...")
    analyzer = SentimentAnalyzer()
    print("模型載入完成！")


@app.get("/")
async def root():
    """根路徑"""
    return {
        "message": "情感分析 API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """健康檢查"""
    return {
        "status": "healthy",
        "model_loaded": analyzer is not None
    }


@app.post("/analyze", response_model=SentimentResult)
async def analyze_text(input_data: TextInput):
    """
    分析單個文本的情感
    
    - **text**: 要分析的文本
    - **model**: 可選的模型名稱（暫不支持動態切換）
    """
    if analyzer is None:
        raise HTTPException(status_code=503, detail="模型未載入")
    
    if not input_data.text.strip():
        raise HTTPException(status_code=400, detail="文本不能為空")
    
    try:
        result = analyzer.analyze(input_data.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失敗: {str(e)}")


@app.post("/analyze/batch", response_model=List[SentimentResult])
async def analyze_batch(input_data: BatchTextInput):
    """
    批量分析多個文本的情感
    
    - **texts**: 文本列表
    - **batch_size**: 批次大小（默認 8）
    - **model**: 可選的模型名稱（暫不支持動態切換）
    """
    if analyzer is None:
        raise HTTPException(status_code=503, detail="模型未載入")
    
    if not input_data.texts:
        raise HTTPException(status_code=400, detail="文本列表不能為空")
    
    try:
        results = analyzer.analyze_batch(
            input_data.texts,
            batch_size=input_data.batch_size
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量分析失敗: {str(e)}")


@app.get("/stats")
async def get_stats():
    """獲取模型信息"""
    if analyzer is None:
        raise HTTPException(status_code=503, detail="模型未載入")
    
    return {
        "model_name": analyzer.model_name,
        "device": "GPU" if analyzer.device == 0 else "CPU"
    }


if __name__ == "__main__":
    print("啟動情感分析 API 服務...")
    print("訪問 http://localhost:8000/docs 查看 API 文檔")
    uvicorn.run(app, host="0.0.0.0", port=8000)
