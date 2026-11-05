// One-shot patcher: applies the shared design-system rules to all 13
// chapter-1 slides. Every replacement fails loudly if its anchor text
// is missing, so a silent no-op is impossible.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'C:/Users/HP/Desktop/soufinae/slides1/simple-reader/chapter-1';

const EMBEDDED_TOGGLE = `
            // Embedded in the reader: switch off this slide's own stage
            // paint so the reader's full-stage backdrop shows through
            // seamlessly (no seams, no unpainted strips).
            try {
                document.documentElement.classList.toggle('bec-embedded', window.parent !== window);
            } catch (e) {}`;

const patches = {
    'slide-1.html': [
        // Link the shared stylesheet (single source of truth) before local styles
        ['    <script src="https://cdn.tailwindcss.com"></script>\n',
         '    <script src="https://cdn.tailwindcss.com"></script>\n    <link rel="stylesheet" href="bec.css">\n'],
        // Harmonize the standalone base tone with the chapter stage wash
        ['            --bg: #f7f7fa;', '            --bg: #f3f4fb;'],
    ],
    'slide-2.html': [
        // Stat panel + quiz card on the shared standard width; shared type scale
        ['        .tf-stats {\n            width: min(740px, 100%);',
         '        .tf-stats {\n            width: min(var(--bec-w-standard), 100%);'],
        ['        .tf-stat-value {\n            display: block;\n            font-size: clamp(0.82rem, 1.9vh, 1.05rem);',
         '        .tf-stat-value {\n            display: block;\n            font-size: var(--bec-stat-value-size);'],
        ['        .tf-stat-label {\n            display: block;\n            font-size: clamp(0.52rem, 1.1vh, 0.64rem);',
         '        .tf-stat-label {\n            display: block;\n            font-size: var(--bec-stat-label-size);'],
        ['        .tf-quiz {\n            width: min(740px, 100%);',
         '        .tf-quiz {\n            width: min(var(--bec-w-standard), 100%);'],
        ['.tf-instruction { font-size: clamp(0.72rem, 1.5vh, 0.9rem); font-weight: 800; color: var(--bec-brand); }',
         '.tf-instruction { font-size: var(--bec-instruction-size); font-weight: 800; color: var(--bec-brand); }'],
        ['.tf-qtext { font-size: clamp(0.85rem, 2vh, 1.15rem); font-weight: 800; line-height: 1.45; color: var(--bec-text); }',
         '.tf-qtext { font-size: var(--bec-question-size); font-weight: 800; line-height: 1.4; color: var(--bec-text); }'],
        ['        .tf-ans {\n            display: inline-flex;\n            align-items: center;\n            justify-content: flex-start;\n            min-height: clamp(2.2rem, 5vh, 3rem);\n            padding: 0.5rem 1rem;\n            border-radius: 0.7rem;',
         '        .tf-ans {\n            display: inline-flex;\n            align-items: center;\n            justify-content: flex-start;\n            min-height: clamp(2.9rem, 7.2vh, 4.1rem);\n            padding: 0.6rem 1.2rem;\n            border-radius: 1rem;'],
        ['    font-size: clamp(0.78rem, 1.7vh, 0.95rem);\n            font-weight: 700;\n            cursor: pointer;\n            transition: all 0.2s ease;\n            text-align: left;',
         '    font-size: var(--bec-ans-size);\n            font-weight: 700;\n            cursor: pointer;\n            transition: all 0.2s ease;\n            text-align: left;'],
        ['        .tf-nav .bec-btn { width: 100%; padding: 0.5rem 0.4rem; font-size: clamp(0.6rem, 1.3vh, 0.74rem); }',
         '        .tf-nav .bec-btn { width: 100%; padding: 0.5rem 0.4rem; }'],
    ],
    'slide-3.html': [
        // Title on the shared responsive scale + standard gradient
        ['        .obj3-title {\n            font-size: clamp(1.9rem, 5vh, 3.05rem);\n            font-weight: 800;\n            letter-spacing: -0.03em;\n            line-height: 1.1;\n            background: linear-gradient(92deg, #4f46e5, #8b5cf6);',
         '        .obj3-title {\n            font-size: var(--bec-title-size);\n            font-weight: 800;\n            letter-spacing: -0.02em;\n            line-height: 1.12;\n            background: linear-gradient(100deg, var(--bec-brand), #3b82f6);'],
        ['        .dark .obj3-title { background: linear-gradient(92deg, #818cf8 10%, #a78bfa 60%, #c4b5fd 100%); -webkit-background-clip: text; background-clip: text; }',
         '        .dark .obj3-title { background: linear-gradient(100deg, #818cf8, #60a5fa); -webkit-background-clip: text; background-clip: text; }'],
        ['        .obj3-sub {\n            margin-top: clamp(0.45rem, 1.1vh, 0.72rem);\n            font-size: clamp(0.86rem, 2vh, 1.12rem);',
         '        .obj3-sub {\n            margin-top: clamp(0.4rem, 1.1vh, 0.72rem);\n            font-size: var(--bec-sub-size);'],
        ['            width: min(730px, 100%);', '            width: min(var(--bec-w-standard), 100%);'],
    ],
    'slide-4.html': [
        // Oversized heading/components → shared chapter scale
        ['        .warm-title {\n            font-size: clamp(2.4rem, 9.8vh, 4.7rem);',
         '        .warm-title {\n            font-size: var(--bec-title-size);'],
        ['        .warm-sub {\n            margin-top: clamp(0.35rem, 1.4vh, 0.8rem);\n            font-size: clamp(1rem, 3.4vh, 1.6rem);',
         '        .warm-sub {\n            margin-top: clamp(0.35rem, 1.4vh, 0.8rem);\n            font-size: var(--bec-sub-size);'],
        ['            width: clamp(2.9rem, 9.2vh, 4.25rem);\n            height: clamp(2.9rem, 9.2vh, 4.25rem);\n            border-radius: 22%;',
         '            width: clamp(2.6rem, 6.6vh, 3.5rem);\n            height: clamp(2.6rem, 6.6vh, 3.5rem);\n            border-radius: 22%;'],
        ['        .warm-card-label {\n            min-width: 0;\n            margin-right: auto;\n            font-size: clamp(0.88rem, 2.9vh, 1.32rem);',
         '        .warm-card-label {\n            min-width: 0;\n            margin-right: auto;\n            font-size: clamp(0.85rem, 2.1vh, 1.12rem);'],
        ['            min-width: clamp(5rem, 10vw, 6rem);\n            height: clamp(2.4rem, 6.4vh, 3rem);\n            padding: 0 clamp(0.85rem, 1.7vw, 1.2rem);\n            border-radius: 1.05rem;',
         '            min-width: clamp(5rem, 10vw, 6rem);\n            height: clamp(2.2rem, 5.2vh, 2.8rem);\n            padding: 0 clamp(0.85rem, 1.7vw, 1.2rem);\n            border-radius: 1.05rem;'],
        ['            font-size: clamp(0.82rem, 2.35vh, 1.08rem);\n            font-weight: 800;\n            font-variant-numeric: tabular-nums;',
         '            font-size: clamp(0.8rem, 1.9vh, 1rem);\n            font-weight: 800;\n            font-variant-numeric: tabular-nums;'],
        ['        .warm-q {\n            max-width: 26rem;\n            font-size: clamp(1.4rem, 5.1vh, 2.45rem);',
         '        .warm-q {\n            max-width: 30rem;\n            font-size: var(--bec-question-size);'],
        ['        .warm-q-hint {\n            font-size: clamp(0.78rem, 2.1vh, 1rem);',
         '        .warm-q-hint {\n            font-size: clamp(0.8rem, 1.9vh, 1rem);'],
        ['            height: clamp(2.7rem, 7.9vh, 3.65rem);\n            padding: 0 clamp(1.25rem, 2.9vw, 2.05rem);',
         '            height: clamp(2.6rem, 6.8vh, 3.75rem);\n            padding: 0 clamp(1.25rem, 2.9vw, 2.05rem);'],
        ['            font-size: clamp(0.85rem, 2.5vh, 1.15rem);\n            font-weight: 800;\n            white-space: nowrap;',
         '            font-size: clamp(0.85rem, 2.1vh, 1.1rem);\n            font-weight: 800;\n            white-space: nowrap;'],
        ['        .warm-dot {\n            width: clamp(0.82rem, 2.45vh, 1.15rem);\n            height: clamp(0.82rem, 2.45vh, 1.15rem);',
         '        .warm-dot {\n            width: clamp(0.7rem, 1.9vh, 0.95rem);\n            height: clamp(0.7rem, 1.9vh, 0.95rem);'],
    ],
    'slide-5.html': [],
    'slide-6.html': [
        // Title & subtitle to the shared scale, standard gradient
        ['        .ivq-title {\n            font-size: clamp(1.7rem, 8.3vh, 3.75rem);\n            font-weight: 800;\n            letter-spacing: -0.03em;\n            line-height: 1.02;\n            background: linear-gradient(92deg, #3730a3 0%, #1d4ed8 55%, #2563eb 100%);',
         '        .ivq-title {\n            font-size: var(--bec-title-size);\n            font-weight: 800;\n            letter-spacing: -0.02em;\n            line-height: 1.12;\n            background: linear-gradient(100deg, var(--bec-brand), #3b82f6);'],
        ['        .dark .ivq-title {\n            background: linear-gradient(92deg, #a5b4fc 0%, #93c5fd 100%);',
         '        .dark .ivq-title {\n            background: linear-gradient(100deg, #818cf8, #60a5fa);'],
        ['        .ivq-sub {\n            margin: clamp(0.25rem, 0.8vh, 0.5rem) 0 0;\n            font-size: clamp(0.9rem, 2.9vh, 1.35rem);',
         '        .ivq-sub {\n            margin: clamp(0.25rem, 0.8vh, 0.5rem) 0 0;\n            font-size: var(--bec-sub-size);'],
        // Stat panel: shared width + type scale (matches the other quiz slides)
        ['        .ivq-stats {\n            width: min(1060px, 100%);',
         '        .ivq-stats {\n            width: min(var(--bec-w-standard), 100%);'],
        ['        .ivq-stat-label {\n            display: block;\n            font-size: clamp(0.6rem, 1.85vh, 0.85rem);',
         '        .ivq-stat-label {\n            display: block;\n            font-size: var(--bec-stat-label-size);'],
        ['        .ivq-stat-value {\n            display: block;\n            font-size: clamp(1.05rem, 3.9vh, 1.8rem);',
         '        .ivq-stat-value {\n            display: block;\n            font-size: var(--bec-stat-value-size);'],
        // Quiz card on the shared wide-quiz width
        ['        .ivq-card {\n            width: min(1060px, 100%);',
         '        .ivq-card {\n            width: min(var(--bec-w-quiz), 92%);'],
        ['            border-radius: 1.75rem;\n            box-shadow: var(--ivq-card-shadow);',
         '            border-radius: var(--bec-card-radius);\n            box-shadow: var(--ivq-card-shadow);'],
        ['            padding: clamp(0.45rem, 1.2vh, 0.7rem) clamp(1rem, 2.6vw, 1.7rem);\n            font-size: clamp(0.8rem, 2.8vh, 1.45rem);',
         '            padding: clamp(0.45rem, 1.2vh, 0.7rem) clamp(1rem, 2.6vw, 1.7rem);\n            font-size: var(--bec-instruction-size);'],
        ['            padding: clamp(0.42rem, 1.3vh, 0.62rem) clamp(0.9rem, 2.2vw, 1.4rem);\n            font-size: clamp(0.7rem, 1.95vh, 0.95rem);',
         '            padding: clamp(0.42rem, 1.3vh, 0.62rem) clamp(0.9rem, 2.2vw, 1.4rem);\n            font-size: clamp(0.68rem, 1.5vh, 0.84rem);'],
        ['        .ivq-question {\n            margin: clamp(0.35rem, 1.5vh, 0.9rem) 0;\n            font-size: clamp(1.1rem, 5.1vh, 2.3rem);',
         '        .ivq-question {\n            margin: clamp(0.35rem, 1.5vh, 0.9rem) 0;\n            font-size: var(--bec-question-size);'],
        ['            min-height: clamp(3rem, 8.5vh, 4.2rem);\n            padding: clamp(0.6rem, 1.7vh, 0.9rem) clamp(1rem, 2.8vw, 1.7rem);',
         '            min-height: clamp(2.9rem, 7.2vh, 4.1rem);\n            padding: clamp(0.6rem, 1.7vh, 0.9rem) clamp(1rem, 2.8vw, 1.7rem);'],
        ['            font-size: clamp(0.85rem, 3.25vh, 1.6rem);\n            font-weight: 700;\n            line-height: 1.3;',
         '            font-size: var(--bec-ans-size);\n            font-weight: 700;\n            line-height: 1.3;'],
        ['            min-height: clamp(2.5rem, 7.4vh, 3.85rem);\n            padding: clamp(0.55rem, 1.6vh, 0.85rem) clamp(1.1rem, 3vw, 1.9rem);',
         '            min-height: clamp(2.5rem, 6.8vh, 3.75rem);\n            padding: clamp(0.55rem, 1.6vh, 0.85rem) clamp(1.1rem, 3vw, 1.9rem);'],
        ['            font-size: clamp(0.8rem, 2.55vh, 1.3rem);\n            font-weight: 800;',
         '            font-size: var(--bec-btn-size);\n            font-weight: 800;'],
    ],
    'slide-7.html': [
        // Stage base joins the chapter lavender wash (was pure white)
        ['            --s7-bg: #ffffff;', '            --s7-bg: #f3f4fb;'],
        ['        .s7-title {\n            margin-top: 23px;\n            text-align: center;\n            font-size: 40px;',
         '        .s7-title {\n            margin-top: 23px;\n            text-align: center;\n            font-size: var(--bec-title-size, 44px);'],
    ],
    'slide-8.html': [
        // Wider teaching layout + standard heading (was inline-shrunk to 23px)
        ['        .bank-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: clamp(0.6rem, 1.6vw, 1.1rem); align-items: stretch; width: min(1000px, 100%); max-height: 100%; }',
         '        .bank-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: clamp(0.8rem, 2vw, 1.4rem); align-items: stretch; width: min(var(--bec-w-wide, 1152px), 100%); max-height: 100%; }'],
        ['        @media (max-width: 820px) { .bank-grid { grid-template-columns: 1fr; } .bank-video-wrap { max-width: 480px; margin: 0 auto; width: 100%; } }',
         '        @media (max-width: 820px) { .bank-grid { grid-template-columns: 1fr; } .bank-video-wrap { max-width: 560px; margin: 0 auto; width: 100%; } }'],
        ['        .dlg-card { display: flex; flex-direction: column; gap: clamp(0.4rem, 1.2vh, 0.7rem); padding: clamp(0.7rem, 2vh, 1.2rem); min-height: 0; }',
         '        .dlg-card { display: flex; flex-direction: column; gap: clamp(0.5rem, 1.4vh, 0.85rem); padding: clamp(1.05rem, 2.8vh, 1.7rem); min-height: 0; }'],
        ['        .dlg-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; justify-content: center; gap: clamp(0.28rem, 0.9vh, 0.5rem); }',
         '        .dlg-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; justify-content: center; gap: clamp(0.35rem, 1.1vh, 0.6rem); }'],
        ['        .key-legend { display: inline-flex; align-items: center; gap: 0.35rem; font-size: clamp(0.56rem, 1.2vh, 0.68rem);',
         '        .key-legend { display: inline-flex; align-items: center; gap: 0.35rem; font-size: clamp(0.62rem, 1.4vh, 0.78rem);'],
        ['            <h1 class="bec-title" style="font-size:clamp(1.3rem,3.2vh,2.3rem)">At the Bank <span style="font-weight:800;color:var(--bec-text-2)">— 1. Setting up a Bank Account</span></h1>',
         '            <h1 class="bec-title" style="margin-top:0.35rem">At the Bank</h1>\n            <p class="bec-sub">Video Script · 1. Setting up a Bank Account</p>'],
    ],
    'slide-9.html': [
        // Title on the shared scale; layout joins the wide family
        ['        .lang-title {\n            font-size: clamp(1.85rem, 5.2vh, 3.1rem);\n            font-weight: 900;',
         '        .lang-title {\n            font-size: var(--bec-title-size);\n            font-weight: 800;'],
        ['        .lang-sub {\n            margin-top: 0.4rem;\n            font-size: clamp(0.78rem, 1.7vh, 1rem);',
         '        .lang-sub {\n            margin-top: 0.4rem;\n            font-size: var(--bec-sub-size);'],
        ['            gap: clamp(1.2rem, 3.5vw, 3rem);\n            width: min(960px, 100%);',
         '            gap: clamp(1.2rem, 3.5vw, 3rem);\n            width: min(var(--bec-w-wide, 1152px), 100%);'],
        ['            width: min(520px, 100%);', '            width: min(640px, 100%);'],
        ['        .lang-text {\n            flex: 1 1 auto;\n            min-width: 0;\n            text-align: left;\n            font-size: clamp(0.86rem, 2.05vh, 1.12rem);',
         '        .lang-text {\n            flex: 1 1 auto;\n            min-width: 0;\n            text-align: left;\n            font-size: clamp(0.95rem, 2.3vh, 1.3rem);'],
        ['            min-height: clamp(3.1rem, 7.8vh, 4.2rem);\n            padding: clamp(0.55rem, 1.8vh, 0.95rem) clamp(0.95rem, 2.2vw, 1.4rem);',
         '            min-height: clamp(3.2rem, 8.4vh, 4.6rem);\n            padding: clamp(0.7rem, 2vh, 1.1rem) clamp(1.05rem, 2.4vw, 1.6rem);'],
    ],
    'slide-10.html': [],
    'slide-11.html': [
        // Heading inherits the shared responsive token (drop the 8.1vh override)
        ['        /* Gradient headline — indigo → blue across the whole title */\n        .bec-title {\n            margin-top: clamp(0.6rem, 3vh, 1.05rem);\n            font-size: clamp(2.1rem, 8.1vh, 3.6rem);\n            font-weight: 800;\n            letter-spacing: -0.015em;\n            line-height: 1.08;\n            background: linear-gradient(100deg, var(--bec-brand) 5%, #3b82f6 95%);\n            -webkit-background-clip: text;\n            background-clip: text;\n            color: transparent;\n        }',
         '        /* Gradient headline — the shared chapter title scale */\n        .bec-title {\n            margin-top: clamp(0.5rem, 2.4vh, 0.9rem);\n        }'],
        // Kicker on the shared scale
        ['        .bec-kicker {\n            padding: clamp(0.55rem, 2vh, 0.78rem) clamp(1.1rem, 2.4vw, 1.6rem);\n            font-size: clamp(0.72rem, 1.55vw, 1.05rem);\n            letter-spacing: 0.2em;\n            line-height: 1;\n        }',
         '        .bec-kicker {\n            padding: clamp(0.4rem, 1.4vh, 0.55rem) clamp(1rem, 2.2vw, 1.5rem);\n            letter-spacing: 0.2em;\n            line-height: 1;\n        }'],
        // Wide quiz card: shared width token
        ['        .bec-quiz {\n            width: min(1080px, 85vw);\n            max-width: 100%;',
         '        .bec-quiz {\n            width: min(var(--bec-w-quiz, 1080px), 92%);\n            max-width: 100%;'],
        ['        .bec-quiz-instruction { font-size: clamp(0.9rem, 2.2vh, 1.05rem); }',
         '        .bec-quiz-instruction { font-size: var(--bec-instruction-size); }'],
        ['        .bec-qcount {\n            font-size: clamp(0.74rem, 1.8vh, 0.9rem);\n            padding: clamp(0.5rem, 2vh, 0.9rem) clamp(0.9rem, 1.6vw, 1.35rem);\n        }',
         '        .bec-qcount {\n            font-size: clamp(0.68rem, 1.5vh, 0.84rem);\n            padding: clamp(0.35rem, 1.4vh, 0.55rem) clamp(0.8rem, 1.6vw, 1.2rem);\n        }'],
        ['        .bec-progress {\n            height: clamp(0.5rem, 1.4vh, 0.68rem);\n            margin-top: clamp(0.7rem, 1.95vh, 1.1rem);\n            background: #e9ebf7;\n        }',
         '        .bec-progress {\n            height: clamp(0.5rem, 1.4vh, 0.68rem);\n            margin-top: clamp(0.7rem, 1.95vh, 1.1rem);\n        }'],
        ['        .bec-question {\n            max-width: 82%;\n            margin: clamp(1.2rem, 4.4vh, 2rem) auto 0;\n            font-size: clamp(1.25rem, 4.1vh, 1.85rem);',
         '        .bec-question {\n            max-width: 86%;\n            margin: clamp(1.2rem, 4.4vh, 2rem) auto 0;\n            font-size: var(--bec-question-size);'],
        ['        .bec-ans {\n            min-height: clamp(2.7rem, 9.4vh, 4.25rem);\n            padding: clamp(0.7rem, 2vh, 1.1rem) clamp(0.8rem, 1.4vw, 1.2rem);\n            border-radius: clamp(0.95rem, 3vh, 1.4rem);',
         '        .bec-ans {\n            min-height: clamp(2.9rem, 7.2vh, 4.1rem);\n            padding: clamp(0.6rem, 1.7vh, 0.95rem) clamp(0.9rem, 1.6vw, 1.3rem);\n            border-radius: 1rem;'],
        ['            font-size: clamp(0.9rem, 2.35vh, 1.08rem);\n            font-weight: 700;\n            line-height: 1.25;\n        }',
         '            font-size: var(--bec-ans-size);\n            font-weight: 700;\n            line-height: 1.25;\n        }'],
        ['        .bec-feedback {\n            min-height: clamp(1.9rem, 4.2vh, 2.5rem);\n            margin-top: clamp(0.7rem, 1.7vh, 1.05rem);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: clamp(0.82rem, 2.1vh, 1rem);\n        }',
         '        .bec-feedback {\n            min-height: clamp(1.7rem, 4vh, 2.3rem);\n            margin-top: clamp(0.7rem, 1.7vh, 1.05rem);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: clamp(0.75rem, 1.8vh, 0.98rem);\n        }'],
        ['        .bec-quiznav .bec-btn {\n            min-height: clamp(2.5rem, 8.9vh, 4rem);\n            min-width: clamp(9.5rem, 15.5vw, 12.5rem);\n            padding: clamp(0.6rem, 2vh, 1rem) clamp(1.2rem, 2.6vw, 2.1rem);\n            border-radius: clamp(0.95rem, 3.6vh, 1.65rem);\n            font-size: clamp(0.85rem, 2.2vh, 1.02rem);\n            line-height: 1;\n        }',
         '        .bec-quiznav .bec-btn {\n            min-height: clamp(2.5rem, 6.8vh, 3.75rem);\n            min-width: clamp(8rem, 13vw, 10.5rem);\n            padding: clamp(0.55rem, 1.6vh, 0.85rem) clamp(1.1rem, 2.6vw, 1.9rem);\n            font-size: var(--bec-btn-size);\n            line-height: 1;\n        }'],
        ['        @media (max-width: 640px) {\n            .bec-quiz { width: 92%; }',
         '        @media (max-width: 640px) {\n            .bec-quiz { width: 96%; }'],
    ],
    'slide-12.html': [
        // Heading joins the shared scale; stats panel the shared width
        ['        .dd-title {\n            margin: 0;\n            font-size: clamp(1.5rem, 4.3vh, 2.25rem);',
         '        .dd-title {\n            margin: 0;\n            font-size: var(--bec-title-size);'],
        ['        .dd-sub {\n            margin: 0.35rem 0 0;\n            font-size: clamp(0.8rem, 1.9vh, 1.02rem);',
         '        .dd-sub {\n            margin: 0.35rem 0 0;\n            font-size: var(--bec-sub-size);'],
        ['        .dd-stats {\n            width: min(920px, 100%);',
         '        .dd-stats {\n            width: min(var(--bec-w-standard), 100%);'],
    ],
    'slide-13.html': [
        // Link the shared stylesheet + harmonize the standalone base tone
        ['    <script src="https://cdn.tailwindcss.com"></script>\n',
         '    <script src="https://cdn.tailwindcss.com"></script>\n    <link rel="stylesheet" href="bec.css">\n'],
        ['            --bg: #f7f7fa;', '            --bg: #f3f4fb;'],
    ],
};

let failures = 0;
for (let i = 1; i <= 13; i++) {
    const name = `slide-${i}.html`;
    const file = join(DIR, name);
    let src = readFileSync(file, 'utf8');

    // 1. The common embedded-detection toggle (inserted once, in the theme IIFE)
    const anchor = '            document.documentElement.classList.toggle(\'dark\', useDark);\n        })();';
    if (!src.includes(EMBEDDED_TOGGLE)) {
        if (!src.includes(anchor)) { console.error(`${name}: MISSING theme-IIFE anchor`); failures++; continue; }
        src = src.replace(anchor, '            document.documentElement.classList.toggle(\'dark\', useDark);\n' + EMBEDDED_TOGGLE + '\n        })();');
    }

    // 2. Per-slide patch pairs
    for (const [find, replace] of patches[name] || []) {
        if (!src.includes(find)) { console.error(`${name}: MISSING pattern → ${find.slice(0, 90).replace(/\n/g, ' ')}…`); failures++; continue; }
        src = src.replace(find, replace);
    }

    writeFileSync(file, src);
    console.log(`${name}: ok (${(patches[name] || []).length} patches + toggle)`);
}
process.exit(failures ? 1 : 0);
