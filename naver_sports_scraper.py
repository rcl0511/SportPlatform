"""
네이버 스포츠 야구 기사 스크래퍼
매일 5개씩 최신 기사를 가져와서 요약합니다.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re
import json

router = APIRouter()

@router.get("/naver-baseball-articles")
async def get_naver_baseball_articles():
    """
    네이버 스포츠 야구 기사 페이지에서 최신 기사 5개를 가져와서 요약합니다.
    """
    url = "https://m.sports.naver.com/kbaseball/index"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="네이버 스포츠 접근 실패")
        
        soup = BeautifulSoup(response.text, 'html.parser')
        articles = []
        
        # 네이버 스포츠 모바일 페이지 구조에 맞게 기사 추출
        # 실제 구조에 따라 수정 필요
        news_items = soup.find_all('a', class_=re.compile('news|article|item', re.I)) or \
                     soup.find_all('div', class_=re.compile('news|article', re.I))
        
        for item in news_items[:10]:  # 더 많이 가져와서 필터링
            try:
                # 제목 추출
                title_elem = item.find(['h3', 'h4', 'span', 'div'], class_=re.compile('title|headline', re.I))
                title = title_elem.get_text(strip=True) if title_elem else ''
                
                # 링크 추출
                link_elem = item if item.name == 'a' else item.find('a')
                href = link_elem.get('href', '') if link_elem else ''
                if href and not href.startswith('http'):
                    href = f"https://m.sports.naver.com{href}" if href.startswith('/') else f"https://m.sports.naver.com/{href}"
                
                # 이미지 추출
                img_elem = item.find('img')
                image = img_elem.get('src', '') if img_elem else ''
                if image and not image.startswith('http'):
                    image = f"https:{image}" if image.startswith('//') else f"https://m.sports.naver.com{image}"
                
                # 날짜/시간 추출
                date_elem = item.find(['span', 'div', 'time'], class_=re.compile('date|time|ago', re.I))
                date_text = date_elem.get_text(strip=True) if date_elem else ''
                
                if title and len(title) > 10:  # 유효한 제목만
                    articles.append({
                        "title": title,
                        "link": href,
                        "image": image,
                        "date": date_text,
                        "source": "네이버 스포츠",
                    })
            except Exception:
                continue
        
        # 중복 제거 및 5개로 제한
        seen_titles = set()
        unique_articles = []
        for article in articles:
            if article['title'] not in seen_titles and len(unique_articles) < 5:
                seen_titles.add(article['title'])
                unique_articles.append(article)
        
        return JSONResponse(content={
            "success": True,
            "articles": unique_articles,
            "count": len(unique_articles),
            "date": datetime.now().strftime("%Y-%m-%d")
        })
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"네트워크 오류: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스크래핑 오류: {str(e)}")

# main.py에 추가:
# from app.api import naver_sports
# app.include_router(naver_sports.router, prefix="/api")
