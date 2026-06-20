from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password


def seed():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "buyer@gmail.com").first():
            db.add(User(
                full_name="Test Buyer",
                email="buyer@gmail.com",
                phone="9999999991",
                password_hash=hash_password("password123"),
                role="buyer",
            ))
            print("Created buyer: buyer@gmail.com / password123")

        if not db.query(User).filter(User.email == "seller@gmail.com").first():
            db.add(User(
                full_name="Test Seller",
                email="seller@gmail.com",
                phone="9999999992",
                password_hash=hash_password("password123"),
                role="seller",
            ))
            print("Created seller: seller@gmail.com / password123")

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
