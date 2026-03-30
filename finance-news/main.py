from fastapi import FastAPI, Request, Query
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
import logging

from database import init_db, save_articles, get_articles, get_stats
from scrapers.fsc import scrape_fsc
from scrapers.fss import scrape_fss
from scrapers.bok import scrape_bok

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def collect_all():
    logger.info("보도자료 수집 시작...")
    try:
        articles = scrape_fsc() + scrape_fss() + scrape_bok()
        new_count = save_articles(articles)
        logger.info(f"수집 완료: 총 {len(articles)}건 중 신규 {new_count}건 저장")
    except Exception as e:
        logger.error(f"수집 오류: {e}")

scheduler = BackgroundScheduler(timezone="Asia/Seoul")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    collect_all()
    scheduler.add_job(collect_all, "cron", hour="9,15", minute=0)
    scheduler.start()
    logger.info("스케줄러 시작 (매일 09:00, 15:00 수집)")
    yield
    scheduler.shutdown()

app = FastAPI(title="금융 보도자료 모니터", lifespan=lifespan)
templates = Jinja2Templates(directory="templates")

@app.get("/")
def index(
    request: Request,
    source: str = Query(default=None),
    keyword: str = Query(default=None)
):
    articles = get_articles(source=source, keyword=keyword)
    stats = get_stats()
    return templates.TemplateResponse("index.html", {
        "request": request,
        "articles": articles,
        "stats": stats,
        "source": source or "",
        "keyword": keyword or "",
    })

@app.get("/api/articles")
def api_articles(source: str = None, keyword: str = None):
    articles = get_articles(source=source, keyword=keyword)
    return JSONResponse([{
        "source": a.source,
        "title": a.title,
        "url": a.url,
        "date": a.date,
        "collected_at": str(a.collected_at)
    } for a in articles])

@app.post("/api/collect")
def manual_collect():
    collect_all()
    stats = get_stats()
    return {"message": "수집 완료", "stats": stats}

@app.get("/api/stats")
def api_stats():
    return get_stats()
