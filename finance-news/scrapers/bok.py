import feedparser
import time

def scrape_bok():
    """한국은행 보도자료 RSS 수집"""
    rss_url = "https://www.bok.or.kr/portal/bbs/B0000338/rss.do"
    articles = []
    try:
        feed = feedparser.parse(rss_url)
        for entry in feed.entries[:20]:
            try:
                title = entry.get("title", "").strip()
                link = entry.get("link", "").strip()
                date = entry.get("published", "")[:10] if entry.get("published") else ""
                if title and link:
                    articles.append({
                        "source": "한국은행",
                        "title": title,
                        "url": link,
                        "date": date
                    })
            except Exception:
                continue
        time.sleep(1)
    except Exception as e:
        print(f"[한국은행] 스크래핑 오류: {e}")
    return articles
