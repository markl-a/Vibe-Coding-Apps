from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.routers.auth import get_current_user
from pydantic import BaseModel
from typing import List

router = APIRouter()

class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1

class CartItemResponse(BaseModel):
    id: str
    product_id: str
    quantity: int
    product_name: str
    product_price: float

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total: float

@router.post("/add")
def add_to_cart(request: AddToCartRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get or create cart
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    # Check if product exists
    product = db.query(Product).filter(Product.id == request.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check stock
    if product.stock < request.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    # Add or update cart item
    cart_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == request.product_id
    ).first()

    if cart_item:
        cart_item.quantity += request.quantity
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=request.product_id,
            quantity=request.quantity
        )
        db.add(cart_item)

    db.commit()
    return {"message": "Product added to cart"}

@router.get("/", response_model=CartResponse)
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        return CartResponse(items=[], total=0)

    items = []
    total = 0
    for cart_item in cart.items:
        product = cart_item.product
        items.append(CartItemResponse(
            id=cart_item.id,
            product_id=product.id,
            quantity=cart_item.quantity,
            product_name=product.name,
            product_price=product.price,
        ))
        total += product.price * cart_item.quantity

    return CartResponse(items=items, total=total)

@router.delete("/{item_id}")
def remove_from_cart(item_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart_item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not cart_item or cart_item.cart.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed from cart"}
