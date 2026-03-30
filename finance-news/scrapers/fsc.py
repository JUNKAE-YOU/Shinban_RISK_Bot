import requests
from bs4 import BeautifulSoup
import time

def scrape_fsc():
    """금융위원회 보도자료 스크래핑"""
    url = "https://www.fsc.go.kr/no010101"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    articles = []
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "lxml")

        rows = soup.select("table.board-list tbody tr")
        if not rows:
            rows = soup.select(".board_list tbody tr")
        if not rows:
            rows = soup.select("ul.board-list > li")

        for row in rows[:20]:
            try:
                a_tag = row.select_one("a")
                if not a_tag:
                    continue
                title = a_tag.get_text(strip=True)
                href = a_tag.get("href", "")
                if not href:
                    continue
                if not href.startswith("http"):
                    href = "https://www.fsc.go.kr" + href

                date_el = row.select_one(".date") or row.select_one("td:last-child")
                date = date_el.get_text(strip=True) if date_el else ""

                if title:
                    articles.append({
                        "source": "금융위원회",
                        "title": title,
                        "url": href,
                        "date": date
                    })
            except Exception:
                continue
        time.sleep(1)
    except Exception as e:
        print(f"[금융위원회] 스크래핑 오류: {e}")
    return articles
