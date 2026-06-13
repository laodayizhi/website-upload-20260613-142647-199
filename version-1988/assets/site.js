import { H as Hls } from './hls-vendor.js';

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-mobile-menu-button]');

function updateHeader() {
  if (!header) {
    return;
  }
  header.classList.toggle('is-scrolled', window.scrollY > 10);
}

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

if (menuButton && header) {
  menuButton.addEventListener('click', () => {
    header.classList.toggle('menu-open');
  });
}

function setupHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) {
    return;
  }

  const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  const prev = hero.querySelector('[data-hero-prev]');
  const next = hero.querySelector('[data-hero-next]');
  let activeIndex = 0;
  let timer = null;

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === activeIndex);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === activeIndex);
    });
  }

  function startTimer() {
    stopTimer();
    timer = window.setInterval(() => showSlide(activeIndex + 1), 5500);
  }

  function stopTimer() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.heroDot || 0));
      startTimer();
    });
  });

  if (prev) {
    prev.addEventListener('click', () => {
      showSlide(activeIndex - 1);
      startTimer();
    });
  }

  if (next) {
    next.addEventListener('click', () => {
      showSlide(activeIndex + 1);
      startTimer();
    });
  }

  hero.addEventListener('mouseenter', stopTimer);
  hero.addEventListener('mouseleave', startTimer);
  showSlide(0);
  startTimer();
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function setupCardFilters() {
  document.querySelectorAll('[data-card-list]').forEach((list) => {
    const section = list.closest('section') || document;
    const input = section.querySelector('[data-card-filter]');
    const cards = Array.from(list.querySelectorAll('[data-card]'));
    const visibleCount = section.querySelector('[data-visible-count]');
    const totalCount = section.querySelector('[data-total-count]');
    const emptyTip = section.querySelector('[data-empty-tip]');

    if (totalCount) {
      totalCount.textContent = String(cards.length);
    }

    function applyFilter() {
      const keyword = normalize(input ? input.value : '');
      let count = 0;

      cards.forEach((card) => {
        const text = normalize(card.dataset.title || card.textContent);
        const visible = !keyword || text.includes(keyword);
        card.hidden = !visible;
        if (visible) {
          count += 1;
        }
      });

      if (visibleCount) {
        visibleCount.textContent = String(count);
      }
      if (emptyTip) {
        emptyTip.hidden = count !== 0;
      }
    }

    if (input) {
      input.addEventListener('input', applyFilter);
    }
    applyFilter();
  });
}

const hlsInstances = [];

function setupPlayers() {
  document.querySelectorAll('.js-player').forEach((player) => {
    const video = player.querySelector('video');
    const button = player.querySelector('.js-play-button');
    const status = player.querySelector('.js-player-status');
    const source = player.dataset.videoSrc;
    let initialized = false;
    let hls = null;

    if (!video || !button || !source) {
      return;
    }

    function setStatus(message, isError = false) {
      if (!status) {
        return;
      }
      status.textContent = message;
      status.classList.toggle('error', isError);
    }

    function playVideo() {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          setStatus('浏览器阻止了自动播放，请再次点击播放器开始播放。');
          button.hidden = false;
        });
      }
    }

    function initHls() {
      if (initialized) {
        playVideo();
        return;
      }

      initialized = true;
      button.hidden = true;
      setStatus('正在初始化 HLS 播放源，请稍候…');

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', playVideo, { once: true });
        setStatus('播放源已加载，正在播放。');
        return;
      }

      if (Hls && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstances.push(hls);
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus('播放源已加载，正在播放。');
          playVideo();
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setStatus('网络错误，正在重新加载播放源…', true);
            hls.startLoad();
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            setStatus('媒体解码错误，正在尝试恢复…', true);
            hls.recoverMediaError();
            return;
          }
          setStatus('当前浏览器无法播放此 HLS 源，请更换浏览器后重试。', true);
          hls.destroy();
        });
        return;
      }

      setStatus('当前浏览器不支持 HLS 播放。', true);
      button.hidden = false;
      initialized = false;
    }

    button.addEventListener('click', initHls);
    video.addEventListener('play', () => {
      button.hidden = true;
    });
    video.addEventListener('pause', () => {
      if (video.currentTime === 0 || video.ended) {
        button.hidden = false;
      }
    });
  });
}

function setupImageFallbacks() {
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.classList.add('image-missing');
    }, { once: true });
  });
}

setupHero();
setupCardFilters();
setupPlayers();
setupImageFallbacks();

window.__movieHlsInstances = hlsInstances;
