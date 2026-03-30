from sqlalchemy import create_engine, Column, String, DateTime, Text
from sqlalchemy.orm import declarative_base, Session
from datetime import datetime

Base = declarative_base()
engine = create_engine("sqlite:///./news.db", connect_args={"check_same_thread": False})

class Article(Base):
    __tablename__ = "articles"
    url = Column(String, primary_key=True)
    source = Column(String, index=True)
    title = Column(Text)
    date = Column(String)
    collected_at = Column(DateTime, default=datetime.now)

def init_db():
    Base.metadata.create_all(engine)

def save_articles(articles: list):
    with Session(engine) as session:
        new_count = 0
        for a in articles:
            if not session.get(Article, a["url"]):
                session.add(Article(**a))
                new_count += 1
        session.commit()
        return new_count

def get_articles(source: str = None, keyword: str = None, limit: int = 100):
    with Session(engine) as session:
        query = session.query(Article)
        if source:
            query = query.filter(Article.source == source)
        if keyword:
            query = query.filter(Article.title.contains(keyword))
        return query.order_by(Article.collected_at.desc()).limit(limit).all()

def get_stats():
    with Session(engine) as session:
        from sqlalchemy import func
        total = session.query(func.count(Article.url)).scalar()
        by_source = session.query(Article.source, func.count(Article.url))\
            .group_by(Article.source).all()
        return {"total": total, "by_source": dict(by_source)}
