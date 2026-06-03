// 간단한 유틸
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

// 네비게이션 토글 (모바일)
const navToggle = document.querySelector(".nav-toggle");
const navList = document.querySelector(".nav-list");

if (navToggle && navList) {
  navToggle.addEventListener("click", () => {
    navList.classList.toggle("is-open");
  });

  navList.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      navList.classList.remove("is-open");
    }
  });
}

// 푸터 연도 표시
const footerYearEl = $("#footer-year");
if (footerYearEl) {
  footerYearEl.textContent = new Date().getFullYear();
}

// Work 섹션: 데이터 로딩 및 필터링
const workListEl = $("#work-list");
const workFilterButtons = $$(".work-filters .chip");
let allWorks = [];

async function loadWorkData() {
  try {
    const res = await fetch("data/work.json");
    if (!res.ok) throw new Error("Failed to load work.json");
    const data = await res.json();
    allWorks = data;
    renderWorkCards();
  } catch (err) {
    console.error(err);
    if (workListEl) {
      workListEl.innerHTML =
        '<p style="color:#9ca3af;font-size:14px;">Work 데이터를 불러오지 못했습니다. 브라우저에서 직접 여는 경우(파일 경로로 열기) 대신, 간단한 로컬 서버에서 확인해 주세요.</p>';
    }
  }
}

let currentType = "all";

function renderWorkCards() {
  if (!workListEl) return;

  // 필터링 로직: 타입 기준
  let items = allWorks;
  if (currentType !== "all") {
    items = items.filter((item) => item.type === currentType);
  }

  if (!items.length) {
    workListEl.innerHTML =
      '<p style="color:#9ca3af;font-size:14px;">해당 조건의 항목이 없습니다.</p>';
    return;
  }

  const groupedByYear = items.reduce((groups, item) => {
    const year = item.year || "Other";
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(item);
    return groups;
  }, new Map());

  workListEl.innerHTML = Array.from(groupedByYear.entries())
    .map(([year, groupItems]) => {
      const works = groupItems
        .map((item) => {
          const thumbnailImage = item.thumbnail
            ? `<img src="${item.thumbnail}" alt="${item.title}" loading="lazy">`
            : "";
          const thumbnailPart = thumbnailImage
            ? `<div class="work-thumbnail">${item.link ? `<a href="${item.link}" target="_blank" rel="noreferrer">${thumbnailImage}</a>` : thumbnailImage}</div>`
            : "";

          const authorsPart = item.authors
            ? `<div class="work-authors">${item.authors.replace("Kyumin Kim", "<strong>Kyumin Kim</strong>")}</div>`
            : "";

          const venuePart = item.venue
            ? `<div class="work-venue">${item.venue}</div>`
            : "";

          return `
            <article class="work-card">
              ${thumbnailPart}
              <div class="work-content">
                <h3 class="work-title">${item.title || ""}</h3>
                ${authorsPart}
                ${venuePart}
                <p class="work-summary">${item.summary || ""}</p>
              </div>
            </article>
          `;
        })
        .join("");

      return `
        <section class="work-year-group">
          <div class="work-year">${year}</div>
          <div class="work-year-items">
            ${works}
          </div>
        </section>
      `;
    })
    .join("");
}

if (workFilterButtons.length) {
  workFilterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentType = btn.dataset.filter || "all";
      workFilterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderWorkCards();
    });
  });
}

// Photo 섹션: Cloudinary 이미지 로딩 & 모달
const photoGridEl = $("#photo-grid");
const photoModalEl = $("#photo-modal");
const photoModalImg = $("#photo-modal-image");
const photoModalTitle = $("#photo-modal-title");
const photoModalMeta = $("#photo-modal-meta");
const photoMapButton = $("#photo-map-button");
const photoMapModalEl = $("#photo-map-modal");
const photoMapEl = $("#photo-map");
const photoMapSummaryEl = $("#photo-map-summary");

let allPhotos = [];
let currentFilteredPhotos = [];
let currentPhotoIndex = -1;
let currentPhotoTag = null;
let pendingMapFocusLocation = null;
let selectedMapLocation = null;

const photoLocationCoordinates = {
  "Bohol, Philippines": [9.8499, 124.1435],
  "Boracay, Pilipinas": [11.9674, 121.9248],
  "Busan, Korea": [35.1796, 129.0756],
  "China, Qingdao": [36.0671, 120.3826],
  "Chuncheon, Korea": [37.8813, 127.7298],
  "Gangneung, Korea": [37.7519, 128.8761],
  "Germany, Aachen": [50.7753, 6.0839],
  "Germany, Cologne": [50.9375, 6.9603],
  "Germany, Frankfurt": [50.1109, 8.6821],
  "Germany, Mainz": [49.9929, 8.2473],
  "Hokkaido, Japan": [43.0642, 141.3469],
  "Hualien, Taiwan": [23.9872, 121.6015],
  "Incheon, Korea": [37.4563, 126.7052],
  "Jeju, Korea": [33.4996, 126.5312],
  "Kitakyushu, Japan": [33.8834, 130.8751],
  "LA, USA": [34.0522, -118.2437],
  "Las Vegas, USA": [36.1716, -115.1391],
  "San Francisco, USA": [37.7749, -122.4194],
  "Seoul, Korea": [37.5665, 126.9780],
};

const photoLocationColors = {
  Korea: "#ef4444",
  Japan: "#f97316",
  China: "#eab308",
  Taiwan: "#22c55e",
  Germany: "#2563eb",
  Philippines: "#8b5cf6",
  Pilipinas: "#8b5cf6",
  USA: "#ec4899",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadPhotoData() {
  try {
    const res = await fetch("data/photos.json");
    if (!res.ok) throw new Error("Failed to load photos.json");
    const data = await res.json();
    // shotAt 기준 내림차순 정렬 (최신순)
    data.sort((a, b) => {
      const dateA = a.shotAt || "";
      const dateB = b.shotAt || "";
      return dateB.localeCompare(dateA);
    });
    allPhotos = data;
    renderPhotos();
  } catch (err) {
    console.error(err);
    if (photoGridEl) {
      photoGridEl.innerHTML =
        '<p style="color:#9ca3af;font-size:14px;">Photo 데이터를 불러오지 못했습니다. `data/photos.json`을 확인하고, 로컬 서버에서 실행해 주세요.</p>';
    }
  }
}

function renderPhotos() {
  if (!photoGridEl) return;

  let items = allPhotos;
  if (currentPhotoTag) {
    items = items.filter((p) => p.tags && p.tags.includes(currentPhotoTag));
  }

  if (!items.length) {
    currentFilteredPhotos = [];
    photoGridEl.innerHTML =
      '<p style="color:#9ca3af;font-size:14px;">해당 조건의 사진이 없습니다.</p>';
    return;
  }

  currentFilteredPhotos = items;

  photoGridEl.innerHTML = items
    .map((p, index) => {
      const meta = [p.location, p.shotAt, p.camera]
        .filter(Boolean)
        .join(" · ");

      // Cloudinary URL 변환: 썸네일용 (w_800, q_auto, f_auto) 및 원본용 (q_auto, f_auto)
      // /upload/ 뒤에 변환 옵션을 삽입합니다.
      const baseUrl = p.url;
      const thumbUrl = baseUrl.replace('/upload/', '/upload/c_fill,g_auto,w_800,h_600,q_auto,f_auto/');
      const fullUrl = baseUrl.replace('/upload/', '/upload/q_auto,f_auto/');

      const tagsHtml = Array.isArray(p.tags)
        ? `<div class="photo-tags">
            ${p.tags.map(t => `<button class="tag ${t === currentPhotoTag ? 'active' : ''}" data-tag="${t}">${t}</button>`).join('')}
          </div>`
        : "";

      return `
        <div
          class="photo-item"
          data-index="${index}"
          data-full-url="${fullUrl}"
          data-meta="${meta}"
        >
          <div class="photo-thumb">
            <img
              src="${thumbUrl}"
              alt="Photo by Kyumin Kim"
              loading="lazy"
            />
          </div>
          <div class="photo-overlay"></div>
          <div class="photo-info">
            <div class="photo-meta">${meta}</div>
            ${tagsHtml}
          </div>
        </div>
      `;
    })
    .join("");

  // 모달 이벤트 바인딩
  $$(".photo-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // 태그 버튼 클릭 시 모달이 뜨지 않게 방지
      if (e.target.closest('.tag')) return;

      const index = parseInt(btn.dataset.index);
      openPhotoModal(index);
    });
  });

  // 사진 태그 이벤트 바인딩
  $$(".photo-item .tag").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // 부모 버튼(모달 열기)으로의 이벤트 전파 방지
      const tag = btn.dataset.tag;
      currentPhotoTag = currentPhotoTag === tag ? null : tag;
      renderPhotos();
    });
  });
}

function openPhotoModal(index) {
  if (!photoModalEl || !photoModalImg || index < 0 || index >= currentFilteredPhotos.length) return;

  currentPhotoIndex = index;
  const photo = currentFilteredPhotos[index];
  // 원본 크기가 너무 클 수 있으므로 최대 가로 너비를 1920px로 제한하고 최적화(q_auto, f_auto)를 적용합니다.
  const fullUrl = photo.url.replace('/upload/', '/upload/w_1920,c_limit,q_auto,f_auto/');
  const meta = [photo.location, photo.shotAt, photo.camera].filter(Boolean).join(" · ");

  // 새 이미지가 로드될 때까지 이전 이미지가 보이지 않도록 투명도 조정
  photoModalImg.style.opacity = "0";
  photoModalImg.style.transition = "opacity 0.25s ease";

  photoModalEl.classList.add("is-open");
  photoModalEl.setAttribute("aria-hidden", "false");

  photoModalImg.src = fullUrl;
  photoModalImg.onload = () => {
    photoModalImg.style.opacity = "1";
    // 현재 사진이 로드된 후 다음/이전 사진을 미리 불러와서 넘길 때 로딩 지연을 최소화합니다.
    preloadAdjacentPhotos(index);
  };

  if (photoModalMeta) photoModalMeta.textContent = meta;
}

// 다음 사진과 이전 사진을 백그라운드에서 미리 로드합니다.
function preloadAdjacentPhotos(currentIndex) {
  const neighbors = [currentIndex - 1, currentIndex + 1];
  neighbors.forEach(idx => {
    if (idx >= 0 && idx < currentFilteredPhotos.length) {
      const url = currentFilteredPhotos[idx].url.replace('/upload/', '/upload/w_1920,c_limit,q_auto,f_auto/');
      const img = new Image();
      img.src = url;
    }
  });
}

function navigatePhoto(direction) {
  const newIndex = currentPhotoIndex + direction;
  if (newIndex >= 0 && newIndex < currentFilteredPhotos.length) {
    openPhotoModal(newIndex);
  }
}

function closePhotoModal() {
  if (!photoModalEl || !photoModalImg) return;
  photoModalEl.classList.remove("is-open");
  photoModalEl.setAttribute("aria-hidden", "true");
  currentPhotoIndex = -1;
}

function getPhotoLocationGroups() {
  return allPhotos.reduce((groups, photo) => {
    const location = photo.location;
    const coords = photoLocationCoordinates[location];
    if (!location || !coords) return groups;

    if (!groups.has(location)) {
      groups.set(location, {
        location,
        coords,
        color: getLocationColor(location),
        count: 0,
        latestShotAt: "",
      });
    }

    const group = groups.get(location);
    group.count += 1;
    if ((photo.shotAt || "") > group.latestShotAt) {
      group.latestShotAt = photo.shotAt || "";
    }
    return groups;
  }, new Map());
}

function getLocationColor(location) {
  const matchedKey = Object.keys(photoLocationColors).find((key) =>
    location.includes(key)
  );
  return photoLocationColors[matchedKey] || "#111827";
}

function projectMapPoint(coords) {
  const [lat, lng] = coords;
  return {
    x: ((lng + 180) / 360) * 1000,
    y: ((90 - lat) / 180) * 500,
  };
}

function openPhotoMap(focusLocation = null) {
  if (!photoMapModalEl || !photoMapEl) return;

  pendingMapFocusLocation = focusLocation;
  selectedMapLocation = focusLocation;
  photoMapModalEl.classList.add("is-open");
  photoMapModalEl.setAttribute("aria-hidden", "false");

  renderPhotoMap();
}

function renderPhotoMap() {
  if (!photoMapEl) return;

  const groups = Array.from(getPhotoLocationGroups().values());
  if (photoMapSummaryEl) {
    const totalPhotos = groups.reduce((sum, group) => sum + group.count, 0);
    photoMapSummaryEl.textContent = `${groups.length} cities · ${totalPhotos} photos`;
  }

  const selectedGroup =
    groups.find((group) => group.location === selectedMapLocation) ||
    groups.find((group) => group.location === pendingMapFocusLocation) ||
    groups[0];

  const markerButtons = groups
    .map((group) => {
      const point = projectMapPoint(group.coords);
      const isSelected = group.location === selectedGroup?.location;
      return `
        <button
          class="photo-map-marker ${isSelected ? "is-selected" : ""}"
          type="button"
          style="left:${point.x / 10}%;top:${point.y / 5}%;--marker-color:${group.color};"
          data-location="${escapeHtml(group.location)}"
          aria-label="${escapeHtml(group.location)}: ${group.count} photos"
        >
          <span class="photo-map-marker-dot"></span>
          <span class="photo-map-marker-label">${escapeHtml(group.location.split(",")[0])}</span>
        </button>
      `;
    })
    .join("");

  const cityList = groups
    .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location))
    .map((group) => `
      <button
        class="photo-map-city ${group.location === selectedGroup?.location ? "is-selected" : ""}"
        type="button"
        data-location="${escapeHtml(group.location)}"
      >
        <span class="photo-map-city-swatch" style="background:${group.color};"></span>
        <span class="photo-map-city-name">${escapeHtml(group.location)}</span>
        <span class="photo-map-city-count">${group.count}</span>
      </button>
    `)
    .join("");

  photoMapEl.innerHTML = `
    <div class="photo-map-visual" aria-label="World photo map">
      <svg class="photo-world-map-fallback" viewBox="0 0 1000 500" aria-hidden="true">
        <path class="photo-map-fallback-land" d="M77 166L112 124L166 102L228 95L285 112L330 149L351 197L332 235L284 238L252 272L218 263L184 292L137 276L116 235L79 218L55 187Z"></path>
        <path class="photo-map-fallback-land" d="M249 278L287 293L316 342L304 392L279 447L246 487L222 430L205 371L219 318Z"></path>
        <path class="photo-map-fallback-land" d="M398 145L446 107L506 94L570 105L636 90L705 105L781 130L858 173L894 219L865 257L804 245L752 264L703 248L652 279L598 264L559 286L510 257L458 275L410 238L375 194Z"></path>
        <path class="photo-map-fallback-land" d="M492 272L538 286L577 326L590 378L569 430L533 465L501 423L476 365L462 311Z"></path>
        <path class="photo-map-fallback-land" d="M760 315L815 292L872 308L922 354L900 398L844 417L790 391Z"></path>
        <path class="photo-map-fallback-land" d="M427 94L470 65L516 76L526 116L485 139L445 123Z"></path>
        <path class="photo-map-fallback-land" d="M0 460L102 448L213 462L335 453L455 466L567 452L692 463L816 449L1000 464V500H0Z"></path>
        <path class="photo-map-fallback-island" d="M802 211L814 202L824 214L816 228Z"></path>
        <path class="photo-map-fallback-island" d="M835 232L846 242L838 257L824 247Z"></path>
        <path class="photo-map-fallback-island" d="M454 150L468 144L475 160L461 168Z"></path>
      </svg>
      <img
        class="photo-world-map"
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/BlankMap-Equirectangular.svg/1280px-BlankMap-Equirectangular.svg.png"
        alt=""
        aria-hidden="true"
        onload="this.previousElementSibling.style.display='none';"
        onerror="this.style.display='none';"
      />
      ${markerButtons}
    </div>
    <aside class="photo-map-panel">
      <div class="photo-map-selected">
        <span class="photo-map-selected-swatch" style="background:${selectedGroup?.color || "#111827"};"></span>
        <div>
          <strong>${escapeHtml(selectedGroup?.location || "No location")}</strong>
          <span>${selectedGroup ? `${selectedGroup.count} photos · latest ${selectedGroup.latestShotAt}` : ""}</span>
        </div>
      </div>
      <div class="photo-map-cities">
        ${cityList}
      </div>
    </aside>
  `;

  $$(".photo-map-marker, .photo-map-city").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedMapLocation = btn.dataset.location;
      pendingMapFocusLocation = btn.dataset.location;
      renderPhotoMap();
    });
  });
}

function closePhotoMap() {
  if (!photoMapModalEl) return;
  photoMapModalEl.classList.remove("is-open");
  photoMapModalEl.setAttribute("aria-hidden", "true");
  pendingMapFocusLocation = null;
  selectedMapLocation = null;
}

if (photoModalEl) {
  photoModalEl.addEventListener("click", (e) => {
    const target = e.target;
    if (target.matches("[data-close-modal]")) {
      closePhotoModal();
    }
  });

  // 이전/다음 버튼 이벤트
  const prevBtn = photoModalEl.querySelector(".photo-modal-nav.prev");
  const nextBtn = photoModalEl.querySelector(".photo-modal-nav.next");

  if (prevBtn) prevBtn.addEventListener("click", () => navigatePhoto(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => navigatePhoto(1));

  document.addEventListener("keydown", (e) => {
    if (!photoModalEl.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      closePhotoModal();
    } else if (e.key === "ArrowLeft") {
      navigatePhoto(-1);
    } else if (e.key === "ArrowRight") {
      navigatePhoto(1);
    }
  });
}

if (photoMapButton) {
  photoMapButton.addEventListener("click", () => openPhotoMap());
}

if (photoMapModalEl) {
  photoMapModalEl.addEventListener("click", (e) => {
    const target = e.target;
    if (target.matches("[data-close-map]")) {
      closePhotoMap();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!photoMapModalEl.classList.contains("is-open")) return;
    if (e.key === "Escape") {
      closePhotoMap();
    }
  });
}

// 초기 데이터 로딩
window.addEventListener("DOMContentLoaded", () => {
  loadWorkData();
  loadPhotoData();

  // 현재 페이지 네비게이션 활성화
  const path = window.location.pathname;
  const currentFileName = path.split("/").pop() || "index.html";

  const navLinks = $$(".nav-list a");
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");

    // 정확히 일치하거나, 루트(/)인 경우 index.html과 매칭
    const isHome = (currentFileName === "index.html" || currentFileName === "") && href === "index.html";
    const isMatch = href === currentFileName;

    // 확장자 없이 접속한 경우도 고려 (.html 제거 후 비교)
    const isMatchWithoutExt = href.replace(".html", "") === currentFileName.replace(".html", "");

    if (isHome || isMatch || isMatchWithoutExt) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
});

