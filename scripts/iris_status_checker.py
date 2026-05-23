import sqlite3
import sys
import json
import os
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

# Paths
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'prisma', 'dev.db')
COOKIES_FILE = os.path.join(os.path.dirname(__file__), "iris_session.json")


def update_client_status(cf_no, status):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("UPDATE Client SET status = ? WHERE cfNo = ?", (status, cf_no))
        conn.commit()
        conn.close()
        print(f"Updated Client CF#{cf_no} status to: {status}")
    except Exception as e:
        print(f"Database error: {e}")


def check_iris_status(registration_no, cf_no):
    print(f"Syncing IRIS status for CNIC: {registration_no} (CF#{cf_no})...")

    if not os.path.exists(COOKIES_FILE):
        print(f"ERROR: Session file not found at {COOKIES_FILE}")
        print("Please run 'python scripts/iris_capture_session.py' first.")
        return

    with open(COOKIES_FILE, "r") as f:
        session_data = json.load(f)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Restore the saved session
        context = browser.new_context(
            storage_state=session_data["storage"],
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1600, "height": 900}
        )
        # Also add cookies directly
        if session_data.get("cookies"):
            context.add_cookies(session_data["cookies"])

        page = context.new_page()

        try:
            print("Opening IRIS dashboard with saved session...")
            page.goto("https://iris.fbr.gov.pk/dashboard", timeout=60000, wait_until="domcontentloaded")
            page.wait_for_timeout(4000)

            current_url = page.url
            print(f"Current URL: {current_url}")

            # Check if we were redirected back to login (session expired)
            if "login" in current_url.lower() or "iris.fbr.gov.pk/" == current_url.rstrip("/"):
                print("Session has expired. Please run iris_capture_session.py again.")
                update_client_status(cf_no, "PENDING")
                browser.close()
                return

            print("Session active! Scanning for filed returns...")
            page.screenshot(path="iris_dashboard.png")

            # Navigate to Declaration > Completed Tasks in sidebar
            try:
                page.click("text=Declaration", timeout=8000)
                page.wait_for_timeout(2000)
            except:
                print("Could not expand Declaration menu, reading page content directly.")

            content = page.content()

            # Look for evidence of a filed return
            filing_keywords = ["114(1)", "Tax Return", "Acknowledgement", "Filed", "Submitted"]
            filing_years    = ["2024", "2025", "TY2024", "TY2025"]

            keyword_found = any(kw in content for kw in filing_keywords)
            year_found    = any(yr in content for yr in filing_years)

            if keyword_found and year_found:
                print("[FILED] Tax return found. Marking as CLEARED.")
                update_client_status(cf_no, "CLEARED")
            else:
                print("[NO RETURN] No filed return found. Status remains ACTIVE.")
                update_client_status(cf_no, "ACTIVE")

        except Exception as e:
            print(f"Sync error: {e}")
            try:
                page.screenshot(path="iris_sync_error.png")
                print("Error screenshot saved.")
            except:
                pass
        finally:
            browser.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python iris_status_checker.py <cnic> <cf_no>")
        sys.exit(1)

    check_iris_status(sys.argv[1], sys.argv[2])
