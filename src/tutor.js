// @ts-check

// frmwrk =============================
const $ =
  /**
   * @param {Element|Document} dom
   */


    (dom = document) =>
    /**
     * @param {string} selector
     * @param {*} [action]
     * @returns {HTMLElement[]}
     */
    (selector, action) => {
      const d = Array.from(dom.querySelectorAll(selector));
      // @ts-ignore
      return action ? d.map(action) : d;
    };

const $$ = $();

const $$listeners = new WeakMap();
const $$on = (el, event, listener) => {
  if (!$$listeners.has(el)) {
    $$listeners.set(el, []);
  }
  $$listeners.get(el).push({ event, listener });
  el.addEventListener(event, listener);
};
const $$off = (el) => {
  if (!$$listeners.has(el)) {
    return;
  }
  $$listeners.get(el).map((l) => {
    el.removeEventListener(l.event, l.listener);
  });
};
/**
 *
 * @param {HTMLElement} el
 * @returns {CanvasRenderingContext2D}
 */
const $$cover = (el) => {
  const canvas = document.createElement("canvas");
  canvas.width = el.clientWidth;
  canvas.height = el.clientHeight;
  el.style.position = "relative";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  el.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");
  return ctx;
};

/** @type {any} */
const STORE = new Proxy(
  {},
  {
    has: (target, prop) => {
      return localStorage.getItem(prop.toString()) !== null;
    },
    get: (target, prop) => {
      const value = localStorage.getItem(prop.toString());
      if (value) {
        return JSON.parse(value);
      }
    },
    set: (target, prop, value) => {
      localStorage.setItem(prop.toString(), JSON.stringify(value));
      return true;
    },
  }
);
// frmwrk =============================

const DRAWING_FREQUENCY = 20;

function play() {
  $$(".timely-tutor section.tt-highlight", (section) => {
    const $section = $(section);
    const article = $section("article")[0];
    article.innerHTML = STORE.rec0;
    const $article = $(article);

    /** @type {HTMLAudioElement} */
    // @ts-ignore
    const audioElement = $section("audio")[0];
    let lastProgress = 0;
    $$on(audioElement, "play", (e) => {
      lastProgress = 0;
      $article(".tt-active", (el) => {
        el.classList.remove("tt-active");
      });
    });
    $$on(audioElement, "timeupdate", (e) => {
      // get audio progress in seconds
      const progress = Math.floor(audioElement.currentTime);
      if (progress === lastProgress) return;
      if (progress - lastProgress === 1) {
        lastProgress = progress;
        $article(`.tt-start-${progress}`, (el) => {
          el.classList.add("tt-active");
        });
        $article(`.tt-end-${progress}`, (el) => {
          el.classList.remove("tt-active");
        });
      } else {
        console.error("progress reporting too slow");
      }
    });
  });

  $$(".timely-tutor section.tt-draw", (section) => {
    const $section = $(section);
    const ctx = $$cover($section("article")[0]);
    /** @type {Array<Array<number>>} */
    const rec = [...STORE.rec1];

    /** @type {HTMLAudioElement} */
    // @ts-ignore
    const audioElement = $section("audio")[0];
    let lastProgress = 0;
    $$on(audioElement, "play", (e) => {
      lastProgress = 0;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
    });
    $$on(audioElement, "timeupdate", (e) => {
      // get audio progress in tenth seconds
      const progress = Math.floor(audioElement.currentTime * DRAWING_FREQUENCY);
      if (progress === lastProgress) return;
      while (rec.length && progress > rec[rec.length - 1][0]) {
        const current = rec.pop() || [];
        if (current[1] === 0) {
          ctx.moveTo(current[2], current[3]);
        } else {
          ctx.lineTo(current[2], current[3]);
          ctx.stroke();
        }
      }
    });
  });
}

function build() {
  $$(".timely-tutor section.tt-highlight", (section) => {
    const $section = $(section);
    /** @type {HTMLAudioElement} */
    // @ts-ignore
    const audioElement = $section("audio")[0];
    const article = $section("article")[0];
    const $article = $(article);

    $$on(article, "click", (e) => {
      const progress = Math.floor(audioElement.currentTime);
      if (e.target.classList.contains(`tt-active`)) {
        e.target.classList.remove(`tt-active`);
        e.target.classList.add(`tt-end-${progress}`);
      } else {
        e.target.classList.add(`tt-start-${progress}`, "tt-active");
      }
    });

    $$on(audioElement, "ended", (e) => {
      $$off(article);
      $$off(audioElement);
      $article(".tt-active", (el) => {
        el.classList.remove("tt-active");
      });
      const rec = article.innerHTML;
      // put rec in clipboard
      navigator.clipboard.writeText(rec);
      STORE.rec0 = rec;
    });
  });
  $$(".timely-tutor section.tt-draw", (section) => {
    const $section = $(section);
    const recording = [];
    let prevXY;
    const record = (action, e) => {
      const progress = Math.floor(audioElement.currentTime * DRAWING_FREQUENCY);
      // get cursor dimensions relative to article
      const x = e.clientX - article.offsetLeft;
      const y = e.clientY - article.offsetTop;
      if (prevXY === `${x},${y}`) return;
      prevXY = `${x},${y}`;
      recording.push([progress, action, x, y]);
    };
    /** @type {HTMLAudioElement} */
    // @ts-ignore
    const audioElement = $section("audio")[0];
    const article = $section("article")[0];

    let painting = false;
    $$on(article, "mousedown", (e) => {
      record(0, e);
      painting = true;
    });
    $$on(article, "mouseup", (e) => {
      painting = false;
    });
    $$on(article, "mousemove", (e) => {
      if (!painting) return;
      record(1, e);
    });

    $$on(audioElement, "ended", (e) => {
      STORE.rec1 = recording.reverse();
      $$off(article);
      $$off(audioElement);
    });
  });
}

if (window.location.hash === "#build") {
  build();
} else {
  play();
}
