// @ts-check

const SERVER = `<<<SERVER>>>`;

function build() {
  $$()(".timely-tutor", (tutor) => {
    tutor.style.borderTop = "10px solid #fe9";
    $$(tutor)("audio", (audio) => {
      $$.off(audio);
    });
  });
  $$()(".timely-tutor section.tt-highlight", (section) => {
    const $section = $$(section);
    /** @type {HTMLAudioElement} */
    // @ts-ignore
    const audioElement = $section("audio")[0];
    const article = $section("article")[0];
    const $article = $$(article);

    $$.on(article, "click", (e) => {
      const progress = Math.floor(audioElement.currentTime);
      if (e.target.classList.contains(`tt-active`)) {
        e.target.classList.remove(`tt-active`);
        e.target.classList.add(`tt-end-${progress}`);
      } else {
        e.target.classList.add(`tt-start-${progress}`, "tt-active");
      }
    });

    $$.on(audioElement, "ended", (e) => {
      $$.off(article);
      $$.off(audioElement);
      $article(".tt-active", (el) => {
        el.classList.remove("tt-active");
      });
      const rec = article.innerHTML;
      // put rec in clipboard
      navigator.clipboard.writeText(rec);
      STORE.rec0 = rec;
    });
  });
  $$()(".timely-tutor section.tt-draw", (section) => {
    const $section = $$(section);
    const recording = [];
    let prevXY;

    /** @type {HTMLAudioElement} */
    // @ts-ignore
    const audioElement = $section("audio")[0];
    const article = $section("article")[0];
    let ctx;

    const record = (action, e) => {
      const progress = Math.floor(
        audioElement.currentTime * STORE.DRAWING_FREQUENCY
      );
      // get cursor dimensions relative to article
      const x = e.offsetX;
      const y = e.offsetY;
      if (prevXY === `${x},${y}`) return;
      prevXY = `${x},${y}`;
      const re = [progress, action, x, y];
      $$.canvas.render(ctx, re);
      recording.push(re);
    };

    $$.on(audioElement, "play", (e) => {
      ctx = $$.canvas.cover(article);
      article.style.cursor = "crosshair";
      $$.outline(article, 1);
    });

    let painting = false;
    $$.on(article, "mousedown", (e) => {
      record(0, e);
      painting = true;
    });
    $$.on(article, "mouseup", (e) => {
      painting = false;
    });
    $$.on(article, "mousemove", (e) => {
      if (!painting) return;
      record(1, e);
    });

    $$.on(audioElement, "ended", (e) => {
      STORE.rec1 = recording;
      article.style.cursor = "auto";
      $$.outline(article, 0);
      $$.off(article);
      $$.off(audioElement);
    });
  });
}
