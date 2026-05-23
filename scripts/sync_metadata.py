import os
import requests
import json
import argparse

# Configuration for Microsoft Graph (Personal account flow)
# Note: In a real scenario, these would come from env vars or CCMP database
CLIENT_ID = "YOUR_CLIENT_ID"
CLIENT_SECRET = "YOUR_CLIENT_SECRET"
REFRESH_TOKEN = "YOUR_REFRESH_TOKEN"

def get_access_token():
    url = f"https://login.microsoftonline.com/common/oauth2/v2.0/token"
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
        "grant_type": "refresh_token",
        "scope": "https://graph.microsoft.com/Files.ReadWrite.All offline_access"
    }
    response = requests.post(url, data=data)
    response.raise_for_status()
    return response.json()["access_token"]

def list_onedrive_folders(token, parent_id="root"):
    url = f"https://graph.microsoft.com/v1.0/me/drive/items/{parent_id}/children"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()["value"]

def sync_to_ccmp(token):
    print("🚀 Starting CCMP Metadata Sync...")
    items = list_onedrive_folders(token)
    
    inventory = []
    for item in items:
        if "folder" in item:
            print(f"📁 Found Folder: {item['name']} (ID: {item['id']})")
            inventory.append({
                "name": item['name'],
                "id": item['id'],
                "path": f"/{item['name']}"
            })
            
    # Here we would normally call the CCMP API to register these folders
    # For now, we'll save them to a localized mapping file for the user
    with open("onedrive_inventory.json", "w") as f:
        json.dump(inventory, f, indent=4)
    
    print(f"\n✅ Sync complete. {len(inventory)} root folders indexed in 'onedrive_inventory.json'.")
    print("Next step: Use the CCMP Admin Portal to assign these folders to specific clients.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CCMP OneDrive Sync Tool")
    parser.add_argument("--sync", action="store_true", help="Scan OneDrive and generate inventory")
    args = parser.parse_args()

    if args.sync:
        try:
            token = get_access_token()
            sync_to_ccmp(token)
        except Exception as e:
            print(f"❌ Error: {e}")
            print("\nHint: Make sure you've configured your CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN in the script.")
    else:
        parser.print_help()
