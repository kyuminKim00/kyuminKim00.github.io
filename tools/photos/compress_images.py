import argparse
import json
import os
import sys
from PIL import Image

def compress_image(file_path, target_size_mb=10):
    """
    이미지 파일 크기가 target_size_mb를 초과하면 해상도를 최대한 유지하며 압축합니다.
    """
    target_bytes = target_size_mb * 1024 * 1024
    file_size = os.path.getsize(file_path)
    
    if file_size <= target_bytes:
        return False # 압축 필요 없음
    
    print(f"--- 대상 파일: {file_path} ({file_size / (1024*1024):.2f} MB)")
    
    img = Image.open(file_path)
    original_format = img.format
    ext = os.path.splitext(file_path)[1].lower()
    
    # EXIF 정보 유지 (회전 등 방지)
    exif = img.info.get('exif')
    
    # 1단계: 품질(Quality) 조절 (JPEG의 경우)
    if ext in ['.jpg', '.jpeg']:
        quality = 95
        while quality > 40:
            img.save(file_path, format='JPEG', optimize=True, quality=quality, exif=exif)
            current_size = os.path.getsize(file_path)
            if current_size <= target_bytes:
                print(f"    결과: 품질 {quality}에서 {current_size / (1024*1024):.2f} MB로 압축 성공")
                return True
            quality -= 5
    
    # 2단계: 해상도(Resolution) 조절 (품질 조절로 부족하거나 PNG인 경우)
    width, height = img.size
    scale = 0.95
    while scale > 0.1:
        new_size = (int(width * scale), int(height * scale))
        # LANCZOS 필터를 사용하여 고품질 리사이징
        resized_img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        save_params = {'optimize': True}
        if ext in ['.jpg', '.jpeg']:
            save_params['quality'] = 85
            save_params['exif'] = exif
            resized_img.save(file_path, format='JPEG', **save_params)
        else:
            # PNG는 무손실 압축이므로 크기를 줄이는 것이 주 효과적
            resized_img.save(file_path, format='PNG', **save_params)
            
        current_size = os.path.getsize(file_path)
        if current_size <= target_bytes:
            print(f"    결과: 해상도 {new_size} ({int(scale*100)}%)에서 {current_size / (1024*1024):.2f} MB로 압축 성공")
            return True
        scale -= 0.05
        
    return True

def main():
    parser = argparse.ArgumentParser(description="Compress photos in the upload config folder.")
    parser.add_argument("config", help="업로드 설정 JSON 파일 경로")
    parser.add_argument("--target-mb", type=int, default=10, help="압축 목표 크기(MB)")
    args = parser.parse_args()

    # Pillow 라이브러리 체크
    try:
        from PIL import Image
    except ImportError:
        print("Error: 'Pillow' 라이브러리가 필요합니다. 'pip install Pillow' 명령어로 설치해주세요.")
        return

    try:
        with open(args.config, "r", encoding="utf-8") as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"Error: 업로드 config 파일을 찾을 수 없습니다: {args.config}")
        return
    except json.JSONDecodeError as e:
        print(f"Error: 업로드 config JSON 형식이 올바르지 않습니다: {e}")
        return

    base_path = config.get("upload_folder")
    if not base_path:
        print("Error: 업로드 config에 upload_folder 값이 없습니다.")
        return
    
    if not os.path.exists(base_path):
        print(f"Error: 폴더를 찾을 수 없습니다: {base_path}")
        return

    # 이미지 확장자 탐색
    image_extensions = ('.jpg', '.jpeg', '.png')
    count = 0
    
    print(f"'{base_path}' 폴더의 이미지 검사 및 압축을 시작합니다 (기준: {args.target_mb}MB)...")
    
    for root, dirs, files in os.walk(base_path):
        # 가상환경이나 노드 모듈 제외 (성능 및 안전)
        if any(ignored in root for ignored in ['node_modules', '.git', 'venv']):
            continue
            
        for file in files:
            if file.lower().endswith(image_extensions):
                full_path = os.path.join(root, file)
                try:
                    if compress_image(full_path, target_size_mb=args.target_mb):
                        count += 1
                except Exception as e:
                    print(f"Error processing {full_path}: {e}")
    
    if count == 0:
        print("압축이 필요한(10MB 초과) 파일이 발견되지 않았습니다.")
    else:
        print(f"\n총 {count}개의 이미지를 압축했습니다.")

if __name__ == "__main__":
    main()
