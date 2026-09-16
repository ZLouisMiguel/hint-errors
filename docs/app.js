/* ==========================================================================
   hint-errors — site behavior
   No build step, no runtime dependencies — matches the package it documents.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
   * Shared hint data
   * Mirrors the real, ordered `hints` array in src/hints.js. Used by both
   * the Error Gallery section and the "try it" playground below it, so the
   * two are guaranteed to show the same thing. If src/hints.js changes,
   * update this array to match — it is not a live import of the package.
   * ------------------------------------------------------------------ */
  var HINTS_DATA = [
    {
      category: "TypeError",
      entries: [
        {
          match: "Cannot read properties of undefined",
          hint: "You're trying to access a property on something that doesn't exist yet.\nCheck that the value is defined before you use it — a quick console.log\njust above the error line will show you what it actually is.",
        },
        {
          match: "Cannot read properties of null",
          hint: "The value you're reading from is null, not just undefined.\nThis usually means something that was supposed to return data returned null instead.\nCheck where that value comes from and whether it can ever be null.",
        },
        {
          match: "x.y is not a function",
          hint: "You're calling something as a function, but it isn't one at that point.\nThis could mean: you imported the wrong thing, the function name is misspelled,\nor the variable was overwritten somewhere before this line.",
        },
        {
          match: "Cannot set properties of undefined",
          hint: "You're trying to assign a property to something that doesn't exist.\nMake sure the object is initialized before you try to write to it.",
        },
        {
          match: "Cannot set properties of null",
          hint: "You're trying to assign a property to null.\nTrace back where this value comes from — something returned null that should have returned an object.",
        },
        {
          match: "Converting circular structure to JSON",
          hint: "You're passing an object that references itself into JSON.stringify().\nThis often happens with objects that have parent/child references.\nConsider using a replacer function, or a library like flatted.",
        },
        {
          match: "arr.map is not a function",
          hint: "You're calling an array method on something that isn't an array.\nThe value is likely undefined, null, or a different type entirely.\nAdd a console.log on the value just before this line to see what it actually is.",
        },
        {
          match: "promise.then is not a function",
          hint: "You're calling .then() on something that isn't a Promise.\nThe function you're awaiting probably isn't returning a Promise.\nCheck that the function is async or explicitly returns a Promise.",
        },
        {
          match: "Cannot destructure property 'name' of 'user'",
          hint: "You're trying to destructure a value that is null or undefined.\nFor example: const { name } = user — if user is undefined, this crashes.\nMake sure the value exists before you destructure it.",
        },
        {
          match: "obj is not iterable",
          hint: "You're trying to loop over or spread something that can't be iterated.\nThis usually means the value is null, undefined, or a plain object instead of an array.\nCheck what the value actually is before trying to iterate it.",
        },
        {
          match: "Cannot assign to read only property 'x'",
          hint: "You're trying to modify a property that has been marked as read-only.\nThis can happen with frozen objects (Object.freeze), constants, or\nproperties defined with writable: false via Object.defineProperty.",
        },
        {
          match: "Right-hand side of 'instanceof' is not callable",
          hint: "The value on the right of instanceof isn't a constructor or class.\nIt's likely undefined or was never exported/imported correctly.\nCheck your imports at the top of the file.",
        },
        {
          match: "Class constructor Foo cannot be invoked without 'new'",
          hint: "You're calling a class constructor without the 'new' keyword.\nChange your call from MyClass() to new MyClass().",
        },
      ],
    },
    {
      category: "ReferenceError",
      entries: [
        {
          match: "window is not defined",
          hint: "'window' is a browser-only global — it doesn't exist in Node.js.\nIf you're using a library that requires a browser environment, look for\na Node.js-compatible version, or guard the code with: if (typeof window !== 'undefined').",
        },
        {
          match: "document is not defined",
          hint: "'document' is a browser-only global — it doesn't exist in Node.js.\nYou're likely running browser-targeted code in a Node environment.\nIf you need DOM functionality in Node, consider using a library like jsdom.",
        },
        {
          match: "localStorage is not defined",
          hint: "'localStorage' is a browser-only API — it doesn't exist in Node.js.\nIf you need persistent storage in Node, use the fs module, a database,\nor a package like node-localstorage.",
        },
        {
          match: "fetch is not defined",
          hint: "'fetch' is not available in older versions of Node.js (below v18).\nIf you're on Node 18+, make sure you're not in a context where it's unavailable.\nOtherwise, install a polyfill like node-fetch: npm install node-fetch.",
        },
        {
          match: "myVariable is not defined",
          hint: "You're using a variable or function that hasn't been declared yet.\nCheck for typos in the name, make sure it's in scope, and that the\nfile or module it lives in has been imported correctly.",
        },
      ],
    },
    {
      category: "SyntaxError",
      entries: [
        {
          match: "Unexpected token",
          hint: "Node hit something it didn't expect while reading your code.\nThis is usually a missing bracket, comma, or parenthesis somewhere nearby.\nCheck the line above the one reported — the real mistake is often one line up.",
        },
        {
          match: "Unexpected end of input",
          hint: "Your code ends before it should — something was opened but never closed.\nLook for an unclosed bracket {}, parenthesis (), or array [].",
        },
        {
          match: "Invalid or unexpected token",
          hint: "There's a character in your code that doesn't belong there.\nA common cause is a stray symbol, a smart quote instead of a regular quote,\nor a copy-paste from a source that included hidden characters.",
        },
        {
          match: "Unexpected identifier",
          hint: "Node found a word where it didn't expect one.\nThis is usually a missing comma between items, a forgotten operator,\nor a keyword used in the wrong place.",
        },
        {
          match: "Cannot use import statement outside a module",
          hint: 'You\'re using ES module syntax (import/export) but Node is treating your file as CommonJS.\nEither rename the file to .mjs, add "type": "module" to your package.json,\nor switch to CommonJS syntax: const x = require(\'x\').',
        },
        {
          match: "require is not defined",
          hint: 'You\'re using require() inside an ES module.\nYour package.json likely has "type": "module" set.\nEither switch to import syntax, or rename the file to .cjs.',
        },
      ],
    },
    {
      category: "RangeError",
      entries: [
        {
          match: "Maximum call stack size exceeded",
          hint: "Your code is calling itself too many times — this is infinite recursion.\nA function is calling itself (directly or indirectly) with no exit condition.\nCheck your recursive function for a base case that actually stops the loop.",
        },
        {
          match: "Invalid array length",
          hint: "You're trying to create an array with an invalid length.\nArray lengths must be a non-negative integer — check the value you're passing in.",
        },
        {
          match: "Invalid time value",
          hint: "You're creating a Date object with a value that can't be parsed.\nCheck the string or number you're passing to new Date() — it may be null,\nundefined, or in a format that JavaScript doesn't recognize.",
        },
        {
          match: "toFixed() digits argument must be between 0 and 100",
          hint: "The number you passed to .toFixed() is out of range.\ntoFixed() only accepts a number between 0 and 100.",
        },
      ],
    },
    {
      category: "URIError & AssertionError",
      entries: [
        {
          match: "URI malformed",
          hint: "You passed an invalid URI to encodeURIComponent, decodeURIComponent, or a similar function.\nA common cause is a stray % character that isn't part of a valid percent-encoded sequence.\nMake sure the string is a valid URI before decoding it.",
        },
        {
          match: "AssertionError",
          hint: "An assertion in your code failed — two values that were expected to be equal weren't.\nCheck the values being compared in your assert() call.\nIf this is in a test, the output above should tell you what was expected vs what was received.",
        },
        {
          match: "Expected values to be strictly equal",
          hint: 'An assertion failed because the two values aren\'t strictly equal (===).\nCheck the types as well as the values — 1 and "1" are not strictly equal.',
        },
      ],
    },
    {
      category: "Node & OS errors",
      entries: [
        {
          match: "ENOENT: no such file or directory",
          hint: "The file or folder you're pointing to doesn't exist at that path.\nDouble-check the path is correct, and remember — paths are relative to where\nyour script is running from, not necessarily where the file lives.",
        },
        {
          match: "EACCES: permission denied",
          hint: "Your process doesn't have permission to access that file or directory.\nTry checking the file's permissions, or if you're on Linux/Mac run: ls -la <path>\nOn Windows, try running your terminal as Administrator.",
        },
        {
          match: "EPERM: operation not permitted",
          hint: "The operation was blocked by the operating system — likely a permissions issue.\nOn Windows this often means a file is locked by another process (your editor, antivirus, or a running server).\nTry closing other programs, or run your terminal as Administrator.",
        },
        {
          match: "EEXIST: file already exists",
          hint: "You're trying to create a file or directory that already exists.\nCheck if it exists first before creating it, or use a flag like { flag: 'w' }\nto overwrite it if that's your intention.",
        },
        {
          match: "EISDIR: illegal operation on a directory",
          hint: "You're trying to perform a file operation on a directory.\nCheck your path — it's pointing to a folder, not a file.\nUse fs.readdir() if you meant to read a directory's contents.",
        },
        {
          match: "ENOTDIR: not a directory",
          hint: "You're trying to perform a directory operation on a file.\nCheck your path — it's pointing to a file, not a folder.",
        },
        {
          match: "ENOTEMPTY: directory not empty",
          hint: "You're trying to delete a directory that still has files in it.\nUse fs.rmSync(path, { recursive: true }) to remove it and all its contents,\nbut be careful — this is irreversible.",
        },
        {
          match: "EMFILE: too many open files",
          hint: "Your app has opened more files than the operating system allows at once.\nMake sure you're closing files after reading or writing them.\nOn Linux/Mac you can raise the limit temporarily with: ulimit -n 4096",
        },
        {
          match: "EADDRINUSE: address already in use :::3000",
          hint: "The port you're trying to listen on is already being used by something else.\nTry a different port, or find and stop the process using it.\nOn Mac/Linux: lsof -i :<port>  |  On Windows: netstat -ano | findstr :<port>",
        },
        {
          match: "EADDRNOTAVAIL",
          hint: "The address you're trying to bind to isn't available on this machine.\nThis usually means you're trying to listen on a specific IP that doesn't exist on this system.\nTry using 0.0.0.0 or localhost instead.",
        },
        {
          match: "MODULE_NOT_FOUND",
          hint: "Node can't find the module you're trying to import.\nCheck that the package is installed (npm install <package>), the name is spelled\ncorrectly, and the file path is right if it's a local module.",
        },
      ],
    },
    {
      category: "Network errors",
      entries: [
        {
          match: "ECONNREFUSED",
          hint: "Your app tried to connect to a server but the connection was refused.\nThe most common reason is that the target server isn't running.\nCheck that your database, API server, or service is actually started and listening on the right port.",
        },
        {
          match: "ECONNRESET",
          hint: "The connection was forcibly closed by the other side before it finished.\nThis often happens with unstable network conditions, server timeouts, or a server that crashed mid-response.\nConsider adding retry logic or checking the stability of the remote service.",
        },
        {
          match: "ETIMEDOUT",
          hint: "The connection timed out — the remote server didn't respond in time.\nThis can be caused by a slow server, a firewall blocking the connection, or the server being overloaded.\nCheck your timeout settings and whether the remote host is reachable.",
        },
        {
          match: "EPIPE: broken pipe",
          hint: "You're trying to write data to a connection that has already been closed.\nThis often happens in HTTP servers when the client disconnects before the response finishes.\nMake sure you're checking if the connection is still open before writing.",
        },
        {
          match: "EAI_AGAIN",
          hint: "DNS lookup failed — the hostname couldn't be resolved.\nThis usually means you're offline, the hostname is wrong, or your DNS server is unreachable.\nDouble-check the URL and your network connection.",
        },
        {
          match: "EHOSTUNREACH",
          hint: "The host is unreachable — there's no network route to the target address.\nCheck that the IP or hostname is correct and that your machine can reach that network.",
        },
      ],
    },
  ];

  var GENERIC_FALLBACK =
    'Double-check the line where this occurred and inspect the values involved\nwith console.log. The error type "Error" usually means something\nisn\'t what you expected it to be at that point in the code.';

  /* ------------------------------ theme ------------------------------ */
  var root = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", function () {
    var current = root.getAttribute("data-theme");
    var next = current === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("hint-errors-theme", next);
  });

  /* --------------------------- mobile sidebar ------------------------- */
  var sidebar = document.getElementById("sidebar");
  var menuToggle = document.getElementById("menuToggle");
  var scrim = document.getElementById("sidebarScrim");

  function openSidebar() {
    sidebar.classList.add("open");
    scrim.classList.add("show");
    menuToggle.setAttribute("aria-expanded", "true");
  }
  function closeSidebar() {
    sidebar.classList.remove("open");
    scrim.classList.remove("show");
    menuToggle.setAttribute("aria-expanded", "false");
  }
  menuToggle.addEventListener("click", function () {
    sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
  });
  scrim.addEventListener("click", closeSidebar);
  sidebar.querySelectorAll("a[data-nav]").forEach(function (a) {
    a.addEventListener("click", closeSidebar);
  });

  /* ------------------------ active section tracking -------------------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".sidebar a[data-nav]"),
  );
  var sections = navLinks
    .map(function (a) {
      return document.getElementById(a.getAttribute("href").slice(1));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var currentActive = null;
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    sections.forEach(function (s) {
      observer.observe(s);
    });

    function setActive(id) {
      if (currentActive === id) return;
      currentActive = id;
      navLinks.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
      });
    }
  }

  /* ------------------------------- tabs -------------------------------- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var tabs = Array.prototype.slice.call(
      group.querySelectorAll('[role="tab"]'),
    );
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activateTab(tab);
      });
      tab.addEventListener("keydown", function (e) {
        var idx = tabs.indexOf(tab);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          tabs[(idx + 1) % tabs.length].focus();
          activateTab(tabs[(idx + 1) % tabs.length]);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          tabs[(idx - 1 + tabs.length) % tabs.length].focus();
          activateTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
        }
      });
    });
    function activateTab(tab) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
    }
  });

  /* ------------------------------ carousel ------------------------------- */
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var viewport = root.querySelector(".carousel-viewport");
    var track = root.querySelector("[data-carousel-track]");
    var prevBtn = root.querySelector("[data-carousel-prev]");
    var nextBtn = root.querySelector("[data-carousel-next]");
    var originalCards = Array.prototype.slice.call(track.children);
    var cardCount = originalCards.length;
    if (!cardCount) return;

    var reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Clone the full set once so the track can scroll past the "end" of the
    // original cards into an identical clone, then jump back by exactly one
    // set-width with no visible seam — a standard infinite-marquee trick.
    originalCards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("[id]").forEach(function (el) {
        el.removeAttribute("id");
      });
      track.appendChild(clone);
    });

    var offset = 0; // current scroll offset in px
    var setWidth = 0; // width of one full set of cards (incl. gaps)
    var cardStep = 0; // width of one card + gap, for prev/next jumps
    var playing = !reduceMotion;
    var dragging = false;
    var dragStartX = 0;
    var dragStartOffset = 0;
    var resumeTimer = null;
    var rafId = null;
    var lastFrameTime = null;
    var SPEED = 28; // px per second, slow and readable
    var RESUME_DELAY = 2200;

    function measure() {
      var gap = parseFloat(getComputedStyle(track).gap) || 0;
      var cardWidth = originalCards[0].getBoundingClientRect().width;
      cardStep = cardWidth + gap;
      setWidth = cardStep * cardCount;
    }

    function applyOffset() {
      track.style.transform = "translateX(" + -offset + "px)";
    }

    function wrap() {
      if (setWidth <= 0) return;
      // Keep offset within [0, setWidth) so it can run indefinitely in
      // either direction without ever needing a big jump.
      offset = ((offset % setWidth) + setWidth) % setWidth;
    }

    function tick(now) {
      if (lastFrameTime === null) lastFrameTime = now;
      var dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      if (playing && !dragging) {
        offset += SPEED * dt;
        wrap();
        applyOffset();
      }
      rafId = requestAnimationFrame(tick);
    }

    function pause() {
      playing = false;
      if (resumeTimer) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    }

    function scheduleResume() {
      if (reduceMotion) return;
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () {
        playing = true;
        lastFrameTime = null;
      }, RESUME_DELAY);
    }

    function step(direction) {
      pause();
      offset += direction * cardStep;
      wrap();
      track.style.transition =
        "transform 0.35s " +
          getComputedStyle(document.documentElement)
            .getPropertyValue("--ease")
            .trim() || "ease";
      applyOffset();
      window.setTimeout(function () {
        track.style.transition = "";
      }, 380);
      scheduleResume();
    }

    prevBtn.addEventListener("click", function () {
      step(-1);
    });
    nextBtn.addEventListener("click", function () {
      step(1);
    });

    viewport.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    });

    // Hover / focus pause
    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", scheduleResume);
    root.addEventListener("focusin", pause);
    root.addEventListener("focusout", scheduleResume);

    // Drag / swipe (pointer events cover mouse + touch + pen)
    track.addEventListener("pointerdown", function (e) {
      dragging = true;
      pause();
      track.classList.add("dragging");
      dragStartX = e.clientX;
      dragStartOffset = offset;
      track.setPointerCapture(e.pointerId);
      track.style.transition = "";
    });
    track.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragStartX;
      offset = dragStartOffset - dx;
      wrap();
      applyOffset();
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("dragging");
      try {
        track.releasePointerCapture(e.pointerId);
      } catch (err) {}
      scheduleResume();
    }
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("touchstart", pause, { passive: true });

    window.addEventListener(
      "resize",
      debounceCarousel(function () {
        measure();
        wrap();
        applyOffset();
      }, 150),
    );

    function debounceCarousel(fn, wait) {
      var t;
      return function () {
        clearTimeout(t);
        var args = arguments;
        t = setTimeout(function () {
          fn.apply(null, args);
        }, wait);
      };
    }

    // Initial measure needs layout to settle first.
    requestAnimationFrame(function () {
      measure();
      applyOffset();
      rafId = requestAnimationFrame(tick);
    });
  });

  /* ---------------------------- copy buttons ---------------------------- */
  document.querySelectorAll(".copy-btn[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        var label = btn.querySelector(".copy-label");
        var original = label ? label.textContent : btn.textContent;
        btn.setAttribute("data-copied", "true");
        if (label) label.textContent = "Copied";
        else btn.lastChild.textContent = "Copied";
        setTimeout(function () {
          btn.removeAttribute("data-copied");
          if (label) label.textContent = original;
          else btn.lastChild.textContent = original;
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
  });

  /* ------------------------------ gallery ------------------------------- */
  var galleryRoot = document.getElementById("galleryRoot");
  var galleryMeta = document.getElementById("galleryMeta");
  var galleryEmpty = document.getElementById("galleryEmpty");
  var galleryFilter = document.getElementById("galleryFilter");

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  var totalEntries = 0;
  HINTS_DATA.forEach(function (group) {
    var section = document.createElement("div");
    section.className = "category-group";
    section.setAttribute("data-category", group.category);

    var heading = document.createElement("h3");
    heading.textContent = group.category;
    section.appendChild(heading);

    var grid = document.createElement("div");
    grid.className = "gallery-grid";

    group.entries.forEach(function (entry) {
      totalEntries++;
      var card = document.createElement("div");
      card.className = "gallery-card";
      card.setAttribute(
        "data-search",
        (entry.match + " " + entry.hint).toLowerCase(),
      );
      card.innerHTML =
        '<div class="g-match">' +
        escapeHtml(entry.match) +
        "</div>" +
        '<div class="g-hint">' +
        escapeHtml(entry.hint) +
        "</div>";
      grid.appendChild(card);
    });

    section.appendChild(grid);
    galleryRoot.appendChild(section);
  });

  galleryMeta.textContent = totalEntries + " shown of 40+ total patterns.";

  galleryFilter.addEventListener("input", function () {
    var q = galleryFilter.value.trim().toLowerCase();
    var visibleCount = 0;
    galleryRoot.querySelectorAll(".category-group").forEach(function (group) {
      var groupHasVisible = false;
      group.querySelectorAll(".gallery-card").forEach(function (card) {
        var match = !q || card.getAttribute("data-search").indexOf(q) !== -1;
        card.classList.toggle("hidden", !match);
        if (match) {
          groupHasVisible = true;
          visibleCount++;
        }
      });
      group.style.display = groupHasVisible ? "" : "none";
    });
    galleryEmpty.classList.toggle("show", visibleCount === 0);
    galleryMeta.textContent = q
      ? visibleCount +
        " matching " +
        (visibleCount === 1 ? "pattern" : "patterns")
      : totalEntries + " shown of 40+ total patterns.";
  });

  /* ----------------------------- playground ------------------------------ */
  var pgInput = document.getElementById("pgInput");
  var pgResult = document.getElementById("pgResult");
  var allEntries = HINTS_DATA.reduce(function (acc, g) {
    return acc.concat(g.entries);
  }, []);

  function findHint(message) {
    var lower = message.toLowerCase();
    for (var i = 0; i < allEntries.length; i++) {
      if (
        lower.indexOf(allEntries[i].match.toLowerCase().split(":")[0]) !== -1
      ) {
        return allEntries[i].hint;
      }
    }
    return GENERIC_FALLBACK;
  }

  function renderPlayground() {
    var message = pgInput.value.trim() || "some exotic thing went sideways";
    var hint = findHint(message);
    pgResult.innerHTML =
      '<div class="term-window"><div class="term-titlebar"><div class="term-dots"><span></span><span></span><span></span></div><span class="term-title">hint-errors</span></div>' +
      '<div class="term-body hint-block"><dl>' +
      '<dt>error</dt><dd class="v-error">Error</dd>' +
      '<dt>message</dt><dd class="v-message">' +
      escapeHtml(message) +
      "</dd>" +
      '<dt>hint</dt><dd class="v-hint">' +
      escapeHtml(hint) +
      "</dd>" +
      "</dl></div></div>";
  }
  pgInput.addEventListener("input", debounce(renderPlayground, 150));
  renderPlayground();

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments,
        ctx = this;
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }
})();
