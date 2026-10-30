import { useEffect, useRef, type RefObject } from "react";

type Props = {
  enabled: boolean;
  onTracking: (tracking: boolean) => void;
  targetRef: RefObject<HTMLDivElement | null>;
};

type Dropout = {
  x: number;
  y: number;
  width: number;
  expires: number;
  strength: number;
};
const displacementScale = 8;

/** Tape behavior is kept outside React's render loop and never receives input. */
export default function Signal({ enabled, onTracking, targetRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signalRef = useRef<HTMLDivElement>(null);
  const eyeRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<SVGFEImageElement>(null);
  const lumaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const signal = signalRef.current;
    const eye = eyeRef.current;
    const ghost = ghostRef.current;
    const target = targetRef.current;
    const map = mapRef.current;
    const luma = lumaRef.current;
    if (
      !canvas ||
      !signal ||
      !eye ||
      !ghost ||
      !target ||
      !map ||
      !luma ||
      !enabled
    )
      return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const restrained =
      navigator.hardwareConcurrency <= 4 ||
      matchMedia("(pointer: coarse)").matches ||
      matchMedia("(prefers-reduced-data: reduce)").matches;
    const frameInterval = restrained ? 1000 / 12 : 1000 / 25;
    const mapCanvas = document.createElement("canvas");
    mapCanvas.width = 2;
    mapCanvas.height = 768;
    const mapContext = !restrained ? mapCanvas.getContext("2d") : null;
    const mapPixels = mapContext?.createImageData(2, mapCanvas.height);
    target.dataset.tape = mapContext ? "full" : "light";
    let frame = 0;
    let lastFrame = 0;
    let nextEye = performance.now() + 2400;
    let nextTracking = performance.now() + 7500 + Math.random() * 4500;
    let nextDropout = performance.now() + 900 + Math.random() * 1400;
    let eventStart = 0;
    let eventDuration = 0;
    let eventY = 0;
    let eventStrength = 0;
    let eyeUntil = 0;
    let tracking = false;
    let eyeCount = 0;
    let texture: ImageData;
    let targetHeight = target.clientHeight;
    let viewportHeight = innerHeight;
    let viewTop = scrollY;
    const dropouts: Dropout[] = [];

    function resize() {
      if (!canvas || !ctx || !target || !map) return;
      // Video-like horizontal bandwidth, without a large full-resolution framebuffer.
      canvas.width = Math.min(restrained ? 480 : 760, innerWidth);
      canvas.height = Math.min(
        restrained ? 380 : 576,
        Math.ceil(innerHeight * 0.8),
      );
      texture = ctx.createImageData(canvas.width, canvas.height);
      targetHeight = target.clientHeight;
      viewportHeight = innerHeight;
      viewTop = -target.getBoundingClientRect().top;
      map.setAttribute("width", String(target.clientWidth));
      map.setAttribute("height", String(targetHeight));
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(target);

    const positions = [
      { right: "-48px", top: "19%", width: "210px", rotate: "-12deg" },
      { left: "-54px", top: "63%", width: "190px", rotate: "15deg" },
      { right: "-34px", bottom: "9%", width: "165px", rotate: "8deg" },
      { left: "3%", top: "-28px", width: "180px", rotate: "-9deg" },
      { right: "10%", top: "-38px", width: "165px", rotate: "10deg" },
    ];

    function disturb(strength: number, duration: number) {
      if (document.hidden) return;
      eventStart = performance.now();
      eventDuration = duration;
      eventStrength = strength;
      eventY = viewportHeight * (0.18 + Math.random() * 0.6);
      if (!tracking) {
        tracking = true;
        onTracking(true);
      }
    }

    function revealEye(now: number) {
      if (!eye || !ghost) return;
      const { rotate, ...placement } = positions[eyeCount++ % positions.length];
      for (const element of [eye, ghost]) {
        element.removeAttribute("style");
        element.classList.toggle("eye-from-scatter", eyeCount % 3 === 2);
        element.classList.toggle("eye-from-field", eyeCount % 3 === 0);
        Object.assign(element.style, placement);
        element.style.transform = `rotate(${rotate})`;
      }
      eye.style.opacity = String(
        eyeCount % 4 === 0 ? 0.48 : 0.22 + Math.random() * 0.13,
      );
      ghost.style.opacity = ".12";
      ghost.style.translate = "2px .5px";
      eyeUntil = now + 180 + Math.random() * 380;
      // Some eyes coincide with a tape error; they are not locked to every glitch.
      if (eyeCount % 2 === 1) disturb(1.8, 280);
    }

    function updateDisplacement(time: number, envelope: number, band: number) {
      if (!mapPixels || !mapContext || !map) return;
      const bytes = mapPixels.data;
      const seconds = time * 0.001;
      for (let row = 0; row < mapCanvas.height; row++) {
        const y = (row / (mapCanvas.height - 1)) * targetHeight - viewTop;
        // Neighboring lines drift together, rather than moving the whole page.
        let shift =
          Math.sin(row * 0.071 + seconds * 1.1) * 0.17 +
          Math.sin(row * 0.019 - seconds * 0.63) * 0.12;
        const distance = (y - band) / 19;
        shift += Math.exp(-distance * distance) * envelope * eventStrength;
        shift +=
          Math.sin(row * 2.4 + seconds * 49) *
          Math.exp(-distance * distance * 0.3) *
          envelope *
          0.55;
        if (y > viewportHeight - 10 && y <= viewportHeight) {
          shift += Math.sin(row * 3.1 + seconds * 47) * 0.8;
        }
        const red = Math.max(
          0,
          Math.min(255, Math.round(128 + (shift / displacementScale) * 255)),
        );
        const green = Math.round(128 + Math.sin(seconds * 2.1) * envelope * 2);
        for (let column = 0; column < 2; column++) {
          const p = (row * 2 + column) * 4;
          bytes[p] = red;
          bytes[p + 1] = green;
          bytes[p + 2] = 128;
          bytes[p + 3] = 255;
        }
      }
      mapContext.putImageData(mapPixels, 0, 0);
      map.setAttribute("href", mapCanvas.toDataURL());
    }

    function render(time: number) {
      if (!canvas || !ctx || !signal || !eye || !ghost || !luma) return;
      frame = requestAnimationFrame(render);
      if (document.hidden || time - lastFrame < frameInterval) return;
      lastFrame = time;
      const width = canvas.width;
      const height = canvas.height;
      const bytes = texture.data;
      const seconds = time * 0.001;
      // Mid-gray soft-light noise preserves black levels. Correlated horizontal
      // samples and line-to-line gain variation replace uniform film grain.
      for (let y = 0; y < height; y++) {
        const rowNoise =
          (Math.random() - 0.5) * 13 + Math.sin(y * 0.12 + seconds * 0.7) * 2;
        let previous = 0;
        for (let x = 0; x < width; x++) {
          const p = (y * width + x) * 4;
          const sample = (Math.random() + Math.random() - 1) * 58;
          previous = sample * 0.72 + previous * 0.28;
          const value = 128 + previous + rowNoise;
          bytes[p] = value + 1;
          bytes[p + 1] = value;
          bytes[p + 2] = value - 1;
          bytes[p + 3] = 76;
        }
      }
      ctx.putImageData(texture, 0, 0);

      if (time > nextEye) {
        revealEye(time);
        nextEye = time + (restrained ? 11000 : 6500) + Math.random() * 6500;
      }
      if (time > nextTracking) {
        disturb(2.1 + Math.random() * 1.1, 230 + Math.random() * 160);
        nextTracking = time + 10500 + Math.random() * 13000;
      }
      const progress = (time - eventStart) / eventDuration;
      const active = progress >= 0 && progress < 1;
      const envelope = active ? Math.sin(progress * Math.PI) ** 2 : 0;
      const band = eventY + (active ? progress * viewportHeight * 0.085 : 0);
      signal.classList.toggle("tracking", active);
      if (!active && tracking) {
        tracking = false;
        onTracking(false);
      }
      updateDisplacement(time, envelope, band);

      // Dropouts occupy short horizontal runs, never a full white frame.
      if (time > nextDropout) {
        dropouts.push({
          x: Math.random() * width * 0.82,
          y: Math.random() * height,
          width: 10 + Math.random() * 75,
          expires: time + 55 + Math.random() * 65,
          strength: 0.1 + Math.random() * 0.13,
        });
        nextDropout = time + 1100 + Math.random() * 3100;
      }
      for (let i = dropouts.length - 1; i >= 0; i--) {
        const dropout = dropouts[i];
        if (time > dropout.expires) {
          dropouts.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(208,210,197,${dropout.strength})`;
        ctx.fillRect(dropout.x, Math.round(dropout.y), dropout.width, 1);
        ctx.fillStyle = "rgba(0,0,0,.12)";
        ctx.fillRect(
          dropout.x + 3,
          Math.round(dropout.y) + 1,
          dropout.width * 0.75,
          1,
        );
      }
      if (active) {
        const bandY = (band / viewportHeight) * height;
        for (let line = 0; line < 7; line++) {
          ctx.fillStyle = `rgba(195,202,180,${Math.random() * 0.12 * envelope})`;
          ctx.fillRect(
            Math.random() * width * 0.15,
            bandY + line * 0.8,
            width * (0.6 + Math.random() * 0.4),
            0.6,
          );
        }
      }
      // A few unstable lines at the raster bottom, as in an uncropped tape transfer.
      const headY = height - 4 - Math.round(Math.random() * 3);
      for (let i = 0; i < 14; i++) {
        const x = Math.random() * width;
        ctx.fillStyle = `rgba(156,165,148,${0.05 + Math.random() * 0.16})`;
        ctx.fillRect(x, headY + Math.random() * 3, 4 + Math.random() * 45, 0.7);
      }
      ctx.fillStyle = "rgba(0,0,0,.2)";
      ctx.fillRect(0, height - 2, width, 1);
      // Slow, irregular gain wander; no repeating bright flashes.
      luma.style.opacity = String(
        0.008 +
          (Math.sin(seconds * 0.61) + Math.sin(seconds * 1.37)) * 0.003 +
          envelope * 0.012,
      );
      if (time > eyeUntil) {
        eye.style.opacity = "0";
        ghost.style.opacity = "0";
      }
    }

    const onScroll = () => {
      viewTop = -target.getBoundingClientRect().top;
    };
    const onLink = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("a") &&
        Math.random() < 0.3
      )
        disturb(0.7, 160);
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (document.hidden) {
        eye.style.opacity = "0";
        ghost.style.opacity = "0";
        signal.classList.remove("tracking");
        onTracking(false);
        tracking = false;
      } else {
        nextEye = performance.now() + 4000;
        nextTracking = performance.now() + 7000;
        lastFrame = 0;
        frame = requestAnimationFrame(render);
      }
    };
    frame = requestAnimationFrame(render);
    addEventListener("resize", resize);
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onLink);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener("resize", resize);
      removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onLink);
      document.removeEventListener("visibilitychange", onVisibility);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      delete target.dataset.tape;
      map.removeAttribute("href");
      signal.classList.remove("tracking");
      eye.style.opacity = "0";
      ghost.style.opacity = "0";
      luma.style.opacity = "0";
      onTracking(false);
    };
  }, [enabled, onTracking, targetRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="signal-grain"
        hidden={!enabled}
        aria-hidden="true"
      />
      <div
        ref={signalRef}
        className={`signal ${enabled ? "signal-on" : "signal-off"}`}
        aria-hidden="true"
      >
        <svg
          className="signal-filter-definitions"
          width="0"
          height="0"
          focusable="false"
        >
          <defs>
            <filter
              id="tape-warp"
              x="-2%"
              y="-1%"
              width="104%"
              height="102%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                ref={mapRef}
                x="0"
                y="0"
                preserveAspectRatio="none"
                result="line-map"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="line-map"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="warped"
              />
              <feGaussianBlur
                in="warped"
                stdDeviation="0.18 0"
                result="soft-signal"
              />
              <feOffset
                in="soft-signal"
                dx="1.25"
                dy="0"
                result="echo-offset"
              />
              <feColorMatrix
                in="echo-offset"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .09 0"
                result="echo"
              />
              <feMerge>
                <feMergeNode in="echo" />
                <feMergeNode in="soft-signal" />
              </feMerge>
            </filter>
            <filter
              id="tape-chroma"
              x="-3%"
              y="-1%"
              width="106%"
              height="102%"
              colorInterpolationFilters="sRGB"
            >
              {/* Store Y, Cb, Cr in RGB channels so only color loses bandwidth. */}
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values=".299 .587 .114 0 0  -.168736 -.331264 .5 0 .5  .5 -.418688 -.081312 0 .5  0 0 0 1 0"
                result="ycbcr"
              />
              <feColorMatrix
                in="ycbcr"
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="luma"
              />
              <feGaussianBlur
                in="ycbcr"
                stdDeviation="1.3 0"
                edgeMode="duplicate"
                result="low-bandwidth"
              />
              <feOffset
                in="low-bandwidth"
                dx="1.1"
                dy="0"
                result="color-delay"
              />
              <feFlood
                floodColor="rgb(50%, 50%, 50%)"
                result="neutral-chroma"
              />
              <feComposite
                in="color-delay"
                in2="neutral-chroma"
                operator="over"
                result="padded-color"
              />
              <feColorMatrix
                in="padded-color"
                type="matrix"
                values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
                result="chroma"
              />
              <feComposite
                in="luma"
                in2="chroma"
                operator="arithmetic"
                k2="1"
                k3="1"
                result="recombined"
              />
              <feColorMatrix
                in="recombined"
                type="matrix"
                values="1 0 1.402 0 -.701  1 -.344136 -.714136 0 .529136  1 1.772 0 0 -.886  0 0 0 1 0"
                result="decoded-color"
              />
              <feComposite
                in="decoded-color"
                in2="SourceGraphic"
                operator="in"
              />
            </filter>
          </defs>
        </svg>
        <div className="signal-interlace" />
        <div ref={lumaRef} className="signal-luma" />
        <div ref={eyeRef} className="peripheral-eye" />
        <div ref={ghostRef} className="peripheral-eye eye-ghost" />
        <div className="signal-scanlines" />
        <div className="signal-vignette" />
        <div className="screen-edge" />
      </div>
    </>
  );
}
