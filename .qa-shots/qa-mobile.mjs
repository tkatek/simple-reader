/* Mobile reflow QA: screenshots + layout metrics + functional checks.
   Run: node .qa-shots/qa-mobile.mjs */
const { chromium, devices } = await import('file:///C:/Users/HP/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright/index.mjs');
const { mkdirSync, writeFileSync } = await import('node:fs');

const BASE = 'http://127.0.0.1:8125/reader.html';
const ROOT = '.qa-shots';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const summary = { passes: {}, functional: {}, consoleErrors: {} };

async function newPass(name, preset, outDir) {
    mkdirSync(`${ROOT}/${outDir}`, { recursive: true });
    const ctx = await browser.newContext({ ...preset, locale: 'en-US' });
    ctx.setDefaultTimeout(9000);
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 180)); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 180)));
    await page.goto(BASE);
    await page.waitForLoadState('domcontentloaded');
    await sleep(1500);
    return { name, ctx, page, errors, outDir };
}

async function jump(page, i) {
    await page.evaluate(idx => window.goToSlide(idx), i);
    await page.waitForFunction((idx) => {
        const el = document.querySelectorAll('.slide')[idx];
        const c = el && el.querySelector('.slide-canvas');
        try {
            return c && c.contentDocument && c.contentDocument.readyState === 'complete'
                && !!c.contentDocument.querySelector('.bec-slide, .intro, .thanks, .s7-slide');
        } catch (e) { return false; }
    }, i, { timeout: 9000 }).catch(() => { });
    await sleep(700);
}

async function slideInfo(page) {
    return await page.evaluate(() => {
        const el = document.querySelectorAll('.slide')[window.state.currentSlide];
        const canvas = el.querySelector('.slide-canvas');
        let doc = null;
        try {
            const d = canvas.contentDocument;
            if (d) doc = {
                viewportW: d.defaultView.innerWidth,
                scrollW: Math.max(d.documentElement.scrollWidth, d.body.scrollWidth),
                scrollH: Math.max(d.documentElement.scrollHeight, d.body.scrollHeight),
            };
        } catch (e) { doc = { err: String(e) }; }
        const r = canvas.getBoundingClientRect();
        return {
            stageW: el.clientWidth, stageH: el.clientHeight,
            iframeW: Math.round(r.width), iframeH: Math.round(r.height),
            stageHOverflow: el.scrollWidth > el.clientWidth + 1,
            stageScrolls: el.scrollHeight > el.clientHeight + 4,
            docHOverflow: doc && doc.scrollW != null && doc.viewportW != null ? doc.scrollW > doc.viewportW + 1 : null,
            doc,
        };
    });
}

async function shoot(page, outDir, label, { scrollBottom = false } = {}) {
    if (scrollBottom) {
        await page.evaluate(() => {
            const el = document.querySelectorAll('.slide')[window.state.currentSlide];
            el.scrollTop = el.scrollHeight;
        });
        await sleep(350);
    }
    await page.screenshot({ path: `${ROOT}/${outDir}/${label}.png` });
    if (scrollBottom) {
        await page.evaluate(() => {
            const el = document.querySelectorAll('.slide')[window.state.currentSlide];
            el.scrollTop = 0;
        });
        await sleep(200);
    }
}

/* ───────── PASS A: iPhone 13 (390×844, touch) — all 13 slides ───────── */
{
    const p = await newPass('mobile-390', { ...devices['iPhone 13'], deviceScaleFactor: 2 }, 'mobile');
    const rows = [];
    for (let i = 0; i < 13; i++) {
        await jump(p.page, i);
        const info = await slideInfo(p.page);
        await shoot(p.page, p.outDir, `s${String(i + 1).padStart(2, '0')}`);
        if (info.stageScrolls) await shoot(p.page, p.outDir, `s${String(i + 1).padStart(2, '0')}-bottom`, { scrollBottom: true });
        rows.push({ slide: i + 1, ...info });
    }
    summary.passes['mobile-390'] = rows;
    summary.consoleErrors['mobile-390'] = p.errors;

    /* ── Functional checks on the same mobile context ── */
    const F = summary.functional;

    // 1) Slide 2 quiz: tap "False" (correct answer for Q1)
    await jump(p.page, 1);
    {
        const frame = p.page.frames().find(f => f.url().includes('slide-2'));
        await frame.click('.tf-ans[data-value="false"]');
        await sleep(400);
        F.quiz2 = {
            correctHighlighted: await frame.locator('.tf-ans.is-correct').count() === 1,
            progress: await frame.locator('#stat-progress').textContent(),
            feedback: (await frame.locator('#feedback').textContent()).trim(),
        };
        await shoot(p.page, p.outDir, 'fn-s2-answered');
    }

    // 2) Slide 12 tap-to-place: select chip "account", tap gap 1, check answers
    await jump(p.page, 11);
    {
        const frame = p.page.frames().find(f => f.url().includes('slide-12'));
        await frame.getByRole('button', { name: 'Word: account', exact: true }).tap();
        await sleep(250);
        const selected = await frame.locator('.dd-chip.is-selected').count() === 1;
        await frame.getByRole('button', { name: 'Gap 1, empty' }).tap();
        await sleep(350);
        const gap1 = await frame.locator('.dd-blank').first().getAttribute('aria-label');
        const progress = await frame.locator('#stat-progress').textContent();
        await frame.locator('#btn-check').tap();
        await sleep(350);
        F.tapToPlace = {
            chipSelected: selected,
            gap1Label: gap1,
            progressAfterPlace: progress,
            feedback: (await frame.locator('#feedback').textContent()).trim(),
        };
        await shoot(p.page, p.outDir, 'fn-s12-placed');
    }

    // 3) Slide 13 → Start Again returns to slide 1
    await jump(p.page, 12);
    {
        const frame = p.page.frames().find(f => f.url().includes('slide-13'));
        await frame.locator('#btn-start-again').tap();
        await sleep(700);
        F.startAgain = { currentSlide: await p.page.evaluate(() => window.state.currentSlide) };
    }

    // 4) Theme toggle syncs a dark screenshot
    await p.page.locator('#theme-toggle-btn').tap();
    await sleep(900);
    F.theme = { dark: await p.page.evaluate(() => document.documentElement.classList.contains('dark')) };
    await shoot(p.page, p.outDir, 'fn-dark-s1');
    await p.page.locator('#theme-toggle-btn').tap();
    await sleep(600);

    // 5) Zoom controls
    await p.page.locator('button[onclick="changeZoom(0.1)"]').tap();
    await sleep(400);
    const z110 = await p.page.locator('#zoom-level').textContent();
    await p.page.locator('button[onclick="changeZoom(-0.1)"]').tap();
    await sleep(400);
    const z100 = await p.page.locator('#zoom-level').textContent();
    F.zoom = { afterPlus: z110, afterMinus: z100 };

    // 6) Mobile sidebar drawer → jump to slide 10, stage scrolls
    await p.page.locator('#mobile-menu-btn').tap();
    await sleep(500);
    await shoot(p.page, p.outDir, 'fn-sidebar');
    await p.page.locator('.sidebar-thumb').nth(9).tap();
    await sleep(900);
    F.sidebarJump = { currentSlide: await p.page.evaluate(() => window.state.currentSlide) };
    await jump(p.page, 9);
    await shoot(p.page, p.outDir, 'fn-s10-bottom', { scrollBottom: true });
    await p.ctx.close();
}

/* ───────── PASS A2: explicit 390×844 (brief flagship size) ───────── */
{
    const preset = { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 };
    const p = await newPass('mobile-390x844', preset, 'mobile844');
    const rows = [];
    for (let i = 0; i < 13; i++) {
        await jump(p.page, i);
        const info = await slideInfo(p.page);
        await shoot(p.page, p.outDir, `s${String(i + 1).padStart(2, '0')}`);
        if (info.stageScrolls) await shoot(p.page, p.outDir, `s${String(i + 1).padStart(2, '0')}-bottom`, { scrollBottom: true });
        rows.push({ slide: i + 1, ...info });
    }
    summary.passes['mobile-390x844'] = rows;
    summary.consoleErrors['mobile-390x844'] = p.errors;
    await p.ctx.close();
}

/* ───────── PASS B: 320×568 small phone spot check ───────── */
{
    const preset = { ...devices['iPhone SE'], viewport: { width: 320, height: 568 }, deviceScaleFactor: 2 };
    const p = await newPass('se-320', preset, 'se320');
    const rows = [];
    for (const i of [0, 2, 3, 6, 11, 12]) {
        await jump(p.page, i);
        const info = await slideInfo(p.page);
        await shoot(p.page, p.outDir, `s${String(i + 1).padStart(2, '0')}`);
        rows.push({ slide: i + 1, ...info });
    }
    summary.passes['se-320'] = rows;
    summary.consoleErrors['se-320'] = p.errors;
    await p.ctx.close();
}

/* ───────── PASS C: iPad portrait 768×1024 spot check ───────── */
{
    const p = await newPass('ipad-768', devices['iPad (gen 7)'], 'ipad768');
    const rows = [];
    for (const i of [0, 2, 3, 9]) {
        await jump(p.page, i);
        const info = await slideInfo(p.page);
        await shoot(p.page, p.outDir, `s${String(i + 1).padStart(2, '0')}`);
        rows.push({ slide: i + 1, ...info });
    }
    summary.passes['ipad-768'] = rows;
    summary.consoleErrors['ipad-768'] = p.errors;
    await p.ctx.close();
}

/* ───────── PASS D: desktop 1440×900 regression — all 13 slides ───────── */
{
    const p = await newPass('desktop-1440', { viewport: { width: 1440, height: 900 } }, 'desktop-regression');
    const rows = [];
    for (let i = 0; i < 13; i++) {
        await jump(p.page, i);
        const info = await slideInfo(p.page);
        await shoot(p.page, p.outDir, `s${String(i + 1).padStart(2, '0')}`);
        rows.push({ slide: i + 1, ...info });
    }
    summary.passes['desktop-1440'] = rows;
    summary.consoleErrors['desktop-1440'] = p.errors;
    await p.ctx.close();
}

await browser.close();
writeFileSync(`${ROOT}/qa-summary.json`, JSON.stringify(summary, null, 2));

/* Compact report */
for (const [pass, rows] of Object.entries(summary.passes)) {
    console.log(`\n== ${pass} ==`);
    for (const r of rows) {
        console.log(`s${String(r.slide).padStart(2, '0')} stage=${r.stageW}x${r.stageH} iframe=${r.iframeW}x${r.iframeH}` +
            ` hOverflow=${r.stageHOverflow} docHOverflow=${r.docHOverflow} scrolls=${r.stageScrolls}`);
    }
}
console.log('\n== functional ==');
console.log(JSON.stringify(summary.functional, null, 2));
console.log('\n== console errors ==');
for (const [k, v] of Object.entries(summary.consoleErrors)) console.log(k, v.length ? v : 'none');
