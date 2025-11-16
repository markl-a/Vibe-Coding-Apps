from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus
from app.models.cart import Cart
from app.routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class CreateOrderRequest(BaseModel):
    shipping_address: str
    payment_method: str

class OrderResponse(BaseModel):
    id: str
    total_amount: float
    status: OrderStatus
    shipping_address: str
    created_at: str

    class Config:
        from_attributes = True

@router.post("/", response_model=OrderResponse)
def create_order(request: CreateOrderRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get user's cart
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Calculate total
    total_amount = 0
    order_items = []
    for cart_item in cart.items:
        product = cart_item.product
        if product.stock < cart_item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        total_amount += product.price * cart_item.quantity
        order_items.append({
            "product_id": product.id,
            "quantity": cart_item.quantity,
            "price": product.price,
        })

    # Create order
    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        shipping_address=request.shipping_address,
        payment_method=request.payment_method,
        status=OrderStatus.PENDING,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Create order items and update stock
    for item_data in order_items:
        order_item = OrderItem(
            order_id=order.id,
            **item_data
        )
        db.add(order_item)

        # Update product stock
        product = db.query(Product).filter(Product.id == item_data["product_id"]).first()
        product.stock -= item_data["quantity"]

    # Clear cart
    for cart_item in cart.items:
        db.delete(cart_item)

    db.commit()
    return order

@router.get("/", response_model=List[OrderResponse])
def get_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
