import argparse
import os
import sys

from compress_images import compress_folder
from sync_cloudinary import sync_photos
from upload_to_cloudinary import load_upload_config, upload_folder, validate_cloudinary_config


IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png")


def count_images(folder_path):
    return sum(
        1
        for root, dirs, files in os.walk(folder_path)
        for filename in files
        if filename.lower().endswith(IMAGE_EXTENSIONS)
    )


def run_pipeline(config_path, target_size_mb=10):
    config_path = os.path.abspath(os.path.expanduser(config_path))
    validate_cloudinary_config()
    upload_config = load_upload_config(config_path)
    folder_path = os.path.abspath(os.path.expanduser(upload_config["upload_folder"]))

    if not os.path.isdir(folder_path):
        raise FileNotFoundError(f"사진 폴더를 찾을 수 없습니다: {folder_path}")

    image_count = count_images(folder_path)
    if image_count == 0:
        raise ValueError(f"업로드할 JPG 또는 PNG 이미지가 없습니다: {folder_path}")

    print("\n=== 사진 업로드 파이프라인 시작 ===")
    print(f"사진 폴더: {folder_path}")
    print(f"설정 파일: {config_path}")
    print(f"대상 이미지: {image_count}개")
    print(f"촬영 지역: {upload_config['city']}, {upload_config['country']}")

    print("\n[1/4] 큰 이미지 압축")
    compressed_count = compress_folder(folder_path, target_size_mb=target_size_mb)

    print("\n[2/4] Cloudinary 업로드")
    uploaded_count, failed_count = upload_folder(
        folder_path,
        city=upload_config["city"],
        country=upload_config["country"],
        tags=upload_config["tags"],
    )

    print("\n[3/4] data/photos.json 동기화")
    sync_succeeded = sync_photos()

    print("\n[4/4] 새 위치 좌표 확인")
    if sync_succeeded:
        print("사진 동기화 과정에서 새 위치 좌표까지 저장했습니다.")
    else:
        print("사진 데이터 동기화에 실패해 좌표 갱신을 완료하지 못했습니다.")

    print("\n=== 처리 결과 ===")
    print(f"검사한 이미지: {image_count}개")
    print(f"압축한 이미지: {compressed_count}개")
    print(f"업로드 성공: {uploaded_count}개")
    print(f"업로드 실패: {failed_count}개")
    print(f"데이터 동기화: {'성공' if sync_succeeded else '실패'}")

    return failed_count == 0 and sync_succeeded


def main():
    parser = argparse.ArgumentParser(
        description="사진 압축, Cloudinary 업로드, 데이터 및 지도 좌표 동기화를 한 번에 실행합니다."
    )
    parser.add_argument(
        "config",
        help="upload_folder, city, country, tags가 담긴 업로드 설정 JSON 경로",
    )
    parser.add_argument("--target-mb", type=int, default=10, help="압축 목표 크기(MB, 기본값: 10)")
    args = parser.parse_args()

    try:
        succeeded = run_pipeline(args.config, target_size_mb=args.target_mb)
    except (FileNotFoundError, ValueError) as error:
        print(f"Error: {error}")
        return 1
    except Exception as error:
        print(f"파이프라인 실행 중 오류가 발생했습니다: {error}")
        return 1

    return 0 if succeeded else 1


if __name__ == "__main__":
    sys.exit(main())
