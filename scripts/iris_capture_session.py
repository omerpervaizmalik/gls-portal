"""
IRIS Session Capturer - Auto Mode
Opens a real browser. Log in manually, solve the CAPTCHA.
The script auto-detects when you reach the dashboard and saves the session.
"""
import json
import os
import time
from playwright.sync_api import sync_playwright

COOKIES_FILE = os.path.join(os.path.dirname(__file__), "iris_session.json")

def capture_session():
    print("=" * 60)
    print("IRIS Session Capturer (Auto-Detect Mode)")
    print("=" * 60)
    print()
    print("A browser window is opening...")
    print("Log in to IRIS, solve the CAPTCHA, and go to the dashboard.")
    print("This script will automatically save your session once detected.")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,  # Real visible window
            args=["--start-maximized"]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            no_viewport=True
        )
        page = context.new_page()
        page.goto("https://iris.fbr.gov.pk/", timeout=60000)

        print("Waiting for you to log in... (checking every 3 seconds)")
        print("The browser will close automatically once the session is saved.")
        print()

        # Auto-detect: Poll until the URL shows /dashboard or key element appears
        max_wait = 300  # 5 minutes max
        elapsed = 0
        saved = False

        while elapsed < max_wait:
            try:
                current_url = page.url
                # Check if we are past the login page
                if "/dashboard" in current_url or (
                    "iris.fbr.gov.pk" in current_url and
                    page.query_selector("text=Declaration, text=Inbox, text=My Profile")
                ):
                    print(f"Dashboard detected at: {current_url}")
                    print("Saving session cookies...")

                    cookies = context.cookies()
                    storage = context.storage_state()

                    with open(COOKIES_FILE, "w") as f:
                        json.dump({"cookies": cookies, "storage": storage}, f, indent=2)

                    print(f"✅ Session saved! ({len(cookies)} cookies captured)")
                    print(f"   File: {COOKIES_FILE}")
                    saved = True
                    time.sleep(2)
                    break
            except Exception as e:
                pass  # Page might be navigating

            time.sleep(3)
            elapsed += 3
            if elapsed % 30 == 0:
                print(f"Still waiting... ({elapsed}s elapsed)")

        if not saved:
            print("❌ Timed out waiting for login. Please run the script again.")

        browser.close()

    if saved:
        print()
        print("Done! Use the 'Sync IRIS Status' button in Client Accounts.")

if __name__ == "__main__":
    capture_session()
