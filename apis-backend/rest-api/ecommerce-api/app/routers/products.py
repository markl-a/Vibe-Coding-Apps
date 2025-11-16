from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.product import Product, Category
from pydantic import BaseModel

router = APIRouter()

class ProductResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    price: float
    stock: int
    image_url: str
    is_active: bool
    category_id: str

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    slug: str
    description: str
    price: float
    stock: int
    image_url: str
    category_id: str

@router.get("/", response_model=List[ProductResponse])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_active == True).offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product
