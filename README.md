## 포트폴리오 웹사이트

이 폴더는 깃허브 페이지(GitHub Pages)로 배포할 수 있는 **정적 포트폴리오 사이트**입니다.

- **About**: 기본 신상 정보 및 소개
- **Work**: Publication / Patent / Project 등을 카드 형태로 정리
- **Photo**: Cloudinary에 업로드한 고해상도 사진을 갤러리로 표시

빌드 도구 없이 **그냥 HTML/CSS/JS만으로 동작**하며, `index.html` 파일을 그대로 GitHub Pages에 올리면 됩니다.

---

## 폴더 구조

- `index.html`  
  메인 포트폴리오 페이지입니다.

- `styles.css`  
  전체 사이트의 스타일(레이아웃, 반응형, 다크 느낌 등)을 담당합니다.

- `main.js`  
  네비게이션, 섹션 전환, 갤러리 모달 등 인터랙션을 담당합니다.

- `data/work.json`  
  Publication / Patent / Project 데이터를 정의하는 JSON 파일입니다.

- `data/photos.json`  
  Cloudinary 이미지 정보를 정의하는 JSON 파일입니다.

---

## Work 데이터 넣는 방법

`data/work.json` 파일을 열어서 본인 정보에 맞게 수정하면 됩니다.

```json
[
  {
    "type": "publication",
    "title": "논문 제목 예시",
    "summary": "간단한 설명",
    "year": "2024",
    "link": "https://example.com",
    "tags": ["AI", "CV"]
  },
  {
    "type": "project",
    "title": "프로젝트 이름 예시",
    "summary": "무엇을 했는지 한두 줄로 정리",
    "year": "2023",
    "link": "https://github.com/...",
    "tags": ["웹", "포트폴리오"]
  }
]
```

- **`type`**: `"publication" | "patent" | "project"` 중 하나  
- **`title`**: 제목
- **`summary`**: 간단 설명
- **`year`**: 연도 (문자열로 적어두면 정렬/필터에 편합니다)
- **`link`**: 상세 페이지(논문 링크, GitHub, 특허 검색 링크 등)
- **`tags`**: 해시태그처럼 보이는 키워드 배열

---

## Cloudinary 사진 연동 방법

1. Cloudinary에 이미지를 업로드합니다.
2. Cloudinary 대시보드에서 각 이미지의 URL을 복사합니다.  
   예)  
   `https://res.cloudinary.com/<cloud_name>/image/upload/c_fill,w_700,h_500,q_auto,f_auto/v1700000000/portfolio/sample1.jpg`
3. `data/photos.json` 파일에 아래 예시처럼 항목을 추가합니다.

```json
[
  {
    "title": "도시의 야경",
    "url": "https://res.cloudinary.com/<cloud_name>/image/upload/c_fill,w_700,h_500,q_auto,f_auto/v1700000000/portfolio/sample1.jpg",
    "fullUrl": "https://res.cloudinary.com/<cloud_name>/image/upload/q_auto,f_auto/v1700000000/portfolio/sample1.jpg",
    "location": "Seoul, Korea",
    "shotAt": "2024-10-01",
    "camera": "Sony A7 IV",
    "tags": ["night", "city", "long exposure"]
  }
]
```

- **`url`**: 썸네일(리스트용) URL – 보통 Cloudinary 변환 옵션(`c_fill,w_700,h_500,q_auto,f_auto` 등)을 붙입니다.
- **`fullUrl`**: 모달에서 크게 볼 때 사용할 원본 혹은 고해상도 URL입니다.
- **기타 필드**(`location`, `shotAt`, `camera`, `tags`)는 원하는 대로 변경/추가할 수 있습니다.

---

## 로컬에서 미리보기

GitHub Pages에 올리기 전에, 브라우저에서 열어보면 CORS 제약 때문에 JSON `fetch`가 제대로 안 될 수 있습니다.  
그럴 때는 간단히 **로컬 서버**를 띄워서 확인하면 됩니다.

1. Node.js가 설치되어 있다면:

   ```bash
   npx serve .
   ```

2. 또는 VS Code / Cursor의 간단한 Live Server 확장을 사용해도 됩니다.

---

## GitHub Pages에 배포하기

1. 이 `Portfolio` 폴더의 내용을 GitHub 리포지토리에 올립니다.
2. GitHub 리포지토리 설정(⚙ Settings) → **Pages** 메뉴로 이동합니다.
3. **Source**에서
   - `Deploy from a branch`
   - 브랜치: `main` (또는 `master`)
   - 폴더: `/root`
   로 설정합니다.
4. 저장하면 잠시 후 `https://<github-username>.github.io/<repository-name>/` 주소로 접속할 수 있습니다.

---

## 커스터마이징 포인트

- `index.html`  
  - 이름, 직함, 소개 문구, SNS/GitHub/LinkedIn 링크
  - 섹션 순서(About / Work / Photo) 조정

- `styles.css`  
  - 전체 컬러 팔레트, 폰트, 카드 디자인, 다크/라이트 느낌

- `data/work.json`, `data/photos.json`  
  - 실제 Publication / Patent / Project / 사진 데이터 입력

필요하다면 About 섹션에 CV 다운로드 버튼, Contact 섹션(이메일/폼) 등을 손쉽게 추가할 수 있도록 구조를 짜 두었습니다.

