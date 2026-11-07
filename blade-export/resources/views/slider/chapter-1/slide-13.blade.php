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
    <link rel="stylesheet" href="{{ asset('bec/chapter-1/bec.css') }}">
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
    <style>
        /* ═══ BEC "Thank You" closing template — replicated from the Boston
           English Center outro reference (framed photo on the left; short
           decorative line, big indigo→blue gradient heading, description
           lines and a gradient Start Again button on the right). Scoped to
           .thanks only. ═══ */
        body { overflow-x: hidden; overflow-y: auto; }

        .thanks {
            --surface: #ffffff;
            --frame-border: #e0e7ff;
            --frame-ring: rgba(224, 231, 255, 0.7);
            --text: #0f172a;
            --muted: #475569;
            --ph-fill: #ecebf7;
            --ph-icon: #8f8cbd;
            --bg: #f3f4fb;
            position: relative;
            min-height: 100dvh;
            background-color: var(--bg);
            color: var(--text);
            font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui;
        }
        .dark .thanks {
            --surface: #0f172a;
            --frame-border: #4338ca;
            --frame-ring: rgba(49, 46, 129, 0.55);
            --text: #e2e8f0;
            --muted: #94a3b8;
            --ph-fill: #312e81;
            --ph-icon: #818cf8;
            --bg: #0f172a;
        }

        /* Background: near-white base with very subtle atmospheric glows */
        .thanks-bg { pointer-events: none; position: fixed; inset: 0; z-index: 0; }
        .thanks-bg .glow-a {
            position: absolute; top: -18%; left: -10%; width: 46vw; height: 46vw; border-radius: 9999px;
            background: radial-gradient(circle, rgba(139, 124, 243, 0.12) 0%, rgba(139, 124, 243, 0.05) 45%, transparent 70%);
        }
        .thanks-bg .glow-b {
            position: absolute; bottom: -20%; right: -10%; width: 42vw; height: 42vw; border-radius: 9999px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.10) 0%, rgba(59, 130, 246, 0.04) 45%, transparent 70%);
        }
        .thanks-bg .glow-c {
            position: absolute; bottom: -22%; left: 30%; width: 38vw; height: 38vw; border-radius: 9999px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.07) 0%, rgba(16, 185, 129, 0.03) 45%, transparent 70%);
        }
        .dark .thanks-bg .glow-a { background: radial-gradient(circle, rgba(139, 124, 243, 0.10) 0%, rgba(139, 124, 243, 0.04) 45%, transparent 70%); }
        .dark .thanks-bg .glow-b { background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 45%, transparent 70%); }
        .dark .thanks-bg .glow-c { background: radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 45%, transparent 70%); }

        .thanks-wrap {
            position: relative;
            z-index: 10;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: clamp(1rem, 3vh, 2rem) clamp(1rem, 3vw, 2.5rem);
        }
        .thanks-grid {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            align-items: center;
            gap: clamp(2rem, 5vw, 4.25rem);
            width: min(1080px, 100%);
        }

        /* LEFT — framed lesson photo: same framing as the reference Thank You
           slide (3px soft border, 7px outer ring, big rounded corners, soft
           deep shadow, 5:4 crop).
           ═══ TECH LEAD — IMAGE INTEGRATION ═══
           No approved Paying Bills photograph exists in this project yet
           (slide 1 holds the same pending frame), so the frame keeps the
           neutral pending treatment. To connect the approved photo, put it
           inside .thanks-photo-inner:
             <img src="https://<approved-host>/img/paying-bills.jpg"
                  alt="Paying a bill on a smartphone"
                  style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
           and remove the placeholder svg below. Do NOT invent a URL or use
           random stock imagery — this slot is for the approved asset only. */
        .thanks-photo {
            position: relative;
            width: min(31vw, 48dvh, 450px);
            aspect-ratio: 5 / 4;
            border-radius: 1.65rem;
            overflow: hidden;
            border: 3px solid var(--frame-border);
            background: var(--surface);
            box-shadow: 0 0 0 7px var(--frame-ring), 0 22px 55px -32px rgba(79, 70, 229, 0.42);
        }
        .dark .thanks-photo {
            box-shadow: 0 0 0 7px var(--frame-ring), 0 22px 55px -32px rgba(0, 0, 0, 0.8);
        }
        .thanks-photo-inner {
            position: relative;
            width: 100%;
            height: 100%;
            background: var(--ph-fill);
            color: var(--ph-icon);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .thanks-photo-inner svg { width: 13%; height: auto; opacity: 0.75; }

        /* RIGHT — short decorative line above the heading */
        .thanks-rule {
            width: 48px;
            height: 4px;
            border-radius: 9999px;
            background: linear-gradient(90deg, #6366f1, #3b82f6);
        }

        /* RIGHT — big heading, one uniform BEC indigo→blue gradient */
        .thanks-title {
            margin: clamp(0.7rem, 2dvh, 1.15rem) 0 0;
            font-size: clamp(2.5rem, min(5.2vw, 9.6dvh), 5.25rem);
            font-weight: 900;
            letter-spacing: -0.045em;
            line-height: 1.05;
            background: linear-gradient(95deg, #4338ca 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        /* Platform reference lightens the heading gradient in dark mode */
        .dark .thanks-title {
            background: linear-gradient(95deg, #a5b4fc 0%, #93c5fd 100%);
            -webkit-background-clip: text;
            background-clip: text;
        }

        /* RIGHT — lesson review questions, same typography as the reference
           description lines (simple clean text — no cards, no icons) */
        .thanks-questions {
            margin: clamp(0.85rem, 2.4dvh, 1.4rem) 0 0;
            display: flex;
            flex-direction: column;
            gap: clamp(0.4rem, 1.2dvh, 0.65rem);
        }
        .thanks-questions p {
            margin: 0;
            font-size: clamp(0.85rem, 1.7dvh, 1.05rem);
            font-weight: 500;
            line-height: 1.5;
            color: var(--muted);
        }

        /* RIGHT — Start Again button (blue→indigo→purple gradient, restart icon) */
        .start-again {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            min-width: 185px;
            margin-top: clamp(1.1rem, 3dvh, 1.9rem);
            border: none;
            cursor: pointer;
            border-radius: 1rem;
            background: linear-gradient(to top right, #3b82f6, #6366f1, #9333ea);
            color: #fff;
            padding: clamp(0.62rem, 1.5dvh, 0.85rem) clamp(1.35rem, 3vw, 1.7rem);
            font-family: inherit;
            font-size: clamp(0.86rem, 1.9dvh, 1rem);
            font-weight: 800;
            box-shadow: 0 16px 34px -22px rgba(79, 70, 229, 0.75);
            transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .start-again:hover {
            transform: translateY(-2px);
            filter: brightness(1.1);
            box-shadow: 0 18px 38px -22px rgba(79, 70, 229, 0.85);
        }
        .start-again:active { transform: scale(0.97); }
        .start-again:focus-visible {
            outline: none;
            box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.35), 0 16px 34px -22px rgba(79, 70, 229, 0.75);
        }
        .start-again svg { width: 1.15em; height: 1.15em; flex: none; transition: transform 0.25s ease; }
        .start-again:hover svg { transform: rotate(-12deg); }

        /* Entrance: CSS keyframes with fill-mode "backwards" — the resting
           state is fully visible, so a throttled animation clock can never
           leave content stuck invisible (worst case: no entrance). */
        .reveal { animation: thanks-rise 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) backwards; }
        .thanks-settled .reveal { animation: none; }
        .thanks-rule     { animation-delay: 0.05s; }
        .thanks-title    { animation-delay: 0.15s; }
        .thanks-questions { animation-delay: 0.25s; }
        .start-again     { animation-delay: 0.35s; }
        .thanks-photo    { animation-delay: 0.3s; }
        @keyframes thanks-rise {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
            .reveal { animation: none; }
        }

        /* Mobile — stack the two columns, keep everything centered & readable */
        @media (max-width: 880px) {
            .thanks-wrap { padding: 24px 16px 32px; align-items: flex-start; }
            .thanks-grid {
                grid-template-columns: 1fr;
                justify-items: center;
                gap: clamp(1.4rem, 3.5vh, 2.2rem);
                text-align: center;
            }
            .thanks-photo { width: min(62vw, 40dvh, 320px); }
            .thanks-rule { margin-left: auto; margin-right: auto; }
            .thanks-content { max-width: 34rem; }
            .thanks-title { font-size: clamp(2.4rem, 10vw, 3.4rem); }
            .thanks-questions p { font-size: 1rem; }
            .start-again { min-width: min(240px, 100%); min-height: 3rem; font-size: 1rem; }
        }
    </style>
</head>
<body class="h-full">
<div class="thanks">
    <div class="thanks-bg">
        <div class="glow-a"></div>
        <div class="glow-b"></div>
        <div class="glow-c"></div>
    </div>

    <div class="thanks-wrap">
        <div class="thanks-grid">
            <!-- LEFT column — framed lesson photo (pending the approved asset;
                 see TECH LEAD comment in CSS) -->
            <div class="thanks-photo reveal">
                <div class="thanks-photo-inner" role="img" aria-label="Paying bills lesson photo pending">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
                </div>
            </div>

            <!-- RIGHT column — thank you content -->
            <div class="thanks-content" style="min-width:0">
                <div class="thanks-rule reveal"></div>

                <h1 class="thanks-title reveal">Thank you</h1>

                <div class="thanks-questions reveal">
                    <p>What can you say when you want to pay your bill?</p>
                    <p>How can you say you want to open a bank account?</p>
                    <p>What does “Cut your coat according to your cloth” mean?</p>
                </div>

                <button class="start-again reveal" id="btn-start-again">
                    <span>Start Again</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 12a9 9 0 1 1-2.64-6.36"/>
                        <path d="M21 3v6h-6"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        // Start Again → back to Slide 1 using the reader's own navigation
        // (direct same-origin API first, platform postMessage second, plain
        // link fallback when the slide is opened standalone).
        function restartLesson() {
            try {
                if (window.parent && window.parent !== window && typeof window.parent.goToSlide === 'function') {
                    window.parent.goToSlide(0);
                    return;
                }
            } catch (e) {}

            try {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'BEC_NAV', action: 'first' }, '*');
                    return;
                }
            } catch (e) {}

            window.location.href = 'slide-1.html';
        }

        document.getElementById('btn-start-again').addEventListener('click', restartLesson);

        // No audio on this slide; kept so the reader can always call it.
        window.stopSlideAudio = function stopSlideAudio() {};

        // Hard stop for the entrance so nothing can linger mid-fade
        setTimeout(() => document.documentElement.classList.add('thanks-settled'), 2500);

        // Replay the CSS entrance when the reader calls resetSlide
        window.resetSlide = function resetSlide() {
            document.documentElement.classList.remove('thanks-settled');
            document.querySelectorAll('.reveal').forEach((el) => {
                el.style.animation = 'none';
                void el.offsetWidth; // reflow so the animation restarts
                el.style.animation = '';
            });
            setTimeout(() => document.documentElement.classList.add('thanks-settled'), 2500);
        };
    });
</script>
</body>
</html>
