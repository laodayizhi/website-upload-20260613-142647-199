(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function initMenu() {
        var button = document.querySelector(".menu-toggle");
        var panel = document.querySelector(".mobile-panel");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    function initCarousel() {
        var carousel = document.querySelector("[data-carousel]");
        if (!carousel) {
            return;
        }
        var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-slide]"));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-slide-dot]"));
        var prev = carousel.querySelector("[data-slide-prev]");
        var next = carousel.querySelector("[data-slide-next]");
        var active = Math.max(0, slides.findIndex(function (slide) {
            return slide.classList.contains("is-active");
        }));
        var timer = null;

        function show(index) {
            active = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === active);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === active);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(active + 1);
            }, 5000);
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
                restart();
            });
        });
        if (prev) {
            prev.addEventListener("click", function () {
                show(active - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(active + 1);
                restart();
            });
        }
        show(active);
        restart();
    }

    function initFilters() {
        document.querySelectorAll(".filter-scope").forEach(function (scope) {
            var keyword = scope.querySelector("[data-filter-keyword]");
            var category = scope.querySelector("[data-filter-category]");
            var year = scope.querySelector("[data-filter-year]");
            var type = scope.querySelector("[data-filter-type]");
            var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-card]"));
            if (!keyword && !category && !year && !type) {
                return;
            }

            function apply() {
                var kw = normalize(keyword && keyword.value);
                var cat = normalize(category && category.value);
                var yr = normalize(year && year.value);
                var tp = normalize(type && type.value);
                cards.forEach(function (card) {
                    var text = normalize(card.getAttribute("data-search"));
                    var cardCat = normalize(card.getAttribute("data-category"));
                    var cardYear = normalize(card.getAttribute("data-year"));
                    var cardType = normalize(card.getAttribute("data-type"));
                    var matched = true;
                    if (kw && text.indexOf(kw) === -1) {
                        matched = false;
                    }
                    if (cat && cardCat !== cat) {
                        matched = false;
                    }
                    if (yr && cardYear !== yr) {
                        matched = false;
                    }
                    if (tp && cardType !== tp) {
                        matched = false;
                    }
                    card.classList.toggle("is-hidden", !matched);
                });
            }

            [keyword, category, year, type].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });
        });
    }

    window.setupMoviePlayer = function (options) {
        var video = document.getElementById(options.videoId);
        var button = document.getElementById(options.buttonId);
        var stream = options.stream;
        var prepared = false;
        var hls = null;

        if (!video || !button || !stream) {
            return;
        }

        function prepare() {
            if (prepared) {
                return Promise.resolve();
            }
            prepared = true;
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(stream);
                hls.attachMedia(video);
                return Promise.resolve();
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = stream;
                return Promise.resolve();
            }
            return Promise.reject(new Error("stream"));
        }

        function start() {
            prepare().then(function () {
                button.classList.add("is-hidden");
                var playTask = video.play();
                if (playTask && typeof playTask.catch === "function") {
                    playTask.catch(function () {
                        button.classList.remove("is-hidden");
                    });
                }
            }).catch(function () {
                button.classList.remove("is-hidden");
                button.querySelector("span:last-child").textContent = "播放加载失败";
            });
        }

        button.addEventListener("click", start);
        video.addEventListener("click", function () {
            if (!prepared || video.paused) {
                start();
            }
        });
        video.addEventListener("play", function () {
            button.classList.add("is-hidden");
        });
        video.addEventListener("pause", function () {
            if (video.currentTime === 0 || video.ended) {
                button.classList.remove("is-hidden");
            }
        });
        window.addEventListener("pagehide", function () {
            if (hls) {
                hls.destroy();
                hls = null;
            }
        });
    };

    ready(function () {
        initMenu();
        initCarousel();
        initFilters();
    });
})();
