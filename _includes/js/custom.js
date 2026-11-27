// Krestfield: page enhancements. These only change presentation; the Markdown
// stays plain and pages work without JavaScript.
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var article = document.querySelector('.kf-article');

    // ---- Light / dark toggle (choice saved in this browser)
    var toggle = document.getElementById('kf-theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var root = document.documentElement;
        var current = root.getAttribute('data-theme') ||
          (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        var next = current === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('kf-theme', next); } catch (e) {}
      });
    }

    if (article) {
      // ---- Version badge: "> From version: 1.8.0" near the top of a page
      var h1 = article.querySelector('h1');
      var firstH2 = article.querySelector('h2');
      var patterns = [
        [/^\s*(?:supported\s+)?from\s+version:?\s*(.+?)\s*$/i, function (m) { return 'From version ' + m[1]; }],
        [/^\s*applies\s+to\s+(.+?)\s+version:?\s*(.+?)\s*$/i, function (m) { return m[1] + ' ' + m[2]; }]
      ];
      var badges = [];
      article.querySelectorAll('blockquote').forEach(function (bq) {
        if (firstH2 && (bq.compareDocumentPosition(firstH2) & Node.DOCUMENT_POSITION_PRECEDING)) return;
        if (bq.className || bq.children.length !== 1 || bq.children[0].tagName !== 'P') return;
        var text = bq.textContent.replace(/\s+/g, ' ');
        for (var i = 0; i < patterns.length; i++) {
          var m = text.match(patterns[i][0]);
          if (m) { badges.push(patterns[i][1](m)); bq.parentNode.removeChild(bq); break; }
        }
      });
      if (badges.length && h1) {
        var meta = document.createElement('div');
        meta.className = 'kf-meta';
        badges.forEach(function (b) {
          var pill = document.createElement('span');
          pill.className = 'kf-pill';
          pill.textContent = b;
          meta.appendChild(pill);
        });
        h1.insertAdjacentElement('afterend', meta);
      }

      // ---- Numbered step headings: "### 1. Download the Installer"
      article.querySelectorAll('h2, h3').forEach(function (h) {
        for (var n = h.firstChild; n; n = n.nextSibling) {
          if (n.nodeType !== 3) continue;
          var m = n.nodeValue.match(/^\s*(\d+)\.\s+(?=\S)/);
          if (!m) { if (n.nodeValue.trim()) break; continue; }
          n.nodeValue = n.nodeValue.slice(m[0].length);
          var num = document.createElement('span');
          num.className = 'kf-step-n';
          num.setAttribute('aria-hidden', 'true');
          num.textContent = m[1];
          h.insertBefore(num, n);
          var sr = document.createElement('span');
          sr.className = 'sr-only';
          sr.textContent = m[1] + '. ';
          h.insertBefore(sr, n);
          break;
        }
      });

      // ---- Language label on code blocks
      var names = { powershell: 'PowerShell', ps1: 'PowerShell', bash: 'Bash', shell: 'Shell', sh: 'Shell', console: 'Console',
        cmd: 'Command Prompt', bat: 'Batch', batch: 'Batch', json: 'JSON', yaml: 'YAML', yml: 'YAML', xml: 'XML', html: 'HTML',
        java: 'Java', csharp: 'C#', cs: 'C#', javascript: 'JavaScript', js: 'JavaScript', python: 'Python', py: 'Python',
        properties: 'Properties', ini: 'INI', sql: 'SQL', text: 'Text', plaintext: 'Text', http: 'HTTP', dockerfile: 'Dockerfile',
        nginx: 'nginx', apache: 'Apache', toml: 'TOML', go: 'Go', ruby: 'Ruby', c: 'C', cpp: 'C++', vb: 'VB.NET', groovy: 'Groovy' };
      article.querySelectorAll('div.highlighter-rouge').forEach(function (block) {
        var m = block.className.match(/language-([\w+-]+)/);
        if (!m) return;
        var key = m[1].toLowerCase();
        var head = document.createElement('div');
        head.className = 'kf-code-head';
        head.textContent = names[key] || key;
        block.insertBefore(head, block.firstChild);
      });
    }

    // ---- "On this page" list with the current section highlighted
    var toc = document.getElementById('kf-toc');
    if (toc && article) {
      var heads = Array.prototype.filter.call(article.querySelectorAll('h2[id], h3[id]'), function (h) {
        return h.offsetParent !== null;
      });
      if (heads.length >= 2) {
        var list = toc.querySelector('ul');
        var links = [];
        heads.forEach(function (h) {
          var li = document.createElement('li');
          if (h.tagName === 'H3') li.className = 'kf-toc-h3';
          var a = document.createElement('a');
          a.href = '#' + h.id;
          var clone = h.cloneNode(true);
          clone.querySelectorAll('.anchor-heading, .kf-step-n').forEach(function (x) { x.remove(); });
          a.textContent = clone.textContent.replace(/\s+/g, ' ').trim();
          li.appendChild(a);
          list.appendChild(li);
          links.push(a);
        });
        toc.hidden = false;
        var setCurrent = function () {
          var y = window.scrollY + 120;
          var idx = 0;
          for (var i = 0; i < heads.length; i++) {
            if (heads[i].getBoundingClientRect().top + window.scrollY <= y) idx = i;
          }
          links.forEach(function (l, i) { l.classList.toggle('is-current', i === idx); });
        };
        var ticking = false;
        window.addEventListener('scroll', function () {
          if (!ticking) { ticking = true; requestAnimationFrame(function () { setCurrent(); ticking = false; }); }
        }, { passive: true });
        setCurrent();
      }
    }

    // ---- Home page: popular-search chips run a search in the search box
    var input = document.getElementById('search-input');
    function runSearch(q) {
      if (!input) return;
      window.scrollTo(0, 0);
      input.focus();
      if (typeof q === 'string') {
        input.value = q;
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      }
    }
    document.querySelectorAll('.kf-chip[data-search]').forEach(function (chip) {
      chip.addEventListener('click', function () { runSearch(chip.getAttribute('data-search')); });
    });

    // ---- Analytics: record what people search for (only when GoatCounter is set up).
    // A search is recorded once the visitor stops typing for 2 seconds; searches
    // that find nothing are labelled so gaps in the docs stand out.
    var searchBox = document.getElementById('search-input');
    if (searchBox) {
      var searchTimer = null, lastSearch = '';
      searchBox.addEventListener('keyup', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          var q = searchBox.value.trim().toLowerCase().replace(/\s+/g, ' ');
          if (q.length < 3 || q === lastSearch || !window.goatcounter || !window.goatcounter.count) return;
          lastSearch = q;
          var none = !!document.querySelector('#search-results .search-no-result');
          window.goatcounter.count({ path: 'search: ' + q, title: none ? 'Search (no results)' : 'Search', event: true });
        }, 2000);
      });
    }

    // ---- Small screens: when the menu opens, show the current page in it
    var sideNav = document.getElementById('site-nav');
    var menuButton = document.getElementById('menu-button');
    if (sideNav && menuButton) {
      menuButton.addEventListener('click', function () {
        setTimeout(function () {
          var current = sideNav.querySelector('.kf-nav a:not([href]), .kf-nav a.active');
          if (!current || !sideNav.classList.contains('nav-open')) return;
          var top = current.getBoundingClientRect().top - sideNav.getBoundingClientRect().top + sideNav.scrollTop;
          sideNav.scrollTop = Math.max(0, top - sideNav.clientHeight / 2);
        }, 0);
      });
    }

    // ---- Small screens: close the menu when a link is chosen or Escape is pressed
    var nav = document.getElementById('site-nav');
    var menuBtn = document.getElementById('menu-button');
    function closeMenu() {
      if (nav && nav.classList.contains('nav-open') && menuBtn) menuBtn.click();
    }
    if (nav) {
      nav.addEventListener('click', function (e) { if (e.target.closest('a[href]')) closeMenu(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
      // tapping outside the open menu closes it
      document.addEventListener('click', function (e) {
        if (nav.classList.contains('nav-open') && !nav.contains(e.target) && !(menuBtn && menuBtn.contains(e.target))) closeMenu();
      });
    }
  });
})();
