# Problem Statement

Kenyans frequently miss major legislative and regulatory developments because
official notices (bills, gazette notices, public participation calls) are
published in dense legal English, scattered across government sites, and
easy to miss until deadlines have passed.

**Bunge Feed** simulates a pipeline that:
1. Detects newly published government/legislative notices (simulated here
   with mock data on a timer, standing in for a live scraper).
2. Uses an LLM (DeepSeek) to rewrite each notice in plain English suitable
   for a 6th-grade reading level.
3. Offers an equally simple Kiswahili version on demand.
4. Surfaces the relevant deadline (e.g. public participation close date) or
   clearly states when none is specified.
5. Categorizes each notice (Governance, Finance, Agriculture, etc.) so
   people can find what's relevant to them.

This repo contains a working demo of steps 2-5 using hardcoded sample
notices released on a timer to simulate live scraping.
