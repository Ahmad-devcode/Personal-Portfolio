# Ahmad Raza — Portfolio

Professional portfolio website for Ahmad Raza, freelance React & Front-End Web Developer from Bahawalnagar, Pakistan.

Design: dark OLED theme with lime accent, modelled on the structure of
[alisfolio.vercel.app](https://alisfolio.vercel.app/) — hero with terminal card,
marquee strip, selected work, services, stack, process, stats, experience,
contact — plus a theme switcher dock (5 themes) and a floating WhatsApp button.

## Files

- `index.html` — all content and structure
- `styles.css` — all styling, themes, responsive layout
- `script.js` — typewriter roles, theme switcher, constellation canvas,
  spotlight hovers, count-up stats, live Pakistan clock, contact form (mailto)
- `tour.js` — **v4 3D tour**: the whole site becomes a walk-through 3D gallery
  (Three.js, loaded from CDN). Hero first, then every section is a room —
  About, Work (9 project frames), Services, Stack, Process, Stats, Experience
  & Education, Contact. Scroll / drag / arrow keys walk you through the rooms;
  click any frame to open that section's full details. All content is read
  from the page itself, so the classic site below stays the single source of
  truth — and "Classic view" switches back to it. If WebGL or the CDN is
  unavailable, the site simply stays classic.
- `images/ahmad.jpg` — hero portrait (720x720)
- `images/og-image.png` — link-preview image (1200x630)
- `Ahmad_Raza_CV.pdf` — downloadable CV (Web Developer version)

## Run locally

Open `index.html` in any browser. No build step, no server needed.

## Deploy

- **Netlify:** drag this whole folder into Netlify Drop, or connect the
  `Ahmad-devcode/Personal-Portfolio` GitHub repo to Netlify.
- **GitHub Pages:** push to a repo, then enable Pages (branch `main`, folder `/`).

## Contact

- WhatsApp: +92 324 0790546 — https://wa.me/923240790546
- Email: razasardar722212@gmail.com
- GitHub: https://github.com/Ahmad-devcode
- LinkedIn: https://www.linkedin.com/in/webify-design7222/
- Instagram: https://www.instagram.com/webify_design7222/
