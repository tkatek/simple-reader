<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boston English Center</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: { extend: { fontFamily: { sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui'] } } }
        };

        (function applyInitialTheme() {
            let useDark = false;
            try {
                if (window.parent && window.parent !== window) {
                    useDark = window.parent.document.documentElement.classList.contains('dark');
                }
            } catch (e) {}
            if (!useDark) {
                const saved = localStorage.getItem('theme-preference');
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                useDark = saved ? saved === 'dark' : prefersDark;
            }
            document.documentElement.classList.toggle('dark', useDark);

            // Embedded in the reader: switch off this slide's own stage
            // paint so the reader's full-stage backdrop shows through
            // seamlessly (no seams, no unpainted strips).
            try {
                document.documentElement.classList.toggle('bec-embedded', window.parent !== window);
            } catch (e) {}
        })();

        window.setTheme = function setTheme(theme) {
            const useDark = theme === 'dark';
            document.documentElement.classList.toggle('dark', useDark);
            localStorage.setItem('theme-preference', useDark ? 'dark' : 'light');
        };

        // Live theme sync with the reader: its toggle writes 'editor-theme-preference'
        // to localStorage, which fires a storage event inside every slide iframe.
        window.addEventListener('storage', function (event) {
            if (event.key === 'editor-theme-preference' && (event.newValue === 'dark' || event.newValue === 'light')) {
                document.documentElement.classList.toggle('dark', event.newValue === 'dark');
            }
        });
    </script>
    <link rel="stylesheet" href="{{ asset('bec/chapter-1/bec.css') }}">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <style>
        /* ── Slide 7 · Reading Comprehension — MY CABLE TV BILL ───────────
           Fixed 1280×720 reader canvas; the reader scales it visually.
           Layout is px-true to the approved reference design. */
        .s7-slide {
            --s7-bg: #f3f4fb;
            --s7-surface: #ffffff;
            --s7-border: #e9ecf6;
            --s7-shadow: 0 20px 45px -20px rgba(30, 34, 80, 0.22);
            --s7-text: #05051a;
            --s7-label: #4a5478;
            --s7-title-indigo: #150a80;
            --s7-title-blue: #0b52fd;
            --s7-lav: #e4e0fc;
            --s7-num: #1a0d87;
            --s7-sep: #d6d1f8;
            --s7-icon: #27178b;
            --s7-divider: #230dc0;
            --s7-thanks: #3a4470;
            --s7-unit: #4a38fa;
            --s7-unit-border: #7c68f8;
            --s7-kicker: #1a1c38;
            --s7-home: #0a0a20;

            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100dvh;
            width: 100%;
            overflow: hidden;
            background: var(--s7-bg);
            color: var(--s7-text);
            font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
        }
        .dark .s7-slide {
            --s7-bg: #0f172a;
            --s7-surface: #1e293b;
            --s7-border: #334155;
            --s7-shadow: 0 20px 45px -20px rgba(0, 0, 0, 0.55);
            --s7-text: #f1f5f9;
            --s7-label: #94a3b8;
            --s7-title-indigo: #a5b4fc;
            --s7-title-blue: #60a5fa;
            --s7-lav: rgba(99, 102, 241, 0.22);
            --s7-num: #a5b4fc;
            --s7-sep: rgba(148, 163, 184, 0.3);
            --s7-icon: #312e81;
            --s7-divider: #6366f1;
            --s7-thanks: #94a3b8;
            --s7-unit: #a5b4fc;
            --s7-unit-border: #6366f1;
            --s7-kicker: #94a3b8;
            --s7-home: #f1f5f9;
        }

        .s7-inner { width: 1145px; max-width: calc(100% - 36px); padding-top: 30px; }

        /* Top course information */
        .s7-kicker {
            text-align: center;
            font-size: 15px;
            line-height: 1;
            font-weight: 800;
            letter-spacing: 0.22em;
            color: var(--s7-kicker);
        }
        .s7-unitrow { margin-top: 18px; display: flex; align-items: center; justify-content: center; gap: 34px; }
        .s7-unit {
            display: inline-flex;
            align-items: center;
            height: 25px;
            padding: 0 10px;
            border: 1.5px solid var(--s7-unit-border);
            border-radius: 9999px;
            font-size: 18.5px;
            font-weight: 800;
            letter-spacing: 0.04em;
            color: var(--s7-unit);
            background: var(--s7-surface);
        }
        .s7-unitname { font-size: 25.5px; line-height: 1.44; font-weight: 800; letter-spacing: 0; color: var(--s7-home); }
        .s7-lesson {
            margin: 6px auto 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 38px;
            width: 154px;
            border-radius: 10px;
            background: linear-gradient(180deg, #5642fb, #4832fb);
            color: #fff;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.1em;
        }

        /* Title — standard BEC indigo→blue gradient heading */
        .s7-title {
            margin-top: 23px;
            text-align: center;
            font-size: var(--bec-title-size, 44px);
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: 0.055em;
            background: linear-gradient(100deg, #4338ca, #3b82f6);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        .dark .s7-title {
            background: linear-gradient(100deg, #818cf8, #60a5fa);
            -webkit-background-clip: text;
            background-clip: text;
        }
        .s7-title .s7-accent { color: inherit; }

        /* Two exercise cards */
        .s7-grid {
            margin-top: 39px;
            display: grid;
            grid-template-columns: 535fr 585fr;
            gap: 25px;
            align-items: stretch;
        }
        .s7-card {
            background: var(--s7-surface);
            border: 1px solid var(--s7-border);
            border-radius: 20px;
            box-shadow: var(--s7-shadow);
        }

        /* Left card — cable bill */
        .s7-bill { padding: 20px; display: flex; flex-direction: column; }
        .s7-bill-head { display: flex; align-items: center; gap: 18px; }
        .s7-bill-icon {
            flex: 0 0 auto;
            width: 57px;
            height: 52px;
            border-radius: 12px;
            background: var(--s7-icon);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #fff;
        }
        .s7-bill-name { font-size: 24px; line-height: 1.2; font-weight: 800; letter-spacing: 0.03em; color: var(--s7-title-indigo); text-transform: uppercase; }
        .s7-bill-sub { margin-top: 6px; font-size: 13.5px; line-height: 1; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: var(--s7-label); }
        .s7-bill-rule { margin-top: 11.5px; height: 2px; border-radius: 1px; background: var(--s7-divider); }
        .s7-bill-rows { margin-top: 20.5px; }
        .s7-bill-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 15.2px;
            font-size: 17px;
            line-height: 1;
        }
        .s7-bill-row:last-child { margin-bottom: 0; }
        .s7-bill-row span { font-weight: 600; letter-spacing: 0.01em; color: var(--s7-label); }
        .s7-bill-row strong { font-weight: 800; font-size: 18px; letter-spacing: 0.02em; color: var(--s7-text); font-variant-numeric: tabular-nums; white-space: nowrap; }
        .s7-total {
            margin-top: 21px;
            height: 49px;
            border-radius: 11px;
            background: linear-gradient(90deg, #5743fa, #4e36fb);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 2px 0 8px;
            box-shadow: 0 14px 30px -14px rgba(80, 57, 250, 0.55);
        }
        .s7-total-label { font-size: 19px; line-height: 1; font-weight: 800; letter-spacing: 0.22em; }
        .s7-total-amount { font-size: 33px; line-height: 1; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: 0.01em; }
        .s7-thanks {
            margin-top: 18.5px;
            text-align: center;
            font-size: 13px;
            line-height: 1;
            font-weight: 800;
            letter-spacing: 0.45em;
            text-indent: 0.45em;
            text-transform: uppercase;
            color: var(--s7-thanks);
        }

        /* Right card — questions */
        .s7-quiz { padding: 24px 23px; display: flex; flex-direction: column; }
        .s7-instruction { font-size: 21.5px; line-height: 1.4; font-weight: 800; letter-spacing: 0.01em; color: var(--s7-text); }
        .s7-qlist { margin-top: 19.5px; display: flex; flex-direction: column; flex: 1 1 auto; }
        .s7-qrow { display: flex; align-items: center; gap: 23px; }
        .s7-qnum {
            flex: 0 0 auto;
            width: 44px;
            height: 40px;
            border-radius: 11px;
            background: var(--s7-lav);
            color: var(--s7-num);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            line-height: 1;
            font-weight: 800;
        }
        .s7-qtext { font-size: 18px; font-weight: 700; letter-spacing: 0.02em; line-height: 1.35; color: var(--s7-text); }
        .s7-qsep { margin: 11.5px 0 13.5px; border-top: 2px dashed var(--s7-sep); }
        .s7-qrow.last { margin-bottom: 0; }

        /* Narrow standalone viewing (the reader canvas itself is fixed 1280px) */
        @media (max-width: 940px) {
            html, body.h-full { height: auto; }
            body.overflow-hidden { overflow: auto; }
            .s7-slide { height: auto; min-height: 100dvh; overflow: visible; }
            .s7-grid { grid-template-columns: 1fr; gap: 18px; }
            .s7-unitrow { gap: 16px; flex-wrap: wrap; }
            .s7-unitname { font-size: 20px; }
            .s7-title { font-size: 26px; letter-spacing: 0.02em; }
            .s7-inner { padding-top: 18px; padding-bottom: 26px; }
        }
        /* Very narrow phones: keep every bill row inside the card (no
           horizontal overflow from nowrap amounts / wide totals). */
        @media (max-width: 380px) {
            .s7-inner { max-width: calc(100% - 20px); }
            .s7-title { font-size: 23px; }
            .s7-bill { padding: 14px; }
            .s7-bill-name { font-size: 19px; }
            .s7-bill-row { gap: 8px; font-size: 14.5px; }
            .s7-bill-row strong { font-size: 14.5px; }
            .s7-total { height: 42px; border-radius: 9px; }
            .s7-total-label { font-size: 14px; letter-spacing: 0.1em; }
            .s7-total-amount { font-size: 24px; }
            .s7-qrow { gap: 12px; }
            .s7-qnum { width: 34px; height: 32px; font-size: 19px; }
            .s7-qtext { font-size: 15.5px; }
            .s7-instruction { font-size: 18px; }
        }
    </style>
</head>
<body class="h-full overflow-hidden">
<div class="s7-slide">
    <div class="s7-inner">

        <p class="s7-kicker reveal">A1 · BEGINNER</p>

        <div class="s7-unitrow reveal">
            <span class="s7-unit">UNIT 4</span>
            <span class="s7-unitname">Home and Daily Needs</span>
        </div>

        <div class="s7-lesson reveal">LESSON 3</div>

        <h1 class="s7-title reveal">Reading Comprehension — <span class="s7-accent">MY CABLE TV BILL</span></h1>

        <div class="s7-grid">
            <!-- The bill document (recreated from the lesson worksheet) -->
            <div class="s7-card s7-bill reveal">
                <div class="s7-bill-head">
                    <span class="s7-bill-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    </span>
                    <div>
                        <p class="s7-bill-name">ESL Cable TV Service</p>
                        <p class="s7-bill-sub">Monthly Statement</p>
                    </div>
                </div>
                <div class="s7-bill-rule"></div>
                <div class="s7-bill-rows">
                    <div class="s7-bill-row"><span>Account Number</span><strong>56789-123-8</strong></div>
                    <div class="s7-bill-row"><span>Billing Period</span><strong>01/01/03 – 01/31/03</strong></div>
                    <div class="s7-bill-row"><span>Due Date</span><strong>01/03/03</strong></div>
                    <div class="s7-bill-row"><span>Monthly Service Charge</span><strong>$44.80</strong></div>
                    <div class="s7-bill-row"><span>Taxes</span><strong>$2.58</strong></div>
                </div>
                <div class="s7-total">
                    <span class="s7-total-label">TOTAL DUE</span>
                    <span class="s7-total-amount">$47.38</span>
                </div>
                <p class="s7-thanks">Thank You</p>
            </div>

            <!-- Questions -->
            <div class="s7-card s7-quiz reveal">
                <p class="s7-instruction">Read this bill and answer the questions:</p>
                <div class="s7-qlist">
                    <div class="s7-qrow">
                        <span class="s7-qnum">1</span>
                        <p class="s7-qtext">What service is this bill for?</p>
                    </div>
                    <div class="s7-qsep"></div>
                    <div class="s7-qrow">
                        <span class="s7-qnum">2</span>
                        <p class="s7-qtext">What month of the year is the billing period?</p>
                    </div>
                    <div class="s7-qsep"></div>
                    <div class="s7-qrow">
                        <span class="s7-qnum">3</span>
                        <p class="s7-qtext">When is the bill due?</p>
                    </div>
                    <div class="s7-qsep"></div>
                    <div class="s7-qrow last">
                        <span class="s7-qnum">4</span>
                        <p class="s7-qtext">What is the account number?</p>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        window.resetSlide = function resetSlide() {};

        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (window.gsap && !reduced) {
            gsap.timeline().from('.reveal', { opacity: 0, y: 10, duration: 0.35, stagger: 0.08, ease: 'power2.out', clearProps: 'all' });
        }
    });
</script>
</body>
</html>
