// @ts-check

// frmwrk =============================
const $$ =
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

$$.listeners = new WeakMap();
$$.on = (el, event, listener) => {
  if (!$$.listeners.has(el)) {
    $$.listeners.set(el, []);
  }
  $$.listeners.get(el).push({ event, listener });
  el.addEventListener(event, listener);
};
$$.off = (el) => {
  if (!$$.listeners.has(el)) {
    return;
  }
  $$.listeners.get(el).map((l) => {
    el.removeEventListener(l.event, l.listener);
  });
};
$$.outline = (el, on) => {
  el.style.outline = on ? `1px solid #fe9` : "none";
};

$$.canvas = {
  /**
   *
   * @param {HTMLElement} el
   * @returns {CanvasRenderingContext2D}
   */
  cover: (el) => {
    $$(el)("canvas", (canvas) => canvas.remove());
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
  },
  start: (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
  },
  render: (ctx, record) => {
    if (record[1] === 0) {
      ctx.moveTo(record[2], record[3]);
    } else {
      ctx.lineTo(record[2], record[3]);
      ctx.stroke();
    }
  },
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

STORE.DRAWING_FREQUENCY = 20;

function play() {
  $$()(".timely-tutor section.tt-highlight", (section) => {
    const $section = $$(section);
    const article = $section("article")[0];
    article.innerHTML = STORE.rec0;
    const $article = $$(article);

    /** @type {HTMLAudioElement} */
    // @ts-ignore
    const audioElement = $section("audio")[0];
    let lastProgress = 0;
    $$.on(audioElement, "play", (e) => {
      lastProgress = 0;
      $article(".tt-active", (el) => {
        el.classList.remove("tt-active");
      });
    });
    $$.on(audioElement, "timeupdate", (e) => {
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

  $$()(".timely-tutor section.tt-draw", (section) => {
    const $section = $$(section);
    const ctx = $$.canvas.cover($section("article")[0]);
    /** @type {Array<Array<number>>} */
    const rec = STORE.rec1;
    let index = 0;

    /** @type {HTMLAudioElement} */
    // @ts-ignore
    const audioElement = $section("audio")[0];
    let lastProgress = 0;
    $$.on(audioElement, "play", (e) => {
      lastProgress = 0;
      index = 0;
      $$.canvas.start(ctx);
    });
    $$.on(audioElement, "timeupdate", (e) => {
      const progress = Math.floor(
        audioElement.currentTime * STORE.DRAWING_FREQUENCY
      );
      if (progress === lastProgress) return;
      while (index < rec.length && progress > rec[index][0]) {
        $$.canvas.render(ctx, rec[index]);
        index++;
      }
    });
  });
}
play();
