// @ts-check

const baseUrl = "<<<SERVER>>>";
function save(location, content) {
  fetch(`${baseUrl}save?location=${location}&content=${content}`);
}

function setupRec(section, { start, stop } = {}) {
  const recBtn = document.createElement("button");
  const audio = $$(section)("audio")[0];
  section.insertBefore(recBtn, audio);
  recBtn.innerText = "R";
  $$.css(recBtn, {
    borderRadius: "50%",
    color: "red",
    border: "1px solid inherit",
  });
  let t0;
  const api = {
    getTime: () => (Date.now() - t0) / 1000,
  };
  $$.on(recBtn, "click", (e) => {
    if (!t0) {
      t0 = Date.now();
      start && start(api);
      $$.css(recBtn, {
        borderRadius: "0",
        color: "black",
      });
      recBtn.innerText = "S";
      audio.play();
    } else {
      stop && stop(api);
      t0 = null;
      $$.css(recBtn, {
        borderRadius: "50%",
        color: "red",
      });
      recBtn.innerText = "R";
    }
  });
  return api;
}

function build() {
  $$()(".timely-tutor section.tt-highlight", (section) => {
    const $section = $$(section);
    const article = $section("article")[0];
    const $article = $$(article);

    setupRec(section, {
      start: (rec) => {
        $$.on(article, "click", (e) => {
          const progress = Math.floor(rec.getTime());
          if (e.target.classList.contains(`tt-active`)) {
            e.target.classList.remove(`tt-active`);
            e.target.classList.add(`tt-end-${progress}`);
          } else {
            e.target.classList.add(`tt-start-${progress}`, "tt-active");
          }
        });
      },
      stop: (rec) => {
        $$.off(article);
        $article(".tt-active", (el) => {
          el.classList.remove("tt-active");
        });
        const data = article.innerHTML;
        // put data in clipboard
        navigator.clipboard.writeText(data);
        save(`${section.id}.html`, encodeURIComponent(data));
      },
    });
  });
  $$()(".timely-tutor section.tt-draw", (section) => {
    const $section = $$(section);
    const recording = [];
    let prevXY;

    const article = $section("article")[0];

    setupRec(section, {
      start: (rec) => {
        const ctx = $$.canvas.cover(article);
        article.style.cursor = "crosshair";
        $$.outline(article, 1);

        const record = (action, e) => {
          const progress = Math.floor(rec.getTime() * DRAWING_FREQUENCY);
          // get cursor dimensions relative to article
          const x = e.offsetX;
          const y = e.offsetY;
          if (prevXY === `${x},${y}`) return;
          prevXY = `${x},${y}`;
          const re = [progress, action, x, y];
          $$.canvas.render(ctx, re);
          recording.push(re);
        };

        let painting = false;
        $$.on(article, "mousedown", (e) => {
          record(0, e);
          painting = true;
        });
        $$.on(document, "mouseup", (e) => {
          painting = false;
        });
        $$.on(article, "mousemove", (e) => {
          if (!painting) return;
          record(1, e);
        });
      },
      stop: () => {
        save(`${section.id}.json`, JSON.stringify(recording));
        article.style.cursor = "auto";
        $$.outline(article, 0);
        $$.off(article);
      },
    });
  });
}
build();
