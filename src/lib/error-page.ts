// The last-resort page when rendering fails, in the language chosen on the device (the
// cookie lib/i18n sets): Swedish unless English was chosen.
const texts = {
  sv: {
    title: "Sidan kunde inte laddas",
    text: "Något gick fel hos oss. Ladda om sidan eller gå tillbaka till startsidan.",
    tryAgain: "Försök igen",
    home: "Till startsidan",
  },
  en: {
    title: "This page didn't load",
    text: "Something went wrong on our end. You can try refreshing or head back home.",
    tryAgain: "Try again",
    home: "Go home",
  },
};

export function renderErrorPage(request?: Request): string {
  const cookie = request?.headers.get("cookie") ?? "";
  const language = /(?:^|;\s*)teachdesk-language=en(?:;|$)/.test(cookie) ? "en" : "sv";
  const t = texts[language];
  return `<!doctype html>
<html lang="${language}">
  <head>
    <meta charset="utf-8" />
    <title>${t.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${t.title}</h1>
      <p>${t.text}</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">${t.tryAgain}</button>
        <a class="secondary" href="/">${t.home}</a>
      </div>
    </div>
  </body>
</html>`;
}
