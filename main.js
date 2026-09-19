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
    const res = await fetch("data/work.json", { cache: "no-store" });
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

function getWorkTypeLabel(type) {
  if (type === "publication") return "Publication";
  if (type === "patent") return "Patent";
  if (type === "project") return "Project";
  return type || "";
}

function getWorkLinks(item) {
  const links = [];

  const addLink = (label, url) => {
    if (!url || typeof url !== "string") return;
    const lowerLabel = String(label || "Link").toLowerCase();
    const normalizedLabel =
      lowerLabel === "code" ? "Code" : lowerLabel === "pdf" ? "PDF" : lowerLabel === "link" ? "Link" : label || "Link";
    const hasSameUrl = links.some((link) => link.url === url);
    if (!hasSameUrl) links.push({ label: normalizedLabel, url });
  };

  const addLinks = (value, fallbackLabel = "Link") => {
    if (!value) return;

    if (typeof value === "string") {
      addLink(fallbackLabel, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((link) => {
        if (typeof link === "string") {
          addLink(fallbackLabel, link);
          return;
        }

        if (link && typeof link === "object") {
          const url = link.url || link.href;
          if (url) {
            addLink(link.label || fallbackLabel, url);
            return;
          }

          Object.entries(link).forEach(([label, nestedUrl]) => {
            addLink(label, nestedUrl);
          });
        }
      });
      return;
    }

    if (typeof value === "object") {
      Object.entries(value).forEach(([label, url]) => {
        addLink(label, url);
      });
    }
  };

  addLinks(item.links);

  if (item.link && typeof item.link === "object") {
    addLinks(item.link);
  } else {
    addLinks(item.link, "Link");
  }

  addLinks(item.pdf, "PDF");
  addLinks(item.code, "Code");

  return links;
}

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
            ? `<img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title || "")}" loading="lazy">`
            : "";
          const thumbnailPart = thumbnailImage
            ? `<div class="work-thumbnail">${thumbnailImage}</div>`
            : "";

          const authorsPart = item.authors
            ? `<div class="work-authors">${escapeHtml(item.authors).replace("Kyumin Kim", "<strong>Kyumin Kim</strong>")}</div>`
            : "";

          const venueText = item.venue || getWorkTypeLabel(item.type);
          const venuePart = venueText
            ? `<div class="work-venue">${escapeHtml(venueText)}</div>`
            : "";
          const links = getWorkLinks(item);
          const linksPart = links.length
            ? `<div class="work-links">${links
                .map((link) => {
                  const label = link.label || "Link";
                  return `<a class="work-link-button" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
                })
                .join("")}</div>`
            : "";

          return `
            <article class="work-card">
              ${thumbnailPart}
              <div class="work-content">
                <h3 class="work-title">${escapeHtml(item.title || "")}</h3>
                ${authorsPart}
                ${venuePart}
                ${linksPart}
                <p class="work-summary">${escapeHtml(item.summary || "")}</p>
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
let currentModalPhotos = [];
let currentPhotoIndex = -1;
let currentPhotoTag = null;
let photoModalReturnToMap = false;
let mapPhotoHistoryActive = false;
let pendingMapFocusLocation = null;
let selectedMapLocation = null;
let photoLeafletMap = null;
const photoLeafletMarkers = new Map();

const photoLocationCoordinates = {};

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
    const [photoResponse, locationResponse] = await Promise.all([
      fetch("data/photos.json"),
      fetch("data/photo-locations.json"),
    ]);
    if (!photoResponse.ok) throw new Error("Failed to load photos.json");
    if (!locationResponse.ok) throw new Error("Failed to load photo-locations.json");

    const [data, locations] = await Promise.all([
      photoResponse.json(),
      locationResponse.json(),
    ]);
    Object.assign(photoLocationCoordinates, locations);
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

function openPhotoModal(index, photos = currentFilteredPhotos, options = {}) {
  if (!photoModalEl || !photoModalImg || index < 0 || index >= photos.length) return;

  const returnToMap = Boolean(options.returnToMap);
  const isAlreadyOpen = photoModalEl.classList.contains("is-open");
  photoModalReturnToMap = returnToMap;
  currentModalPhotos = photos;
  currentPhotoIndex = index;
  const photo = currentModalPhotos[index];
  // 원본 크기가 너무 클 수 있으므로 최대 가로 너비를 1920px로 제한하고 최적화(q_auto, f_auto)를 적용합니다.
  const fullUrl = photo.url.replace('/upload/', '/upload/w_1920,c_limit,q_auto,f_auto/');
  const meta = [photo.location, photo.shotAt, photo.camera].filter(Boolean).join(" · ");

  // 새 이미지가 로드될 때까지 이전 이미지가 보이지 않도록 투명도 조정
  photoModalImg.style.opacity = "0";
  photoModalImg.style.transition = "opacity 0.25s ease";

  photoModalEl.classList.add("is-open");
  photoModalEl.classList.toggle("from-map", returnToMap);
  photoModalEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("photo-modal-open");

  if (returnToMap && photoMapModalEl) {
    photoMapModalEl.setAttribute("aria-hidden", "true");
    if (!isAlreadyOpen && options.pushHistory !== false) {
      window.history.pushState({ photoMapViewer: true }, "");
      mapPhotoHistoryActive = true;
    }
  }

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
    if (idx >= 0 && idx < currentModalPhotos.length) {
      const url = currentModalPhotos[idx].url.replace('/upload/', '/upload/w_1920,c_limit,q_auto,f_auto/');
      const img = new Image();
      img.src = url;
    }
  });
}

function navigatePhoto(direction) {
  const newIndex = currentPhotoIndex + direction;
  if (newIndex >= 0 && newIndex < currentModalPhotos.length) {
    openPhotoModal(newIndex, currentModalPhotos, {
      returnToMap: photoModalReturnToMap,
      pushHistory: false,
    });
  }
}

function closePhotoModal() {
  if (!photoModalEl || !photoModalImg) return;
  const shouldRestoreMap = photoModalReturnToMap && photoMapModalEl?.classList.contains("is-open");
  photoModalEl.classList.remove("is-open");
  photoModalEl.classList.remove("from-map");
  photoModalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("photo-modal-open");
  if (shouldRestoreMap) {
    photoMapModalEl.setAttribute("aria-hidden", "false");
  }
  currentPhotoIndex = -1;
  currentModalPhotos = [];
  photoModalReturnToMap = false;
  mapPhotoHistoryActive = false;
}

function requestClosePhotoModal() {
  if (photoModalReturnToMap && mapPhotoHistoryActive) {
    window.history.back();
    return;
  }
  closePhotoModal();
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

function getPhotosForLocation(location) {
  return allPhotos.filter((photo) => photo.location === location);
}

function createPhotoMapPopup(group) {
  const photos = getPhotosForLocation(group.location);
  const thumbnails = photos
    .map((photo, index) => {
      const thumbnailUrl = photo.url.replace(
        "/upload/",
        "/upload/c_fill,g_auto,w_240,h_180,q_auto,f_auto/"
      );
      const eagerSource = index < 9 ? `src="${escapeHtml(thumbnailUrl)}"` : `data-src="${escapeHtml(thumbnailUrl)}"`;
      const labelParts = [photo.shotAt, photo.camera].filter(Boolean).join(" · ");

      return `
        <button
          class="photo-map-popup-item"
          type="button"
          data-location="${escapeHtml(group.location)}"
          data-photo-index="${index}"
          aria-label="${escapeHtml(group.location)} 사진 ${index + 1} 열기"
          title="${escapeHtml(labelParts)}"
        >
          <img ${eagerSource} alt="" loading="lazy" draggable="false">
        </button>
      `;
    })
    .join("");

  return `
    <section class="photo-map-popup-content" data-location="${escapeHtml(group.location)}">
      <div class="photo-map-popup-header">
        <strong>${escapeHtml(group.location)}</strong>
        <span>${photos.length} photos</span>
      </div>
      <div class="photo-map-popup-grid" role="list" aria-label="${escapeHtml(group.location)} 사진 목록">
        ${thumbnails}
      </div>
    </section>
  `;
}

function handlePhotoMapPopupOpen(event) {
  const popupElement = event.popup.getElement();
  const content = popupElement?.querySelector(".photo-map-popup-content");
  const grid = content?.querySelector(".photo-map-popup-grid");
  if (!content || !grid) return;

  L.DomEvent.disableClickPropagation(content);
  L.DomEvent.disableScrollPropagation(grid);

  if (!content.dataset.bound) {
    content.dataset.bound = "true";
    content.addEventListener("click", (clickEvent) => {
      const button = clickEvent.target.closest(".photo-map-popup-item");
      if (!button) return;

      const locationPhotos = getPhotosForLocation(button.dataset.location);
      const photoIndex = Number.parseInt(button.dataset.photoIndex, 10);
      openPhotoModal(photoIndex, locationPhotos, { returnToMap: true });
    });
  }

  const deferredImages = Array.from(grid.querySelectorAll("img[data-src]"));
  if (!deferredImages.length) return;

  if (!("IntersectionObserver" in window)) {
    deferredImages.forEach((image) => {
      image.src = image.dataset.src;
      image.removeAttribute("data-src");
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const image = entry.target;
      image.src = image.dataset.src;
      image.removeAttribute("data-src");
      observer.unobserve(image);
    });
  }, { root: grid, rootMargin: "80px" });

  deferredImages.forEach((image) => imageObserver.observe(image));
}

function openPhotoMap(focusLocation = null) {
  if (!photoMapModalEl || !photoMapEl) return;

  pendingMapFocusLocation = focusLocation;
  selectedMapLocation = focusLocation;
  photoMapModalEl.classList.add("is-open");
  photoMapModalEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("photo-map-open");

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

  if (photoLeafletMap) {
    photoLeafletMap.remove();
    photoLeafletMap = null;
    photoLeafletMarkers.clear();
  }

  photoMapEl.innerHTML = `
    <div id="photo-map-canvas" class="photo-map-visual" aria-label="사진 촬영 지역 지도"></div>
    <aside class="photo-map-panel">
      <div class="photo-map-selected" aria-live="polite">
        <span class="photo-map-selected-swatch" style="background:${selectedGroup?.color || "#111827"};"></span>
        <div class="photo-map-selected-copy">
          <strong>${escapeHtml(selectedGroup?.location || "No location")}</strong>
          <span>${selectedGroup ? `${selectedGroup.count} photos · latest ${selectedGroup.latestShotAt}` : ""}</span>
        </div>
      </div>
      <div class="photo-map-cities">
        ${cityList}
      </div>
    </aside>
  `;

  $$(".photo-map-city").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectPhotoMapLocation(btn.dataset.location, groups, true);
    });
  });

  initializePhotoLeafletMap(groups, selectedGroup, Boolean(pendingMapFocusLocation));
  pendingMapFocusLocation = null;
}

function initializePhotoLeafletMap(groups, selectedGroup, focusSelected) {
  const mapCanvas = $("#photo-map-canvas");
  if (!mapCanvas) return;

  if (typeof L === "undefined") {
    mapCanvas.innerHTML = '<p class="photo-map-error">지도를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.</p>';
    return;
  }

  photoLeafletMap = L.map(mapCanvas, {
    minZoom: 2,
    maxZoom: 18,
    zoomSnap: 0.5,
    worldCopyJump: true,
    scrollWheelZoom: true,
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(photoLeafletMap);

  groups.forEach((group) => {
    const marker = L.circleMarker(group.coords, getPhotoMapMarkerStyle(group, group === selectedGroup))
      .addTo(photoLeafletMap)
      .bindTooltip(group.location.split(",")[0], {
        direction: "top",
        offset: [0, -8],
      })
      .bindPopup(createPhotoMapPopup(group), {
        className: "photo-map-popup",
        minWidth: 280,
        maxWidth: 340,
        closeButton: true,
      });

    marker.on("click", () => selectPhotoMapLocation(group.location, groups, false));
    photoLeafletMarkers.set(group.location, marker);
  });

  photoLeafletMap.on("popupopen", handlePhotoMapPopupOpen);

  if (focusSelected && selectedGroup) {
    photoLeafletMap.setView(selectedGroup.coords, 7);
  } else if (groups.length) {
    photoLeafletMap.fitBounds(groups.map((group) => group.coords), {
      padding: [32, 32],
      maxZoom: 3,
    });
  } else {
    photoLeafletMap.setView([20, 0], 2);
  }

  window.setTimeout(() => photoLeafletMap?.invalidateSize(), 0);
}

function getPhotoMapMarkerStyle(group, isSelected) {
  return {
    radius: isSelected ? 9 : Math.min(9, 6 + Math.log10(group.count + 1)),
    color: "#ffffff",
    weight: isSelected ? 3 : 2,
    fillColor: group.color,
    fillOpacity: isSelected ? 1 : 0.86,
  };
}

function selectPhotoMapLocation(location, groups, focusMap) {
  const selectedGroup = groups.find((group) => group.location === location);
  if (!selectedGroup) return;

  selectedMapLocation = location;

  $$(".photo-map-city").forEach((button) => {
    const isSelected = button.dataset.location === location;
    button.classList.toggle("is-selected", isSelected);
    if (isSelected && !focusMap) {
      button.scrollIntoView({ block: "nearest" });
    }
  });

  const selectedCard = $(".photo-map-selected");
  if (selectedCard) {
    selectedCard.innerHTML = `
      <span class="photo-map-selected-swatch" style="background:${selectedGroup.color};"></span>
      <div class="photo-map-selected-copy">
        <strong>${escapeHtml(selectedGroup.location)}</strong>
        <span>${selectedGroup.count} photos · latest ${selectedGroup.latestShotAt}</span>
      </div>
    `;
  }

  groups.forEach((group) => {
    photoLeafletMarkers.get(group.location)?.setStyle(
      getPhotoMapMarkerStyle(group, group.location === location)
    );
  });
  photoLeafletMarkers.get(location)?.bringToFront();

  if (focusMap && photoLeafletMap) {
    photoLeafletMap.flyTo(selectedGroup.coords, Math.max(photoLeafletMap.getZoom(), 7), {
      duration: 0.7,
    });
    window.setTimeout(() => {
      if (photoMapModalEl?.classList.contains("is-open")) {
        photoLeafletMarkers.get(location)?.openPopup();
      }
    }, 750);
  }
}

function closePhotoMap() {
  if (!photoMapModalEl) return;
  photoMapModalEl.classList.remove("is-open");
  photoMapModalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("photo-map-open");
  pendingMapFocusLocation = null;
  selectedMapLocation = null;
}

if (photoModalEl) {
  photoModalEl.addEventListener("click", (e) => {
    const target = e.target;
    if (target.closest("[data-close-modal]")) {
      requestClosePhotoModal();
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
      requestClosePhotoModal();
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
    if (photoModalEl?.classList.contains("is-open")) return;
    if (e.key === "Escape") {
      closePhotoMap();
    }
  });
}

window.addEventListener("popstate", () => {
  if (photoModalEl?.classList.contains("is-open") && photoModalReturnToMap) {
    closePhotoModal();
  }
});

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

