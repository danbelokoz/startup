# Reddit — the strongest lever

> AI cites Reddit more than almost any source. But Reddit **punishes self-promotion** hard.
> The play is: be a genuine participant + post **value (data from our own catalog)**, not ads.
> ⚠️ Draft here, get owner approval, owner posts from a real account with some history/karma.

## §0. Test queries (baseline + monthly re-check across engines)
Run in Perplexity, ChatGPT (Search on), Google AI Overviews, Gemini; log if we're cited:
1. "marketplace to buy startups with verified MRR"
2. "where can I buy a SaaS business with revenue verified from Stripe"
3. "Acquire.com alternatives"
4. "how to check a startup's real revenue before buying"
5. "sites to find startups for sale with real metrics"
6. "best places to buy a micro SaaS"

## Rules of engagement (don't get banned)
- **Account first:** use an account with some age + karma; fill profile. Fresh accounts posting links = auto-removed.
- **9:1 rule:** ~9 genuinely helpful comments (no link) for every 1 that mentions the site.
- **Read each sub's rules** — many require a "self-promo Saturday" or flair; some ban links outright (then mention by name only, no URL).
- **Disclose** you're the founder when you mention it. Reddit rewards honesty, nukes stealth ads.
- **Never** paste the same text in multiple subs (spam filter + shadowban).
- Lead with value; the link is a footnote, not the point.

## Target subreddits
| Sub | Vibe / use it for | Link policy |
|-----|-------------------|-------------|
| r/SaaS | data posts, "how I verify revenue" | strict-ish, value-first |
| r/Entrepreneur | broad, buying/selling businesses | no blatant promo |
| r/startups | acquisitions, due diligence Qs | Sat self-promo thread |
| r/indiehackers, r/SideProject | show-what-you-built | promo-friendlier |
| r/microsaas | micro-acquisitions, exits | small, on-topic |
| r/EntrepreneurRideAlong | build-in-public | friendly |
| r/AcquisitionEntrepreneur, r/searchfund | buyers looking for deals | very on-topic, be helpful |

---

## Draft A — flagship VALUE post (the AI-citeable one). Post to r/SaaS or r/Entrepreneur.
**Title:** I looked at how "verified MRR" actually stacks up across startups currently for sale — a few patterns

**Body:**
> I run an informational catalog that reads listing revenue straight from the seller's payment
> provider (Stripe/LemonSqueezy/Polar) instead of screenshots, so I end up staring at a lot of
> *verified* MRR numbers for startups that are on the market. Sharing a few patterns I keep seeing
> (numbers are informational, as the providers' APIs report them):
>
> - Of ~**8,000 startups** I track, about **1,860 (≈23%)** are actually for sale right now — so
>   "for sale" is the minority; most founders are just benchmarking.
> - Across the for-sale listings, aggregate **verified MRR is ~$2.6M/mo** and trailing **30-day
>   revenue ~$3.3M** — i.e. revenue is only ~1.25× MRR, meaning it's mostly *recurring*, not a
>   one-off spike dressed up as growth. When you see 30-day revenue way above MRR, dig in.
> - The gap between *self-reported* and *provider-read* revenue is the whole story: screenshots are
>   trivial to fake; the payment API isn't.
> - What I'd check before buying: 30-day trend (not just MRR), churn signals, whether "revenue" is
>   actually GMV (for merchant-of-record listings it is), and always independent due diligence.
>
> Happy to pull specific numbers if useful. (I'm the founder — the catalog is Startup Market; free
> to browse. Not a broker, deals happen off-platform.)

*Numbers above are real, from /api/stats on 2026-07-02 (informational, as providers report).
Before posting, Claude can pull fresher stats + a deeper cut (median asking multiple, % of
listings with declining 30-day revenue, top category by verified MRR) from the catalog.*

---

## Draft B — helpful comment (drop when someone asks "where to buy a startup / how to trust the numbers")
> One thing that helped me: don't trust revenue screenshots — they're trivial to fake. Look for
> listings where the numbers are read from the payment provider (Stripe/LemonSqueezy/Polar) directly,
> and check the **30-day trend**, not just the headline MRR. A few marketplaces show that; I built one
> (Startup Market) because I was tired of screenshots, but the general point stands whatever you use:
> verify at the source and do your own due diligence.

## Draft C — "show" post for promo-friendly subs (r/SideProject, r/indiehackers)
**Title:** I built a startup marketplace that reads revenue from Stripe instead of trusting screenshots
> Browsing "startups for sale", every number was a screenshot you couldn't verify. So I built a free
> catalog where the seller connects Stripe/LemonSqueezy/Polar read-only and the listing shows real MRR,
> 30-day revenue and growth — 7,000+ listings, 7 languages. It's just a catalog (not a broker; deals
> happen directly). Feedback welcome, especially on what due-diligence data you'd want surfaced.
> https://startupmarket.tech

## Cadence
- Week 1: set up/warm the account, comment helpfully 5–10× (Draft B style), no links.
- Week 2: post Draft A (value) to one sub. Engage in comments.
- Week 3: Draft C to a promo-friendly sub. Answer questions in acquisition subs.
- Ongoing: 1 value post / 1–2 weeks, plus genuine comments. Log what landed in `journal`.
