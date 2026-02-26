from playwright.sync_api import sync_playwright
import sys


def open_podcast_page(podcast_url):
    """
    Opens the podcast page in a browser so you can manually click play and copy the manifest URL.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        def log_response(response):
            if "caption_captionAsset" in response.url:
                try:
                    body = response.body()
                    print(body.decode('utf-8'))
                except Exception as e:
                    print(f"Error reading response: {e}")
        
        page.on("response", log_response)
        
        print(f"Opening: {podcast_url}")
        print("\nInstructions:")
        print("1. Click the play button")
        print("2. Copy the URL from the new tab that opens")
        print("3. Press Ctrl+C here when done")
        print("\nAll network requests will be logged below:")
        
        page.goto(podcast_url)
        
        try:
            page.wait_for_timeout(300000)  # Wait 5 minutes or until interrupted
        except KeyboardInterrupt:
            pass
        
        browser.close()


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_url.py <podcast_url>")
        print("Example: python extract_url.py https://podcast.ucsd.edu/watch/fa25/cse150b_a00/11")
        sys.exit(1)
    
    podcast_url = sys.argv[1]
    open_podcast_page(podcast_url)


if __name__ == "__main__":
    main()
