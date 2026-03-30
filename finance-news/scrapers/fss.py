import requests
from bs4 import BeautifulSoup
import time

def scrape_fss():
    """금융감독원 보도자료 스크래핑"""
    url = "https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    articles = []
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "lxml")

        rows = soup.select("table tbody tr")
        for row in rows[:20]:
            try:
                a_tag = row.select_one("td.title a") or row.select_one("a")
                if not a_tag:
                    continue
                title = a_tag.get_text(strip=True)
                href = a_tag.get("href", "")
                if not href:
                    continue
                if not href.startswith("http"):
                    href = "https://www.fss.or.kr" + href

                tds = row.select("td")
                date = tds[-1].get_text(strip=True) if tds else ""

                if title:
                    articles.append({
                        "source": "금융감독원",
                        "title": title,
                        "url": href,
                        "date": date
                    })
            except Exception:
                continue
        time.sleep(1)
    except Exception as e:
        print(f"[금융감독원] 스크래핑 오류: {e}")
    return articles
