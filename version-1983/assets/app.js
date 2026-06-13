(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }

  ready(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');
    if (menuButton && mobileNav) {
      menuButton.addEventListener('click', function () {
        mobileNav.classList.toggle('open');
      });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
      var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
      var current = 0;
      var show = function (index) {
        if (!slides.length) {
          return;
        }
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('active', slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle('active', dotIndex === current);
        });
      };
      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener('click', function () {
          show(dotIndex);
        });
      });
      window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    var filterPanels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));
    filterPanels.forEach(function (panel) {
      var target = document.querySelector(panel.getAttribute('data-filter-panel'));
      if (!target) {
        return;
      }
      var cards = Array.prototype.slice.call(target.querySelectorAll('[data-movie-card]'));
      var empty = document.querySelector('[data-empty-state]');
      var search = panel.querySelector('[data-search]');
      var type = panel.querySelector('[data-type]');
      var year = panel.querySelector('[data-year]');
      var apply = function () {
        var keyword = search ? search.value.trim().toLowerCase() : '';
        var typeValue = type ? type.value : '';
        var yearValue = year ? year.value : '';
        var visible = 0;
        cards.forEach(function (card) {
          var text = (card.getAttribute('data-title') + ' ' + card.getAttribute('data-region') + ' ' + card.getAttribute('data-genre') + ' ' + card.getAttribute('data-tags')).toLowerCase();
          var matched = true;
          if (keyword && text.indexOf(keyword) === -1) {
            matched = false;
          }
          if (typeValue && card.getAttribute('data-type') !== typeValue) {
            matched = false;
          }
          if (yearValue && card.getAttribute('data-year') !== yearValue) {
            matched = false;
          }
          card.style.display = matched ? '' : 'none';
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('show', visible === 0);
        }
      };
      [search, type, year].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });
    });

    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var overlay = player.querySelector('.play-overlay');
      if (!video) {
        return;
      }
      var source = video.getAttribute('data-src') || player.getAttribute('data-src');
      var start = function () {
        if (!source) {
          return;
        }
        overlay && overlay.classList.add('hidden');
        video.controls = true;
        if (!video.getAttribute('data-ready')) {
          video.setAttribute('data-ready', '1');
          if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
              lowLatencyMode: true,
              backBufferLength: 90
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            video._hls = hls;
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
          } else {
            video.src = source;
          }
        }
        video.play().catch(function () {});
      };
      if (overlay) {
        overlay.addEventListener('click', start);
      }
      video.addEventListener('click', function () {
        if (video.paused) {
          start();
        }
      });
    });
  });
})();
