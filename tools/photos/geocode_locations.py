import json
import sys
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[2]
PHOTOS_JSON = PROJECT_ROOT / "data" / "photos.json"
LOCATIONS_JSON = PROJECT_ROOT / "data" / "photo-locations.json"
NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "KyuminPortfolioGeocoder/1.0 (+https://kyumin.kr)"


def load_json(path, fallback):
    if not path.exists():
        return fallback
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def geocode_location(location):
    query = urlencode({"q": location, "format": "jsonv2", "limit": 1})
    request = Request(
        f"{NOMINATIM_SEARCH_URL}?{query}",
        headers={"User-Agent": USER_AGENT, "Accept-Language": "en"},
    )

    with urlopen(request, timeout=15) as response:
        results = json.load(response)

    if not results:
        return None

    return [float(results[0]["lat"]), float(results[0]["lon"])]


def sync_photo_locations(photos):
    coordinates = load_json(LOCATIONS_JSON, {})
    locations = sorted({photo.get("location", "").strip() for photo in photos if photo.get("location")})
    missing_locations = [location for location in locations if location not in coordinates]

    for index, location in enumerate(missing_locations):
        if index:
            time.sleep(1)

        try:
            coords = geocode_location(location)
        except Exception as error:
            print(f"좌표 검색 실패: {location} ({error})")
            continue

        if coords is None:
            print(f"좌표를 찾지 못함: {location}")
            continue

        coordinates[location] = coords
        print(f"좌표 추가: {location} -> {coords[0]}, {coords[1]}")

    LOCATIONS_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(LOCATIONS_JSON, "w", encoding="utf-8") as file:
        json.dump(dict(sorted(coordinates.items())), file, indent=2, ensure_ascii=False)
        file.write("\n")

    print(f"위치 {len(coordinates)}개 저장: {LOCATIONS_JSON}")
    return coordinates


if __name__ == "__main__":
    try:
        photo_data = load_json(PHOTOS_JSON, [])
        sync_photo_locations(photo_data)
    except Exception as error:
        print(f"에러 발생: {error}")
        sys.exit(1)
