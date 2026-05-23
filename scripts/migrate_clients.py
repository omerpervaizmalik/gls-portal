import pandas as pd
import sqlite3
import os
import uuid

# Configuration
DB_PATH = "../prisma/dev.db"
EXCEL_PATH = "D:/Accounts.xlsx"

def generate_id():
    return str(uuid.uuid4())

def clean(val):
    if pd.isna(val):
        return None
    s = str(val).strip()
    return None if s.lower() in ('nan', 'none', '') else s

def migrate():
    print(f"Reading {EXCEL_PATH}...")
    # Header is on row index 4 (0-based)
    df = pd.read_excel(EXCEL_PATH, header=4)
    df.columns = [str(c).strip() for c in df.columns]
    print(f"Columns found: {df.columns.tolist()}")
    print(f"Total rows: {len(df)}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    migrated = 0
    skipped = 0

    for _, row in df.iterrows():
        cf_no = clean(row.get('CF No'))
        name  = clean(row.get('Name of Client'))

        if not cf_no or not name:
            skipped += 1
            continue

        client_id = generate_id()
        cnic      = clean(row.get('CNIC'))
        email     = clean(row.get('Email'))
        password  = clean(row.get('Iris Passord'))
        mobile    = clean(row.get('Mobile No'))
        reference = clean(row.get('Reference'))
        status    = clean(row.get('Status')) or 'ACTIVE'
        try:
            payment = float(row.get('Payment')) if not pd.isna(row.get('Payment', float('nan'))) else 0.0
        except (ValueError, TypeError):
            payment = 0.0
        filled_by = clean(row.get('Filled by'))

        try:
            cursor.execute("""
                INSERT INTO Client (id, cfNo, name, cnic, email, irisPassword, mobileNo, reference, status, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT(cfNo) DO UPDATE SET
                    name=excluded.name, cnic=excluded.cnic, email=excluded.email,
                    irisPassword=excluded.irisPassword, mobileNo=excluded.mobileNo,
                    reference=excluded.reference, status=excluded.status,
                    updatedAt=CURRENT_TIMESTAMP
            """, (client_id, cf_no, name, cnic, email, password, mobile, reference, status))

            # After upsert, retrieve the actual id (handles conflict case too)
            cursor.execute("SELECT id FROM Client WHERE cfNo = ?", (cf_no,))
            actual_id = cursor.fetchone()[0]

            # Insert yearly filings
            # Insert yearly filings
            for year in [2021, 2022, 2023, 2024, 2025]:
                yr_status = clean(row.get(str(year)))
                if yr_status:
                    yr_payment = payment if year == 2025 else 0.0
                    filing_id = f"{actual_id[:8]}_{year}"
                    cursor.execute(
                        """
                        INSERT INTO Filing (id, clientId, year, status, paymentAmount, filledBy, createdAt, updatedAt)
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        ON CONFLICT(clientId, year) DO UPDATE SET
                            status=excluded.status, paymentAmount=excluded.paymentAmount,
                            filledBy=excluded.filledBy, updatedAt=CURRENT_TIMESTAMP
                        """,
                        (filing_id, actual_id, year, yr_status, yr_payment, filled_by)
                    )

            migrated += 1
        except Exception as e:
            print(f"  Warning: Error on CF No {cf_no}: {e}")
            skipped += 1

    conn.commit()
    conn.close()

    print(f"\nMigration complete!")
    print(f"   Migrated: {migrated} clients")
    print(f"   Skipped:  {skipped} rows")

if __name__ == "__main__":
    migrate()
