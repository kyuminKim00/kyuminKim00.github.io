import argparse
import json
import os
import sys
from PIL import Image
from PIL.ExifTags import TAGS
import cloudinary
import cloudinary.uploader
from cloudinary_config import CLOUDINARY_CONFIG


def parse_tags(raw_tags, city, country):
    if isinstance(raw_tags, str):
        tags = [tag.strip() for tag in raw_tags.split(",") if tag.strip()]
    else:
        tags = [str(tag).strip() for tag in raw_tags if str(tag).strip()]

    for tag in (city, country):
        if tag and tag not in tags:
            tags.append(tag)
    return tags or ["landscape"]


def load_upload_config(config_path):
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"Error: 업로드 config 파일을 찾을 수 없습니다: {config_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: 업로드 config JSON 형식이 올바르지 않습니다: {e}")
        sys.exit(1)

    required_fields = ("upload_folder", "city", "country")
    missing_fields = [field for field in required_fields if not config.get(field)]
    if missing_fields:
        print(f"Error: 업로드 config에 필수 값이 없습니다: {', '.join(missing_fields)}")
        sys.exit(1)

    return {
        "upload_folder": config["upload_folder"],
        "city": config["city"],
        "country": config["country"],
        "tags": parse_tags(config.get("tags", ["landscape"]), config["city"], config["country"]),
    }


def get_exif_data(image_path, location):
    """
    이미지에서 카메라 기종, 촬영 날짜 등 EXIF 메타데이터를 추출합니다.
    """
    try:
        img = Image.open(image_path)
        exif = img._getexif()
        if not exif:
            return {}

        exif_data = {}
        for tag, value in exif.items():
            decoded = TAGS.get(tag, tag)
            exif_data[decoded] = value
        
        metadata = {
            "camera": exif_data.get("Model", "Unknown"),
            "shotAt": "",
            "location": location
        }

        # 날짜 추출 시도: 1. DateTimeOriginal (준수), 2. DateTimeDigitized, 3. DateTime
        raw_date = exif_data.get("DateTimeOriginal") or exif_data.get("DateTimeDigitized") or exif_data.get("DateTime")
        
        if raw_date and len(raw_date) >= 10:
            # EXIF 날짜 포맷은 "YYYY:MM:DD HH:MM:SS" -> "YYYY-MM-DD"로 변환
            metadata["shotAt"] = raw_date[:10].replace(":", "-")
        else:
            # EXIF 날짜가 없을 경우 파일 수정 날짜라도 가져옴
            import datetime
            mtime = os.path.getmtime(image_path)
            metadata["shotAt"] = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d')
            print(f"  [!] EXIF 날짜 없음 - 파일 수정일 사용: {metadata['shotAt']}")

        print(f"  추출된 메타데이터: {metadata['camera']} | {metadata['shotAt']}")
        return metadata
    except Exception as e:
        print(f"  EXIF 추출 에러 ({os.path.basename(image_path)}): {e}")
        return {}

def upload_folder(folder_path, city, country, tags):
    print(f"'{folder_path}' 폴더의 사진을 Cloudinary로 업로드 시작합니다...")
    print(f"위치: {city}, {country}")
    print(f"태그: {', '.join(tags)}")
    
    cloudinary.config(**CLOUDINARY_CONFIG)
    
    image_extensions = ('.jpg', '.jpeg', '.png')
    uploaded_count = 0

    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.lower().endswith(image_extensions):
                file_path = os.path.join(root, file)
                print(f"\n--- 업로드 중: {file} ---")
                
                # 1. 메타데이터 추출
                metadata = get_exif_data(file_path, f"{city}, {country}")
                
                # 2. Cloudinary 업로드
                try:
                    # public_id는 파일명으로 설정 (확장자 제외)
                    public_id = os.path.splitext(file)[0]
                    
                    response = cloudinary.uploader.upload(
                        file_path,
                        public_id=public_id,
                        # context에 메타데이터 저장 (나중에 sync 스크립트에서 읽을 수 있음)
                        context={
                            "camera": metadata.get("camera", "Unknown"),
                            "location": metadata.get("location", f"{city}, {country}"),
                            "shotAt": metadata.get("shotAt", "")
                        },
                        # 기본 태그 설정
                        tags=tags
                    )
                    
                    print(f"  성공: {response['secure_url']}")
                    uploaded_count += 1
                    
                except Exception as e:
                    print(f"  업로드 에러 ({file}): {e}")

    print(f"\n총 {uploaded_count}개의 파일을 업로드했습니다.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload local photos to Cloudinary with shared metadata.")
    parser.add_argument("config", help="업로드 설정 JSON 파일 경로")
    args = parser.parse_args()

    # 라이브러리 체크
    try:
        from PIL import Image
        import cloudinary
    except ImportError:
        print("Error: 'Pillow'와 'cloudinary' 라이브러리가 필요합니다.")
        print("명령어: pip install Pillow cloudinary")
        sys.exit(1)

    upload_config = load_upload_config(args.config)
    upload_folder_path = upload_config["upload_folder"]

    if os.path.exists(upload_folder_path):
        upload_folder(
            upload_folder_path,
            city=upload_config["city"],
            country=upload_config["country"],
            tags=upload_config["tags"],
        )
    else:
        print(f"Error: 폴더를 찾을 수 없습니다: {upload_folder_path}")
