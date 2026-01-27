"""
백엔드에 추가할 KBO 경기 일정 API 엔드포인트
FastAPI 라우터에 추가하세요.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re
import json

router = APIRouter()

@router.get("/kbo-schedule")
async def get_kbo_schedule():
    """
    KBO 공식 웹사이트에서 경기 일정을 스크래핑하여 반환합니다.
    """
    url = "https://www.koreabaseball.com/Schedule/Schedule.aspx"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="KBO 웹사이트 접근 실패")
        
        soup = BeautifulSoup(response.text, 'html.parser')
        games = []
        
        # KBO 웹사이트의 경기 일정 테이블 찾기
        # 실제 웹사이트 구조에 맞게 수정 필요
        schedule_table = soup.find('table', {'id': 'scheduleTable'}) or \
                        soup.find('table', class_=re.compile('schedule', re.I)) or \
                        soup.find('table')
        
        if schedule_table:
            rows = schedule_table.find_all('tr')
            
            for row in rows[1:]:  # 헤더 제외
                cells = row.find_all(['td', 'th'])
                if len(cells) < 2:
                    continue
                
                try:
                    # 각 셀에서 데이터 추출
                    date_text = cells[0].get_text(strip=True) if len(cells) > 0 else ''
                    time_text = cells[1].get_text(strip=True) if len(cells) > 1 else ''
                    game_text = cells[2].get_text(strip=True) if len(cells) > 2 else ''
                    stadium_text = cells[-1].get_text(strip=True) if len(cells) > 3 else ''
                    
                    # 날짜 파싱 (예: "01.27(월)" 또는 "2025.01.27")
                    date_match = re.search(r'(\d{2,4})\.(\d{2})\.?(\d{2})?', date_text)
                    if date_match:
                        if date_match.group(3):  # YYYY.MM.DD 형식
                            year = int(date_match.group(1))
                            month = int(date_match.group(2))
                            day = int(date_match.group(3))
                        else:  # MM.DD 형식
                            year = datetime.now().year
                            month = int(date_match.group(1))
                            day = int(date_match.group(2))
                        
                        try:
                            date_obj = datetime(year, month, day)
                            
                            # 경기 팀 추출
                            teams_match = re.search(r'([가-힣A-Z\s]+)\s*(?:vs|VS|대)\s*([가-힣A-Z\s]+)', game_text)
                            home = teams_match.group(1).strip() if teams_match else ''
                            away = teams_match.group(2).strip() if teams_match else ''
                            
                            games.append({
                                "date": date_obj.strftime("%Y-%m-%d"),
                                "dateText": date_text,
                                "time": time_text,
                                "timeText": time_text,
                                "play": game_text,
                                "playText": game_text,
                                "stadium": stadium_text,
                                "home": home,
                                "away": away
                            })
                        except ValueError:
                            continue
                except Exception:
                    continue
        
        return JSONResponse(content={
            "success": True,
            "games": games,
            "count": len(games)
        })
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"네트워크 오류: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스크래핑 오류: {str(e)}")

# main.py에 추가:
# from app.api import kbo_schedule
# app.include_router(kbo_schedule.router, prefix="/api")
