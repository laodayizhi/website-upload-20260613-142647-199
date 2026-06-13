(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function setupNavigation() {
    var toggle = document.querySelector('[data-mobile-toggle]');
    var nav = document.querySelector('[data-main-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('is-nav-open');
    });
    nav.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        document.body.classList.remove('is-nav-open');
      }
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function matchesYear(year, value) {
    if (!value) {
      return true;
    }
    if (value === '2025+') {
      return year >= 2025;
    }
    if (value === '2020-2024') {
      return year >= 2020 && year <= 2024;
    }
    if (value === '2010-2019') {
      return year >= 2010 && year <= 2019;
    }
    if (value === '2000-2009') {
      return year >= 2000 && year <= 2009;
    }
    if (value === 'before-2000') {
      return year > 0 && year < 2000;
    }
    return true;
  }

  function setupFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));
    scopes.forEach(function (scope) {
      var input = scope.querySelector('[data-search-input]');
      var type = scope.querySelector('[data-type-filter]');
      var year = scope.querySelector('[data-year-filter]');
      var result = scope.querySelector('[data-result-count]');
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-movie-card]'));
      if (!cards.length) {
        return;
      }

      function apply() {
        var query = input ? input.value.trim().toLowerCase() : '';
        var typeValue = type ? type.value : '';
        var yearValue = year ? year.value : '';
        var visible = 0;

        cards.forEach(function (card) {
          var text = [
            card.getAttribute('data-title') || '',
            card.getAttribute('data-region') || '',
            card.getAttribute('data-type') || '',
            card.getAttribute('data-genre') || ''
          ].join(' ').toLowerCase();
          var cardType = card.getAttribute('data-type') || '';
          var cardYear = Number(card.getAttribute('data-year') || 0);
          var ok = true;
          if (query && text.indexOf(query) === -1) {
            ok = false;
          }
          if (typeValue && cardType.indexOf(typeValue) === -1) {
            ok = false;
          }
          if (!matchesYear(cardYear, yearValue)) {
            ok = false;
          }
          card.classList.toggle('is-filter-hidden', !ok);
          if (ok) {
            visible += 1;
          }
        });

        if (result) {
          result.textContent = '当前匹配 ' + visible + ' 部影片';
        }
      }

      [input, type, year].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });
      apply();
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('[data-play-button]');
      var url = player.getAttribute('data-stream');
      var started = false;
      var hls = null;

      if (!video || !button || !url) {
        return;
      }

      function bindStream() {
        if (started) {
          return;
        }
        started = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
          video.load();
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(url);
          hls.attachMedia(video);
        } else {
          video.src = url;
          video.load();
        }
      }

      function play() {
        bindStream();
        button.classList.add('is-hidden');
        video.controls = true;
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            button.classList.remove('is-hidden');
          });
        }
      }

      button.addEventListener('click', play);
      player.addEventListener('click', function (event) {
        if (event.target === player) {
          play();
        }
      });
      video.addEventListener('click', function () {
        if (!started || video.paused) {
          play();
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  ready(function () {
    setupNavigation();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
