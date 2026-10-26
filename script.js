(function () {
    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Theme: system by default, toggles light/dark and remembers it ----------
    var toggle = document.querySelector('.theme-toggle');
    var themeMeta = document.querySelector('meta[name="theme-color"]');

    function currentTheme() {
        var set = root.getAttribute('data-theme');
        if (set) return set;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function syncThemeMeta() {
        if (themeMeta) themeMeta.setAttribute('content', currentTheme() === 'dark' ? '#111312' : '#EEECE6');
    }

    if (toggle) {
        toggle.addEventListener('click', function () {
            var next = currentTheme() === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
            syncThemeMeta();
        });
    }
    syncThemeMeta();

    // ---------- Patch panel: light the port for the section in view ----------
    var ports = {};
    document.querySelectorAll('.port[data-port]').forEach(function (p) {
        ports[p.getAttribute('data-port')] = p;
    });

    function setActive(id) {
        Object.keys(ports).forEach(function (key) {
            var on = key === id;
            ports[key].classList.toggle('is-active', on);
            if (on) ports[key].setAttribute('aria-current', 'true');
            else ports[key].removeAttribute('aria-current');
        });
    }

    var sections = document.querySelectorAll('[data-section]');
    if ('IntersectionObserver' in window) {
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) setActive(entry.target.getAttribute('data-section'));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(function (s) { sectionObserver.observe(s); });
    }
    setActive('top');

    // ---------- Console: type out "show version" once ----------
    var consoleEl = document.getElementById('console');
    if (consoleEl && !reduceMotion) {
        var finalHTML = consoleEl.innerHTML;
        var tokens = finalHTML.split(/(<[^>]+>|&[a-z]+;)/).filter(Boolean);
        var out = '';
        var i = 0;
        var charIndex = 0;
        consoleEl.innerHTML = '<span class="c-cursor"></span>';

        // The first line types like a person; the output arrives like a terminal
        var firstLineEnd = finalHTML.indexOf('\n');
        var promptEnd = finalHTML.indexOf('</span>');

        function step() {
            if (i >= tokens.length) {
                consoleEl.innerHTML = finalHTML;
                return;
            }
            var tok = tokens[i];
            if (tok.charAt(0) === '<' || tok.charAt(0) === '&') {
                out += tok;
                charIndex += tok.length;
                i++;
                step();
                return;
            }
            // Emit text one character at a time inside the command, a line at a time after it
            var typing = charIndex > promptEnd && charIndex < firstLineEnd;
            if (typing) {
                out += tok.charAt(0);
                tokens[i] = tok.slice(1);
                charIndex++;
                if (!tokens[i]) i++;
            } else {
                var nl = tok.indexOf('\n');
                var chunk = nl === -1 ? tok : tok.slice(0, nl + 1);
                out += chunk;
                tokens[i] = tok.slice(chunk.length);
                charIndex += chunk.length;
                if (!tokens[i]) i++;
            }
            consoleEl.innerHTML = out + '<span class="c-cursor"></span>';
            setTimeout(step, typing ? 55 + Math.random() * 50 : 140);
        }
        setTimeout(step, 700);
    }

    // ---------- Reveal on scroll ----------
    var revealTargets = document.querySelectorAll(
        '.section-head, .unit, .osi-row, .hop, .sched-row, .cert, .ifstatus, .contact-grid > *'
    );
    if ('IntersectionObserver' in window && !reduceMotion) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
        revealTargets.forEach(function (el) {
            el.classList.add('reveal');
            revealObserver.observe(el);
        });
    }

    // ---------- Copy email ----------
    var copyBtn = document.querySelector('.copy-btn');
    var copyStatus = document.querySelector('.copy-status');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            var text = copyBtn.getAttribute('data-copy');
            function done(ok) {
                if (!copyStatus) return;
                copyStatus.textContent = ok ? 'Copied to clipboard' : 'Press Ctrl+C to copy';
                setTimeout(function () { copyStatus.textContent = ''; }, 2400);
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
            } else {
                done(false);
            }
        });
    }

    // ---------- Footer year ----------
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();
