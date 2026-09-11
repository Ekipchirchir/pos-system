from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from typing import List
from schemas import UserUpdate
import models
import schemas
import auth

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = auth.get_password_hash(user_data.password)
    new_user = models.User(
        username=user_data.username,
        hashed_password=hashed_pwd,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("manager"))
):
    users = db.query(models.User).all()
    return users

@router.post("/users", response_model=schemas.UserResponse)
def create_user_by_manager(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("manager"))
):
    if user_data.role not in ["manager", "cashier"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'manager' or 'cashier'")
        
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pwd = auth.get_password_hash(user_data.password)
    new_user = models.User(
        username=user_data.username,
        hashed_password=hashed_pwd,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("manager"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.username:
        existing = db.query(models.User).filter(models.User.username == user_update.username, models.User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = user_update.username

    if user_update.role:
        if user_update.role not in ["manager", "cashier"]:
            raise HTTPException(status_code=400, detail="Invalid role. Must be 'manager' or 'cashier'")
        user.role = user_update.role

    if user_update.password:
        user.hashed_password = auth.get_password_hash(user_update.password)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("manager"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent manager from deleting themselves accidentally
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own manager account")

    db.delete(user)
    db.commit()
    return None