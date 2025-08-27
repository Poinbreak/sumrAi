import requests
from bs4 import BeautifulSoup
import json

def google_search(query, api_key):
    params = {
        "q": query,
        "api_key": api_key,
        "engine": "google"
    }
    response = requests.get("https://serpapi.com/search", params=params)
    results = response.json()
    links = [result['link'] for result in results.get('organic_results', [])]
    return links

def scrape_snippets(url):
    try:
        page = requests.get(url, timeout=5)
        soup = BeautifulSoup(page.text, 'html.parser')
        paragraphs = [p.get_text() for p in soup.find_all('p')]
        return paragraphs
    except Exception:
        return []

def main():
    query = input("Enter your question: ")
    api_key = "f172e68c122c37425478e2cf354a1cdd02c4a288be928f9496b7b30d627c4ed3"  # Replace with your SerpAPI key
    links = google_search(query, api_key)
    all_snippets = {}
    for url in links:
        snippets = scrape_snippets(url)
        all_snippets[url] = snippets
    with open("snippets.json", "w", encoding="utf-8") as f:
        json.dump(all_snippets, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()