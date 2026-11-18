# seed_data.py
from app.database import engine, Base, SessionLocal
from app.models import CatalogDesign

def seed():
    print("Creating tables in local boutique.db...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    existing = db.query(CatalogDesign).count()
    if existing > 0:
        print(f"Database already has {existing} designs. Skipping seed.")
        db.close()
        return

    sample_designs = [
        CatalogDesign(
            title="Princess Cut Sweetheart Neck Blouse",
            description="Contemporary padded princess cut blouse with customizable sweetheart neckline and piping finish.",
            category="Blouse",
            base_stitching_price=650.00,
            image_url="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
            estimated_turnaround_days=5
        ),
        CatalogDesign(
            title="Deep Boat Neck Elbow-Sleeve Blouse",
            description="Traditional elbow-sleeve blouse with front and back boat neck detailing, ideal for Kanjeevaram and silk sarees.",
            category="Blouse",
            base_stitching_price=800.00,
            image_url="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
            estimated_turnaround_days=6
        ),
        CatalogDesign(
            title="A-Line Straight Cut Kurti",
            description="Casual/office wear straight-cut kurti with side slits and customizable sleeve lengths (3/4th or full).",
            category="Kurti",
            base_stitching_price=450.00,
            image_url="https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=600&q=80",
            estimated_turnaround_days=4
        ),
        CatalogDesign(
            title="Floor-Length Anarkali Suit with Cancan",
            description="32-kali flared festive Anarkali suit with optional cancan net padding and matching churidar stitching.",
            category="Anarkali",
            base_stitching_price=1600.00,
            image_url="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80",
            estimated_turnaround_days=10
        ),
        CatalogDesign(
            title="Pleated Umbrella Lehenga Skirt & Choli",
            description="Traditional festive flared umbrella cut lehenga skirt with drawstring waist, side latkan hooks, and lined choli.",
            category="Lehenga",
            base_stitching_price=2200.00,
            image_url="https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&q=80",
            estimated_turnaround_days=12
        ),
    ]

    db.add_all(sample_designs)
    db.commit()
    print(f" Successfully seeded {len(sample_designs)} boutique designs into boutique.db!")
    db.close()

if __name__ == "__main__":
    seed()
