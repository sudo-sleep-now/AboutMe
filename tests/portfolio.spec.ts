import { test, expect } from "@playwright/test";

test("preserves the original portfolio structure and public projects", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "408", exact: true }),
  ).toBeVisible();
  await expect(page.locator("article")).toHaveCount(2);
  expect(await page.locator('a[href*="/city"]').count()).toBe(0);
  for (const name of ["Pelagic", "Waffles"]) {
    await expect(
      page.locator(
        `article a[href="https://github.com/sudo-sleep-now/${name}"]`,
      ),
    ).toBeVisible();
  }
  const work = await page.locator(".work").boundingBox();
  const personal = await page.locator(".personal").boundingBox();
  expect(work!.y).toBeLessThan(220);
  expect(Math.abs(work!.y - personal!.y)).toBeLessThan(2);
  expect(work!.x + work!.width).toBeLessThan(personal!.x);
  expect(
    await page
      .locator(".identity h1")
      .evaluate((el) => getComputedStyle(el).fontSize),
  ).toBe("48px");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  expect(errors).toEqual([]);
});

test("effects pause completely and the preference persists", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause visual effects" }).click();
  await expect(page.locator(".signal")).toHaveClass(/signal-off/);
  await expect(page.locator(".signal-grain")).toBeHidden();
  await expect(page.locator(".page-shell")).toHaveCSS("filter", "none");
  expect(
    await page.locator("#tape-warp feImage").getAttribute("href"),
  ).toBeNull();
  await expect(page.locator(".portfolio")).not.toHaveClass(/effects-enabled/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Enable visual effects" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Enable visual effects" }).click();
  await expect(page.locator(".signal")).toHaveClass(/signal-on/);
});

test("reduced motion prevents eye events, noise, and animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", {
      name: "Visual effects disabled by reduced motion preference",
    }),
  ).toBeDisabled();
  await expect(page.locator(".signal-grain")).toBeHidden();
  await expect(page.locator(".peripheral-eye").first()).toBeHidden();
  await expect(page.locator(".signal-interlace")).toBeHidden();
  await expect(page.locator(".page-shell")).toHaveCSS("filter", "none");
  expect(
    await page
      .locator(".identity h1")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(
    page.getByRole("button", { name: "Pause visual effects" }),
  ).toBeEnabled();
});

test("tape warping animates without moving link targets or layout", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 }),
  );
  await page.goto("/");
  await expect(page.locator(".page-shell")).toHaveAttribute(
    "data-tape",
    "full",
  );
  const link = page.getByRole("link", { name: "Live demo", exact: true });
  const initialBounds = await link.boundingBox();
  const map = page.locator("#tape-warp feImage");
  await expect(map).toHaveAttribute("href", /^data:image\/png/);
  const initialMap = await map.getAttribute("href");
  await expect.poll(() => map.getAttribute("href")).not.toBe(initialMap);
  expect(await link.boundingBox()).toEqual(initialBounds);
  await expect(page.locator(".signal-grain")).toHaveCSS(
    "pointer-events",
    "none",
  );
  await page.getByRole("button", { name: "Pause visual effects" }).click();
  await expect(page.locator(".page-shell")).toHaveCSS("filter", "none");
  expect(await map.getAttribute("href")).toBeNull();
});

test("slower devices keep noise and eyes without the page displacement filter", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 2 }),
  );
  await page.goto("/");
  await expect(page.locator(".page-shell")).toHaveAttribute(
    "data-tape",
    "light",
  );
  await expect(page.locator(".page-shell")).toHaveCSS("filter", "none");
  await expect(page.locator(".signal-grain")).toBeVisible();
  expect(
    await page
      .locator(".signal-grain")
      .evaluate((el) => (el as HTMLCanvasElement).width),
  ).toBeLessThanOrEqual(480);
  await page.getByRole("button", { name: "Pause visual effects" }).click();
  await expect(page.locator(".signal-grain")).toBeHidden();
});

test("eyes appear briefly, only at the edge, without receiving input", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.waitForFunction(
    () =>
      Number(
        getComputedStyle(document.querySelector(".peripheral-eye")!).opacity,
      ) > 0.2,
    undefined,
    { timeout: 6000 },
  );
  const eye = await page.locator(".peripheral-eye").first().boundingBox();
  const width = page.viewportSize()!.width;
  expect(eye!.x + eye!.width / 2).toBeGreaterThan(width * 0.85);
  expect(
    await page
      .locator(".signal")
      .evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe("none");
  await page.screenshot({ path: testInfo.outputPath("peripheral-eye.png") });
  await expect(page.locator(".peripheral-eye").first()).toHaveCSS(
    "opacity",
    "0",
    { timeout: 1500 },
  );
});

test("Discord copy provides accessible feedback", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy Discord username" }).click();
  await expect(page.getByRole("status")).toHaveText("Discord username copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "sudo.sleep_",
  );
});

for (const width of [320, 390, 768, 1440]) {
  test(`layout stays navigable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: /About/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "About", exact: true }),
    ).toBeInViewport();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: /Contact/ })
      .click();
    await expect(page.locator('#contact a[href^="mailto:"]')).toBeInViewport();
    expect(
      await page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBe(true);
  });
}
