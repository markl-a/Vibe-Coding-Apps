"""
E-commerce REST API
使用 FastAPI 和 PostgreSQL 構建的電商平台後端
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import auth, users, products, cart, orders

app = FastAPI(
    title=settings.APP_NAME,
    description="電商平台 REST API - 支持商品管理、購物車、訂單處理、支付整合",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["認證"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["用戶"])
app.include_router(products.router, prefix=f"{settings.API_V1_PREFIX}/products", tags=["商品"])
app.include_router(cart.router, prefix=f"{settings.API_V1_PREFIX}/cart", tags=["購物車"])
app.include_router(orders.router, prefix=f"{settings.API_V1_PREFIX}/orders", tags=["訂單"])

@app.get("/")
async def root():
    return {
        "message": "歡迎使用 E-commerce API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
