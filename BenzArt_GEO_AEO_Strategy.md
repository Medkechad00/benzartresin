# BenzArt — GEO & AEO Strategy

**Prepared:** August 2026
**Method:** `claude-seo` skill (`skills/seo-geo`, `agents/seo-geo`), applied to the BenzArt codebase
**Companions:** `BenzArt_SEO_Strategy.md` (classic SEO), `BenzArt_Sales_Strategy.md` (conversion)

---

## 0. Read this first: nothing below matters until the domain resolves

Measured 8 Aug 2026:

| Domain | DNS | Serving |
|---|---|---|
| `benzartresin.com` | **No A record, no NS record** | Nothing |
| `benzart.com` | NS = `forsale.hugedomainsdns.com` | **HugeDomains parking page, listed for sale at $495** |

The site is not deployed. Every GEO/AEO signal in this document — llms.txt, robots rules, schema, canonicals — is built and verified locally but **unreachable by any crawler or answer engine**.

Two consequences worth stating plainly:

1. **Search Console verification cannot succeed.** `benzart.com/googlec88517bf2a72f890.html` returns HTTP 200, but the body is the HugeDomains page, not the verification token. The parking server returns 200 for every path, which is also why `/llms.txt` there returns 43KB of parking HTML.
2. **The GA property will report nothing**, because `G-G78WJFE4P2` is not on the parked page. The gtag on `benzart.com` is HugeDomains' own `UA-7117339-4`.

**Action zero:** register/point the real domain, deploy, then verify. Everything else is ready.

---

## 1. Why GEO/AEO is worth real effort for this business

Two facts from the skill, both load-bearing here:

- **Brand mentions correlate ~3× more strongly with AI citation than backlinks** (Ahrefs, Dec 2025, 75,000 brands). YouTube mentions correlate ~0.737; Domain Rating ~0.266.
- **Only 11% of domains are cited by both ChatGPT and Google AI Overviews** for the same query. They are separate visibility problems.

For a made-to-order atelier this matters more than for most businesses. The buyer's questions — *"how long does a resin table take"*, *"can I choose the slab"*, *"can these go outdoors"* — are exactly the questions answer engines are asked and answer directly. If the engine answers from a competitor's page, the visitor never reaches the site. BenzArt's honest, specific answers are a genuine asset here, because vague marketing copy is what most competitors publish.

---

## 2. Baseline audit — measured, not estimated

Scored against the skill's five weighted categories. **The skill defines weights but no rubric mapping evidence to a sub-score**, so the numbers below are my judgement against its own strong/weak signal lists, and are stated as ranges where the evidence is thin.

| Category | Weight | Score | Basis |
|---|---:|---:|---|
| Citability | 25% | **55**/100 | FAQ corpus strong; passage length far off target |
| Structural readability | 20% | **80**/100 | Clean hierarchy, tables, lists; heading format weak |
| Multi-modal | 15% | **45**/100 | Images present, alt text good; no video, no diagrams |
| Authority & brand | 20% | **35**/100 | No author entity, no third-party presence |
| Technical accessibility | 20% | **90**/100 | Fully prerendered, crawlers allowed, llms.txt live |
| **Weighted total** | | **≈61/100** | |

### 2.1 Citability — 55

Measured across 129 H2 sections in the 18 English articles:

| Metric | Skill target | Actual |
|---|---|---|
| Passage length | **134-167 words** | median **87**, mean 92 |
| Sections in band | — | **6 / 129 (4.7%)** |
| Sections under 134 | — | **116 / 129 (90%)** |
| Intro before first H2 | answer in first 40-60 words | median **39 words** |

**Strength:** all 18 articles carry FAQ frontmatter, 39 Q&A pairs total, each a self-contained answer. That is the single most citable asset on the site and it already exists.

**Weakness:** 90% of sections are shorter than the skill's citation band. Sections average 87 words — they read well, but they are often too short to stand alone as an extracted answer.

*My caveat, stated honestly:* I am moderately sceptical of 134-167 as a hard target. The skill asserts it three times but cites no study, and short, dense passages are not obviously worse for extraction than padded ones. **Do not pad prose to hit a number.** The defensible version of this recommendation is narrower: sections that answer a discrete question should be long enough to answer it without the reader needing the surrounding page. Some of the 87-word sections already clear that bar.

### 2.2 Structural readability — 80

Strong: consistent H1→H2→H3, comparison tables, ordered/unordered lists, short paragraphs, and an on-page FAQ block on every article.

Weak: **only 35 of 129 H2s (27%) are question-format.** The skill wants headings that match query patterns. Most current headings are noun phrases ("The four stages", "What drives the price"), which are good editorial headings and poor query matches.

### 2.3 Multi-modal — 45

Every article has a hero image with genuinely descriptive alt text. Nothing else: no video, no process diagrams, no comparison charts. The skill claims multi-modal content sees **156% higher selection rates**, though again it gives no source.

This is the weakest *addressable* category for a craft business, which is unusual — a workshop is inherently visual, and process video is the most natural content this business could produce.

### 2.4 Authority & brand — 35, the real bottleneck

| Signal | Status |
|---|---|
| Author byline with credentials | **Absent** — articles are authored by `Organization`, not a `Person` |
| Publication / updated dates | Present in frontmatter and `BlogPosting` |
| Organization schema + `sameAs` | Present — Instagram, Pinterest |
| Wikipedia / Wikidata entity | **None** |
| YouTube presence | **None** — this is the single highest-correlating signal at ~0.737 |
| Reddit presence | **None** |
| LinkedIn | **None** |

Everything on-site is done. Everything off-site is missing. Since brand mentions outweigh backlinks ~3:1 for AI citation, **this category is where the ceiling actually is** — and none of it is a code change.

### 2.5 Technical accessibility — 90

| Check | Status |
|---|---|
| SSR / prerendered (crawlers don't run JS) | **92 static HTML files, 97/97 routes prerendered** |
| AI crawlers allowed in robots.txt | **Yes** — 8 agents named explicitly |
| llms.txt present | **Yes**, generated, 2,589 words |
| RSL 1.0 licensing | **Not implemented** |
| JSON-LD in initial HTML | **Yes**, verified parsing on `/inquiry` |

On RSL 1.0: the skill names it as a check and lists its backers, but **provides no syntax, file location, or example**. It is not implementable from the skill alone, and I will not invent a format. Deferred until the spec is confirmed from source.

---

## 3. What was changed in this pass

| Change | Category | Why |
|---|---|---|
| Removed `HowTo` schema from `/inquiry` | Technical | Deprecated by Google Sept 2023; skill hard rule. Produced no rich result. |
| Replaced with `FAQPage` (4 Q&A) + `BreadcrumbList` | Citability | Same four process steps, phrased as the questions people actually ask |
| Added `## Answered questions` to llms.txt | Citability | All 39 Q&A pairs, verbatim, each with a `Source:` URL |
| Added negative constraints to llms.txt | Accuracy | Prevents invented lead times, fake reviews, outdoor-use claims |
| `BASE_URL` now env-overridable | Technical | Stops a staging build emitting production canonicals |
| AI crawler rules in robots.txt | Technical | 8 agents named; several check their own UA rather than `*` |

The `llms.txt` `## Answered questions` block is the most valuable of these: it lets an engine answer correctly without fetching a page, and attributes every answer to a URL.

---

## 4. Roadmap

### Now — no code, highest leverage

1. **Deploy to a resolving domain.** Blocks everything.
2. **Verify GSC via Domain property (DNS TXT)**, not URL-prefix — covers www/non-www and both protocols in one.
3. **Name a human author.** Add a `Person` entity with real credentials, switch `BlogPosting.author` from `Organization` to that `Person`, and give them a page with `sameAs`. This is the cheapest move in the highest-weighted deficient category.

### Next 30 days — content, no new infrastructure

4. **Convert ~40 H2s to question format** where the section already answers a question. Target roughly 60% question-format, not 100% — an all-questions article reads like a quiz.
5. **Expand thin sections that answer discrete questions** so each is self-contained. Do not pad; merge or extend where the answer is genuinely incomplete.
6. **Film the workshop.** Three to five short clips: slab selection, the pour, hand-finishing. This addresses the weakest addressable category *and* the highest-correlating authority signal (YouTube, ~0.737) with one piece of work.

### 60-90 days — off-site entity building

7. Establish YouTube and LinkedIn presence; participate genuinely in relevant Reddit communities (r/woodworking, r/DiWHY, r/furniture). **Do not spam** — the skill's own penalty-risk table flags manufactured presence.
8. Pursue Wikidata entity creation once there is third-party coverage to cite. Wikipedia is not appropriate yet; notability is not met.
9. Re-audit against these five categories once the domain has 90 days of crawl history.

---

## 5. Where I deviated from the skill, and why

Stated explicitly so the reasoning is auditable:

1. **I did not pad passages to 134-167 words.** The skill asserts this range three times without a source. Padding good prose to hit an unsourced number would make the site worse for humans to win a metric I cannot verify. Recommended selectively instead.
2. **I did not implement RSL 1.0.** The skill names it as a scoring check but gives no syntax or file location. Inventing a format would produce a file no parser reads.
3. **I removed HowTo rather than retaining it "for LLM parsing."** An earlier build spec kept it on that rationale. FAQPage carries the same four steps in a form both Google and answer engines actually use, so the deprecated type had no remaining justification.
4. **Scores are ranges based on judgement.** The skill defines five weights and no rubric. Two runs of this audit would not produce identical numbers, and I would rather say so than imply false precision.

---

## 6. Known issues in the skill folder

Flagged for your cleanup, since you asked for it to be standalone:

- **116 remaining "bidayalab" references across 10 files** — all in prior-run output, not skill logic: the entire `reports/` directory plus `generated-schema.json` and `SCHEMA-REPORT.md`. Five filenames also still carry the brand. Deleting those three targets removes every hit without touching a skill file.
- `generated-schema.json` is a complete `@graph` hardcoded to `bidayalab.com` with that brand's email and social profiles. If a future run reads it as context it will produce wrong output.
- **Internal contradiction:** `seo-geo` labels GPTBot "ChatGPT web search"; `seo-technical` labels it "Model training". They also disagree on ClaudeBot.
- **Weight conflict:** AI Search Readiness is 10% in `seo/SKILL.md` and 5% in `skills/seo-audit/SKILL.md`.
