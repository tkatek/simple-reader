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
    <style>
        /* ── New Vocabulary — replicated from the BEC reference vocabulary
              gallery (large gradient heading + subtitle, five photo-first
              white cards per row, speaker button on the photo, light-grey
              example box). All 12 words render together on ONE scrolling
              page: this is the single BEC slide where vertical scrolling
              is allowed, so the shell constraints are relaxed here only. */

        html { height: 100%; }
        body { min-height: 100%; overflow-x: hidden; }

        .vocab-page {
            height: auto;
            min-height: 100dvh;
            overflow: visible;
            /* the background glow bleeds past the right edge — clip it so the
               long scrolling page never gains a horizontal overflow */
            overflow-x: clip;
        }

        .vocab-stage {
            justify-content: flex-start;
            gap: clamp(1.1rem, 2.6vh, 1.9rem);
            padding: clamp(0.9rem, 2.4vh, 1.6rem) clamp(1rem, 3vw, 2.5rem) clamp(2.2rem, 6vh, 3.25rem);
        }

        /* Heading — same treatment as the reference vocabulary slides */
        .vocab-head { text-align: center; flex: 0 0 auto; }
        .vocab-title {
            font-size: clamp(1.9rem, 4vw, 2.75rem);
            font-weight: 900;
            letter-spacing: -0.02em;
            line-height: 1.08;
            background: linear-gradient(100deg, var(--bec-brand), #3b82f6);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        .dark .vocab-title { background-image: linear-gradient(100deg, #818cf8, #60a5fa); }
        .vocab-sub {
            margin-top: 0.45rem;
            font-size: clamp(0.85rem, 1.7vw, 1.05rem);
            font-weight: 600;
            color: var(--bec-text-2);
        }

        /* Gallery — a wrapping flex (not a grid) so EVERY row is centered:
           rows of 5 + 5 render full, and the last 2 cards sit centered in
           the final row at the exact same width. No card is ever stretched. */
        .vocab-gallery {
            --gap: clamp(0.75rem, 1.6vw, 1.2rem);
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: var(--gap);
            width: min(1360px, 100%);
        }
        .vocab-card {
            /* the -0.3px guard absorbs subpixel rounding so a full row of
               cards never wraps one card short at borderline widths */
            flex: 0 0 calc((100% - 4 * var(--gap)) / 5 - 0.3px);
            max-width: calc((100% - 4 * var(--gap)) / 5 - 0.3px);
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: hidden;
            border-radius: 1rem;
            border: 1px solid var(--bec-border);
            background: var(--bec-surface);
            box-shadow: 0 8px 22px -12px rgba(15, 23, 42, 0.16);
        }

        /* Photo — upper section of the card, fixed ratio, cover-cropped */
        .vocab-photo {
            position: relative;
            width: 100%;
            aspect-ratio: 4 / 3;
            background: var(--bec-border);
            border-bottom: 1px solid var(--bec-border);
        }
        .vocab-photo img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        /* neutral slot while the photo is pending — kept clean and empty:
           no oversized icons or fake illustrations, just the reserved area */
        .vocab-photo .ph {
            position: absolute;
            inset: 0;
            background: var(--bec-border);
        }

        /* Speaker button pinned to the top-right of the photo */
        .vocab-audio {
            position: absolute;
            top: 0.55rem;
            right: 0.55rem;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1.9rem;
            height: 1.9rem;
            border-radius: 9999px;
            background: #ffffff;
            color: var(--bec-brand);
            border: none;
            cursor: pointer;
            box-shadow: 0 3px 9px -2px rgba(15, 23, 42, 0.35);
            transition: transform 0.15s ease, opacity 0.2s ease, filter 0.2s ease;
        }
        .vocab-audio:hover { transform: scale(1.07); }
        .vocab-audio:active { transform: scale(0.93); }
        /* no recording connected yet — visibly unavailable, never fakes playback */
        .vocab-audio[disabled] {
            opacity: 0.55;
            filter: saturate(0.4);
            cursor: not-allowed;
            pointer-events: none;
        }

        .vocab-body {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            gap: 0.32rem;
            padding: 0.78rem 0.85rem 0.85rem;
            min-width: 0;
        }
        .vocab-word {
            font-size: clamp(0.88rem, 1.05vw, 1rem);
            font-weight: 800;
            letter-spacing: -0.01em;
            line-height: 1.25;
            color: var(--bec-text);
        }
        .vocab-def {
            font-size: clamp(0.74rem, 0.9vw, 0.82rem);
            font-weight: 600;
            line-height: 1.4;
            color: var(--bec-text-2);
        }
        /* example sits in a subtle light-grey rounded area, anchored to the
           card bottom so every card in a row lands on the same baseline */
        .vocab-example {
            margin-top: auto;
            background: var(--bec-bg);
            border: 1px solid var(--bec-border);
            border-radius: 0.65rem;
            padding: 0.5rem 0.6rem;
            font-size: clamp(0.7rem, 0.85vw, 0.78rem);
            font-weight: 600;
            font-style: normal;
            line-height: 1.45;
            color: var(--bec-text-2);
        }

        /* ── Responsive columns: 5 desktop → 3 tablet → 2 → 1 phone ───── */
        @media (max-width: 1100px) {
            .vocab-card { flex-basis: calc((100% - 2 * var(--gap)) / 3 - 0.3px); max-width: calc((100% - 2 * var(--gap)) / 3 - 0.3px); }
        }
        @media (max-width: 700px) {
            .vocab-card { flex-basis: calc((100% - var(--gap)) / 2 - 0.3px); max-width: calc((100% - var(--gap)) / 2 - 0.3px); }
            .vocab-stage { padding: 20px 16px 30px; }
            .vocab-word { font-size: 1rem; }
            .vocab-def { font-size: 0.86rem; }
            .vocab-example { font-size: 0.8rem; padding: 0.55rem 0.65rem; }
        }
        @media (max-width: 430px) {
            .vocab-card { flex-basis: min(100%, 360px); max-width: min(100%, 360px); }
        }

        /* ── Entrance: CSS keyframes with fill-mode "backwards" — the resting
              state is fully visible, so a throttled or paused animation clock
              (background iframe) can never leave cards stuck invisible. ──── */
        .reveal { animation: vocab-rise 0.45s cubic-bezier(0.22, 0.61, 0.36, 1) backwards; }
        .vocab-card.reveal:nth-child(1)  { animation-delay: 0.03s; }
        .vocab-card.reveal:nth-child(2)  { animation-delay: 0.06s; }
        .vocab-card.reveal:nth-child(3)  { animation-delay: 0.09s; }
        .vocab-card.reveal:nth-child(4)  { animation-delay: 0.12s; }
        .vocab-card.reveal:nth-child(5)  { animation-delay: 0.15s; }
        .vocab-card.reveal:nth-child(6)  { animation-delay: 0.18s; }
        .vocab-card.reveal:nth-child(7)  { animation-delay: 0.21s; }
        .vocab-card.reveal:nth-child(8)  { animation-delay: 0.24s; }
        .vocab-card.reveal:nth-child(9)  { animation-delay: 0.27s; }
        .vocab-card.reveal:nth-child(10) { animation-delay: 0.30s; }
        .vocab-card.reveal:nth-child(11) { animation-delay: 0.33s; }
        .vocab-card.reveal:nth-child(12) { animation-delay: 0.36s; }
        @keyframes vocab-rise {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
            .reveal { animation: none; }
        }
    </style>
</head>
<body class="h-full">
<div class="bec-slide vocab-page">
    <div class="bec-glow"></div>

    <div class="bec-stage vocab-stage">
        <div class="vocab-head reveal">
            <h1 class="vocab-title">New Vocabulary</h1>
            <p class="vocab-sub">Paying Bills Vocabulary</p>
        </div>

        <!-- 12 vocabulary cards on ONE scrolling page — no carousel, no pager.
             Each card: photo (top) + speaker button + word + meaning + example.
             ═══ TECH LEAD — MEDIA INTEGRATION ═══
             1) Images: give every card a photo by setting img in VOCAB below
                (hosted URL) — the neutral slot is replaced by the picture
                (object-fit: cover keeps any photo shape undistorted).
             2) Audio: set audio in VOCAB (or VOCAB_AUDIO) to enable the
                card's speaker button. No TTS fallback by design. -->
        <div class="vocab-gallery" id="vocab-gallery"></div>
    </div>
</div>

<script>
    /* ═══ TECH LEAD: fill img / audio per word when assets are hosted ═══ */
    const VOCAB = [
        { word: "Saving account/ current account", meaning: "a bank account for keeping money safe", example: "I keep my money in a savings account." },
        { word: "deposi", meaning: "to put money into your account", example: "I deposit $500 at the bank." },
        { word: "withdraw", meaning: "to take money out of your account", example: "I withdraw $50 from the ATM." },
        { word: "bank statement", meaning: "a document showing money in and out", example: "Check your bank statement every month." },
        { word: "balance", meaning: "the amount of money you have in the bank", example: "My balance is $500." },
        { word: "sign", meaning: "to write your name on a document", example: "Please sign here." },
        { word: "transfer", meaning: "to move money from one bank to another", example: "I transfer money to my brother." },
        { word: "overdraw", meaning: "to take out more money than you have", example: "Don’t overdraw your account." },
        { word: "bank statement", meaning: "a document showing money in and out", example: "Check your bank statement every month." },
        { word: "bank branch", meaning: "a bank office in your city", example: "Visit the nearest bank branch." },
        { word: "transactions", meaning: "money going in and out of your account", example: "You made three transactions today." },
        { word: "ATM", meaning: "a machine that gives you money", example: "Get cash from the ATM." }
    ];
    const VOCAB_AUDIO = {}; // optional map: word → hosted audio URL

    const SPEAKER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>';

    document.addEventListener('DOMContentLoaded', () => {
        const gallery = document.getElementById('vocab-gallery');

        VOCAB.forEach(v => {
            const card = document.createElement('div');
            card.className = 'vocab-card reveal';

            const hasAudio = Boolean(v.audio || VOCAB_AUDIO[v.word]);
            const audioSrc = v.audio || VOCAB_AUDIO[v.word] || '';
            const audioBtn = `<button class="vocab-audio" data-audio="${audioSrc}" aria-label="Listen: ${v.word}" ${hasAudio ? '' : 'disabled title="Audio not yet available"'}>${SPEAKER_SVG}</button>`;

            const photo = v.img
                ? `<div class="vocab-photo"><img src="${v.img}" alt="${v.word}">${audioBtn}</div>`
                : `<div class="vocab-photo"><div class="ph" role="img" aria-label="Photo pending: ${v.word}"></div>${audioBtn}</div>`;

            card.innerHTML = `
                ${photo}
                <div class="vocab-body">
                    <p class="vocab-word">${v.word}</p>
                    <p class="vocab-def">${v.meaning}</p>
                    <p class="vocab-example">“${v.example}”</p>
                </div>`;
            gallery.appendChild(card);
        });

        /* Real recordings only: a button wakes up once its source exists. */
        let current = null;
        gallery.addEventListener('click', (e) => {
            const btn = e.target.closest('.vocab-audio');
            if (!btn || !btn.dataset.audio) return;
            if (current) { current.pause(); current.currentTime = 0; }
            const audio = new Audio(btn.dataset.audio);
            current = audio;
            audio.play();
        });

        window.stopSlideAudio = function stopSlideAudio() { if (current) { current.pause(); current.currentTime = 0; } };
        window.resetSlide = function resetSlide() { window.scrollTo(0, 0); };
    });
</script>
</body>
</html>
