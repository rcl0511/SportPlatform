"""
KBO 경기 일정 스크래퍼
KBO 공식 웹사이트에서 경기 일정을 가져옵니다.
"""
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import re

def scrape_kbo_schedule():
    """
    KBO 공식 웹사이트에서 경기 일정을 스크래핑합니다.
    """
    url = "https://www.koreabaseball.com/Schedule/Schedule.aspx"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            return {"error": f"HTTP {response.status_code}", "games": []}
        
        soup = BeautifulSoup(response.text, 'html.parser')
        games = []
        
        # 경기 일정 테이블 찾기
        # KBO 웹사이트 구조에 맞게 수정 필요
        schedule_table = soup.find('table', class_='schedule') or soup.find('table', id='schedule')
        
        if not schedule_table:
            # 다른 방법으로 테이블 찾기 시도
            tables = soup.find_all('table')
            for table in tables:
                if '경기' in str(table) or '일정' in str(table):
                    schedule_table = table
                    break
        
        if schedule_table:
            rows = schedule_table.find_all('tr')[1:]  # 헤더 제외
            
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) < 3:
                    continue
                
                try:
                    # 날짜 추출
                    date_cell = cells[0].get_text(strip=True)
                    # 시간 추출
                    time_cell = cells[1].get_text(strip=True) if len(cells) > 1 else ''
                    # 경기 정보 추출
                    game_cell = cells[2].get_text(strip=True) if len(cells) > 2 else ''
                    # 구장 추출
                    stadium_cell = cells[-1].get_text(strip=True) if len(cells) > 3 else ''
                    
                    # 날짜 파싱 (예: "01.27(월)")
                    date_match = re.search(r'(\d{2})\.(\d{2})', date_cell)
                    if date_match:
                        month = int(date_match.group(1))
                        day = int(date_match.group(2))
                        year = datetime.now().year
                        date_obj = datetime(year, month, day)
                        
                        # 경기 팀 추출 (예: "LG vs KIA")
                        teams_match = re.search(r'([가-힣A-Z\s]+)\s+vs\s+([가-힣A-Z\s]+)', game_cell)
                        home = teams_match.group(1).strip() if teams_match else ''
                        away = teams_match.group(2).strip() if teams_match else ''
                        
                        games.append({
                            "date": date_obj.strftime("%Y-%m-%d"),
                            "dateText": date_cell,
                            "time": time_cell,
                            "timeText": time_cell,
                            "play": game_cell,
                            "playText": game_cell,
                            "stadium": stadium_cell,
                            "home": home,
                            "away": away
                        })
                except Exception as e:
                    continue
        
        return {"games": games, "count": len(games)}
        
    except Exception as e:
        return {"error": str(e), "games": []}

if __name__ == "__main__":
    result = scrape_kbo_schedule()
    print(json.dumps(result, ensure_ascii=False, indent=2))
