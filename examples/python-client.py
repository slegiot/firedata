import requests
import json
from datetime import datetime

API_KEY = "fd_live_YOUR_API_KEY_HERE"
BASE_URL = "http://localhost:3000/v1"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

def print_response(title: str, response: requests.Response):
    print(f"\n=== {title} ===")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error {response.status_code}: {response.text}")

def main():
    # 1. Fetch latest price for an asset (e.g. Bitcoin)
    print("Fetching latest price for Bitcoin...")
    res = requests.get(f"{BASE_URL}/finance/prices/latest", params={"symbol": "BTC-USD"}, headers=headers)
    print_response("Latest BTC Price", res)

    # 2. Fetch latest news for 'bitcoin'
    print("\nFetching latest news for Bitcoin...")
    # Note: Our news endpoint categorizes by 'finance' or 'crypto', but we'll fetch crypto news
    res = requests.get(f"{BASE_URL}/news", params={"category": "crypto", "limit": 3}, headers=headers)
    print_response("Latest Crypto News", res)

    # 3. List upcoming soccer games 
    print("\nFetching upcoming soccer games...")
    res = requests.get(f"{BASE_URL}/sports/games", params={"sport_key": "soccer", "status": "upcoming", "limit": 5}, headers=headers)
    
    if res.status_code == 200:
        data = res.json().get("data", [])
        print_response("Upcoming Soccer Games", res)
        
        # 4. Get odds for the first game found
        if data:
            game_id = data[0]["id"]
            print(f"\nFetching odds for game: {game_id}")
            odds_res = requests.get(f"{BASE_URL}/odds/games/{game_id}", params={"market": "1x2"}, headers=headers)
            print_response("Game Odds", odds_res)
        else:
            print("No upcoming games found to check odds for.")

if __name__ == "__main__":
    main()
