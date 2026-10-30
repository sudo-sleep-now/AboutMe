import { useCallback, useEffect, useRef, useState } from "react";
import Signal from "./Signal";

const github = "https://github.com/sudo-sleep-now";
const external = { target: "_blank", rel: "noopener noreferrer" };

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return reduced;
}

export default function App() {
  const pageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [effects, setEffects] = useState(() => {
    try {
      return localStorage.getItem("408-effects") !== "off";
    } catch {
      return true;
    }
  });
  const [tracking, setTracking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const enabled = effects && !reduced;
  const onTracking = useCallback((value: boolean) => setTracking(value), []);

  function toggleEffects() {
    setEffects((value) => {
      try {
        localStorage.setItem("408-effects", value ? "off" : "on");
      } catch {
        /* Optional preference. */
      }
      return !value;
    });
  }

  async function copyDiscord() {
    try {
      await navigator.clipboard.writeText("sudo.sleep_");
      setCopied(true);
      setCopyStatus("Discord username copied.");
    } catch {
      setCopyStatus("Copy unavailable. Discord: sudo.sleep_");
    }
  }
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => {
      setCopied(false);
      setCopyStatus("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div
      className={`portfolio ${enabled ? "effects-enabled" : ""} ${tracking ? "tracking-spike" : ""}`}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Signal enabled={enabled} onTracking={onTracking} targetRef={pageRef} />
      <div className="page-shell" ref={pageRef}>
        <header className="site-header" id="top">
          <div className="header-top">
            <div className="identity">
              <h1>408</h1>
              <span className="alias">sudo-sleep</span>
            </div>
          </div>
          <p className="intro">Software developer, femboy &amp; hobby racer.</p>
        </header>

        <main className="layout" id="main">
          <aside className="personal" aria-label="About and contact details">
            <section id="about" aria-labelledby="about-title">
              <figure className="avatar">
                <img
                  src="./assets/avatar.jpg"
                  width="460"
                  height="460"
                  alt="My Felix Argyle avatar from GitHub"
                />
                <figcaption>They / Them</figcaption>
              </figure>
              <h2 className="section-label" id="about-title">
                About
              </h2>
              <p>
                I tend to just overthink systems, which often makes me create
                something perfect in my eyes.
              </p>
              <p className="perfectionist">Kinda a perfectionist lol.</p>
              <div className="languages">
                <h3>Languages</h3>
                <p>Lua &amp; Luau (Roblox), Rust, C++, Python.</p>
                <p>
                  Web dev too, but I kinda hate it. Assembly very rarely,
                  because it's hell.
                </p>
              </div>
            </section>
            <section
              className="contact"
              id="contact"
              aria-labelledby="contact-title"
            >
              <h2 className="section-label" id="contact-title">
                Contact
              </h2>
              <dl>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href="mailto:sudo.sleep@yahoo.com">
                      sudo.sleep@yahoo.com
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Discord</dt>
                  <dd className="discord-line">
                    <span>sudo.sleep_</span>
                    <button
                      className="copy-button"
                      type="button"
                      onClick={copyDiscord}
                      aria-label={
                        copied
                          ? "Discord username copied"
                          : "Copy Discord username"
                      }
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>GitHub</dt>
                  <dd>
                    <a href={github} {...external}>
                      sudo-sleep-now
                    </a>
                  </dd>
                </div>
              </dl>
              <p
                className="copy-status"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {copyStatus}
              </p>
            </section>
          </aside>

          <section className="work" id="work" aria-labelledby="work-title">
            <h2 className="section-label" id="work-title">
              Projects
            </h2>
            <article className="project pelagic">
              <header className="project-heading">
                <h3>Pelagic</h3>
                <p className="project-meta">JavaScript · Three.js</p>
              </header>
              <p className="project-aside">Cool ocean project, I guess.</p>
              <div className="pelagic-preview">
                <a
                  className="ocean-image"
                  href="https://sudo-sleep-now.github.io/Pelagic/"
                  {...external}
                  aria-label="Open the live Pelagic ocean simulation"
                >
                  <img
                    src="./assets/pelagic.jpg"
                    width="1280"
                    height="720"
                    alt="Pelagic's ocean simulation, with ships crossing the water"
                    fetchPriority="high"
                  />
                </a>
                <div className="project-bottom">
                  <p>
                    An ocean simulation with changing weather, passing ships,
                    and marine life.
                  </p>
                  <div className="project-links">
                    <a
                      href="https://sudo-sleep-now.github.io/Pelagic/"
                      {...external}
                    >
                      Live demo
                    </a>
                    <a href={`${github}/Pelagic`} {...external}>
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            </article>
            <article className="project waffles">
              <div className="waffles-name">
                <div className="waffles-title">
                  <img
                    className="waffle-icon"
                    src="./assets/waffle.svg"
                    width="44"
                    height="44"
                    alt=""
                  />
                  <h3>Waffles</h3>
                </div>
                <p className="project-meta">Luau · Roblox</p>
              </div>
              <div className="waffles-body">
                <p>
                  Binary serialization for Roblox. Packs Luau values into native
                  buffers, with schemas and guarded decoders.
                </p>
                <p className="dependency-note">No runtime dependencies.</p>
                <div className="project-links">
                  <a href={`${github}/Waffles`} {...external}>
                    GitHub
                  </a>
                  <a href={`${github}/Waffles#readme`} {...external}>
                    Documentation
                  </a>
                </div>
              </div>
            </article>
          </section>
        </main>
        <footer className="site-footer">
          <button
            className="effects-toggle"
            type="button"
            onClick={toggleEffects}
            aria-pressed={enabled}
            aria-label={
              reduced
                ? "Visual effects disabled by reduced motion preference"
                : enabled
                  ? "Pause visual effects"
                  : "Enable visual effects"
            }
            disabled={reduced}
          >
            {reduced
              ? "Reduced motion"
              : enabled
                ? "Pause effects"
                : "Enable effects"}
          </button>
        </footer>
      </div>
    </div>
  );
}
