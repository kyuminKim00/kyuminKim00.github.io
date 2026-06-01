import cloudinary
import cloudinary.api
import json
import os
import sys
from pathlib import Path
from cloudinary_config import CLOUDINARY_CONFIG

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PHOTOS_JSON = PROJECT_ROOT / "data" / "photos.json"

def sync_photos():
    if CLOUDINARY_CONFIG["api_key"] == "YOUR_API_KEY":
        print("Error: cloudinary_config.py 파일을 열어 CLOUDINARY_CONFIG에 본인의 API Key와 Secret을 입력해주세요.")
        return

    try:
        cloudinary.config(**CLOUDINARY_CONFIG)
        
        print("Cloudinary에서 모든 이미지 에셋을 가져오는 중...")
        
        # 모든 리소스를 가져옵니다 (기본적으로 최근 업로드 순)
        # 만약 특정 폴더만 가져오고 싶다면 prefix="folder_name/" 옵션을 추가할 수 있습니다.
        resources = cloudinary.api.resources(
            type="upload", 
            max_results=500,
            context=True, # 촬영 장소 등 부가 정보를 썼을 경우 가져옴
            tags=True     # 태그 정보 가져옴
        )["resources"]
        
        photo_list = []
        for res in resources:
            # Cloudinary Metadata나 Context가 있다면 활용, 없으면 기본값
            context = res.get("context", {}).get("custom", {})
            
            shot_at = context.get("shotAt") if context.get("shotAt") else res["created_at"][:10]
            
            # 날짜 형식 정규화 (YY-MM-DD -> 20YY-MM-DD)
            # 촬영일 입력이 22-01-17 등으로 짧게 들어온 경우를 대비하여 20xx년으로 보정합니다.
            if shot_at and len(shot_at) == 8 and shot_at[2] == '-' and shot_at[5] == '-':
                shot_at = "20" + shot_at
                
            photo_info = {
                "url": res["secure_url"],
                "location": context.get("location", "Seoul, Korea"),
                "shotAt": shot_at,
                "camera": context.get("camera", "Unknown"),
                "tags": res.get("tags", ["all"])
            }
            photo_list.append(photo_info)
        
        # 날짜(shotAt) 기준 내림차순 정렬 (최신순)
        photo_list.sort(key=lambda x: x.get('shotAt', ''), reverse=True)
        
        # data 폴더가 없으면 생성
        os.makedirs(PHOTOS_JSON.parent, exist_ok=True)
        
        # data/photos.json 파일 업데이트
        with open(PHOTOS_JSON, 'w', encoding='utf-8') as f:
            json.dump(photo_list, f, indent=2, ensure_ascii=False)
        
        print(f"\n--- 동기화 완료! ---")
        print(f"대상 계정: {CLOUDINARY_CONFIG['cloud_name']}")
        print(f"업데이트된 사진 수: {len(photo_list)}개")
        print(f"결과 파일: {PHOTOS_JSON}")

    except Exception as e:
        print(f"에러 발생: {e}")

if __name__ == "__main__":
    # 필요한 라이브러리 체크
    try:
        import cloudinary
    except ImportError:
        print("Error: 'cloudinary' 라이브러리가 필요합니다.")
        print("명령어: pip install cloudinary")
        sys.exit(1)
        
    sync_photos()
