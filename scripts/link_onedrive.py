import requests
import urllib.parse
import webbrowser

# Constants
REDIRECT_URI = "http://localhost:8080/"
AUTH_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize"
TOKEN_URL = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token"
SCOPES = "offline_access https://graph.microsoft.com/Files.ReadWrite.All"

def main():
    print("=== CCMP OneDrive Account Linker (Manual Mode) ===\n")
    client_id = input("1. Enter your Application (Client) ID: ").strip()
    client_secret = input("2. Enter your Client Secret value: ").strip()
    
    if not client_id or not client_secret:
        print("Error: Client ID and Secret are required.")
        return

    params = {
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
    }
    
    url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"
    
    print("\n3. Opening your browser for authentication...")
    webbrowser.open(url)
    print(f"\nIf the browser didn't open, copy and paste this URL:\n{url}")
    
    print("\n4. Log in. After logging in, the browser will try to go to localhost:8080 and probably show an error.")
    print("   This is expected!")
    
    redirected_url = input("\n5. Copy the ENTIRE URL from your browser's address bar and paste it here: ").strip()
    
    try:
        if 'code=' in redirected_url:
            query = urllib.parse.urlparse(redirected_url).query
            params = urllib.parse.parse_qs(query)
            code = params['code'][0]
        else:
            code = redirected_url # In case they only pasted the code

        print("\n6. Trading code for tokens...")
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        }
        
        response = requests.post(TOKEN_URL, data=data)
        if response.ok:
            tokens = response.json()
            refresh_token = tokens.get("refresh_token")
            print("\n" + "="*50)
            print("SUCCESS! Your REFRESH_TOKEN is below:")
            print("="*50)
            print(f"\n{refresh_token}\n")
            print("="*50)
            print("Copy this token and paste it into your Vercel Environment Variables.")
        else:
            print(f"\nError trading code: {response.text}")
    except Exception as e:
        print(f"\nError parsing URL: {e}")

if __name__ == "__main__":
    main()
