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
let currentTag = null;

function renderWorkCards() {
  if (!workListEl) return;

  // 필터링 로직: 타입과 태그를 모두 고려
  let items = allWorks;
  if (currentType !== "all") {
    items = items.filter((item) => item.type === currentType);
  }
  if (currentTag) {
    items = items.filter((item) => item.tags && item.tags.includes(currentTag));
  }

  if (!items.length) {
    workListEl.innerHTML =
      '<p style="color:#9ca3af;font-size:14px;">해당 조건의 항목이 없습니다.</p>';
    return;
  }

  workListEl.innerHTML = items
    .map((item) => {
      const typeLabel =
        item.type === "publication"
          ? "Publication"
          : item.type === "patent"
            ? "Patent"
            : "Project";
      const year = item.year || "";
      const tags =
        Array.isArray(item.tags) && item.tags.length
          ? `<div class="work-tags">${item.tags
            .map((t) => `<button class="tag ${t === currentTag ? "active" : ""}" data-tag="${t}">${t}</button>`)
            .join("")}</div>`
          : "";

      const thumbnailPart = item.thumbnail
        ? `<div class="work-thumbnail">${item.link ? `<a href="${item.link}" target="_blank" rel="noreferrer"><img src="${item.thumbnail}" alt="${item.title}" loading="lazy"></a>` : `<img src="${item.thumbnail}" alt="${item.title}" loading="lazy">`}</div>`
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
            <div class="work-type">${typeLabel}</div>
            <h3 class="work-title">${item.title || ""}</h3>
            ${venuePart}
            ${authorsPart}
            <p class="work-summary">${item.summary || ""}</p>
            <div class="work-meta">
              <span>${year}</span>
            </div>
            ${tags}
          </div>
        </article>
      `;
    })
    .join("");

  // 태그 버튼에 이벤트 바인딩 (컴포넌트가 바뀔 때마다 새로 바인딩)
  $$("#work-list .tag").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = btn.dataset.tag;
      // 이미 선택된 태그면 해제, 아니면 이 태그 선택
      currentTag = currentTag === tag ? null : tag;
      renderWorkCards();
    });
  });
}

if (workFilterButtons.length) {
  workFilterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentType = btn.dataset.filter || "all";
      workFilterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      // 타입 필터를 바꾸면 태그 필터는 초기화 (선택 사항)
      currentTag = null;
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

let allPhotos = [];
let currentFilteredPhotos = [];
let currentPhotoIndex = -1;
let currentPhotoTag = null;

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

