import subprocess, time, sys, json
from playwright.sync_api import sync_playwright

PORT = 3456
srv = subprocess.Popen(["node", "server.mjs"], env={"PORT": str(PORT), "PATH": "/usr/bin:/usr/local/bin:/bin"}, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
time.sleep(1.2)
BASE = f"http://localhost:{PORT}"
problems = []
def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond: problems.append(msg)

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1400, "height": 900})
        ctx.grant_permissions(["clipboard-read", "clipboard-write"])
        # block external fonts (no network) so it doesn't hang
        ctx.route("**/fonts.googleapis.com/**", lambda r: r.abort())
        ctx.route("**/fonts.gstatic.com/**", lambda r: r.abort())
        pg = ctx.new_page()
        errors = []
        pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
        pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" and "fonts" not in m.text and "ERR_FAILED" not in m.text else None)

        pg.goto(BASE + "/")
        pg.wait_for_timeout(800)
        st = pg.text_content("#ai-status")
        check("Checking" not in st, f"AI status resolves (got: {st!r})")
        check(pg.locator("#examples button, #examples .chip").count() > 0, "example briefs render")
        pg.screenshot(path="tests/screenshots/01-brief.png", full_page=True)

        # Brief flow
        pg.fill("#f-product", "SunDrop SPF 50")
        pg.fill("#f-desc", "A light sunscreen for college students that doesn't leave a white cast. Funny Reels for a Diwali sale, 20% off.")
        pg.locator("#brief-form button[type=submit]").click()
        pg.wait_for_timeout(500)
        recs = pg.locator("#brief-results .chipcard").count()
        check(recs == 3, f"3 recommendations shown (got {recs})")
        check(pg.locator("#brief-results .reasons li").count() > 0, "recommendation reasons shown")
        txt = pg.text_content("#brief-results")
        check("undefined" not in txt and "NaN" not in txt, "no undefined/NaN in results")
        pg.screenshot(path="tests/screenshots/02-recs.png", full_page=True)

        # Plan first
        pg.locator("#brief-results [data-act=plan]").first.click()
        pg.wait_for_timeout(700)
        check(pg.locator("#view-director").is_visible(), "director view opens")
        panels = pg.locator("#board .panel").count()
        check(panels >= 3, f"storyboard has scenes (got {panels})")
        check(pg.locator(".hooks li").count() == 5, "5 hooks")
        board = pg.text_content("#board")
        check("undefined" not in board and "NaN" not in board and "{" not in board, "board has no placeholder junk")
        pg.screenshot(path="tests/screenshots/03-director.png", full_page=True)

        # Scene buttons
        first_line = pg.locator("#board .panel .line").nth(1).text_content()
        pg.locator("#board [data-act=retake][data-tone=funny]").nth(1).click()
        pg.wait_for_timeout(300)
        check(pg.locator("#board .panel").count() == panels, "retake keeps scene count")
        pg.locator("#board [data-act=new-hooks]").click(); pg.wait_for_timeout(200)
        pg.locator("#board [data-act=use-hook]").nth(2).click(); pg.wait_for_timeout(200)
        check(pg.locator("#board [data-act=use-hook]").nth(2).is_disabled(), "use hook marks In use")
        pg.locator("#board [data-act=copy-prompt]").first.click(); pg.wait_for_timeout(200)
        clip = pg.evaluate("navigator.clipboard.readText()")
        check(len(clip) > 40, "copy prompt puts text on clipboard")
        pg.locator("#board [data-act=copy-all]").click(); pg.wait_for_timeout(200)
        clip2 = pg.evaluate("navigator.clipboard.readText()")
        check(clip2.count("\n") > 3, "copy all prompts works")
        with pg.expect_download() as d: pg.locator("#board [data-act=dl-md]").click()
        check(d.value.suggested_filename.endswith(".md"), "markdown download")
        with pg.expect_download() as d2: pg.locator("#board [data-act=dl-json]").click()
        path = d2.value.path(); data = json.load(open(path))
        check(len(data.get("scenes", [])) > 0, "json download is valid")
        rm_before = pg.locator("#board .panel").count()
        if pg.locator("#board [data-act=remove]").count():
            pg.locator("#board [data-act=remove]").first.click(); pg.wait_for_timeout(200)
            check(pg.locator("#board .panel").count() == rm_before - 1, "remove scene works")

        # Chat edits (offline engine)
        def say(msg):
            n = pg.locator("#dir-log .msg.bot").count()
            pg.fill("#dir-input", msg); pg.press("#dir-input", "Enter")
            pg.wait_for_function(f"document.querySelectorAll('#dir-log .msg.bot:not(.typing)').length > {n}", timeout=20000)
            pg.wait_for_timeout(150)
            return pg.locator("#dir-log .msg.bot:not(.typing)").last.text_content()
        for m in ["make scene 2 funnier", "make it 30 seconds", "switch to unboxing", "give me new hooks", "make it for youtube shorts", "write it in hinglish", "how many credits will this cost?", "asdkjhasd qwe", "make it premium", "<img src=x onerror=alert(1)>"]:
            r = say(m)
            check(bool(r and r.strip()) and "undefined" not in r, f"chat reply to {m!r}: {r[:80]!r}")
        check(pg.locator("#dir-log img").count() == 0, "no HTML injection in chat")
        board = pg.text_content("#board")
        check("undefined" not in board and "NaN" not in board, "board clean after chat edits")
        pg.screenshot(path="tests/screenshots/04-after-chat.png", full_page=True)

        # Suggestion chips
        if pg.locator("#dir-suggest [data-send]").count():
            n = pg.locator("#dir-log .msg").count()
            pg.locator("#dir-suggest [data-send]").first.click(); pg.wait_for_timeout(600)
            check(pg.locator("#dir-log .msg").count() > n, "suggestion chip sends")

        # Product name edit
        pg.fill("#product-name", "GlowUp Serum"); pg.press("#product-name", "Tab"); pg.wait_for_timeout(300)
        check("GlowUp Serum" in pg.text_content("#board .frames") or "GlowUp" in pg.locator("#board .prompt p").first.text_content(), "product rename propagates")

        # Reload persistence
        pg.reload(); pg.wait_for_timeout(700)
        check(pg.locator("#board .panel").count() > 0, "plan persists after reload")

        # New plan
        pg.locator("#dir-reset").click(); pg.wait_for_timeout(300)
        check(pg.locator("#board .board-empty").count() == 1 or pg.locator("#board .panel").count() == 0, "new plan resets board")
        # chat-first flow from empty
        r = say("I sell handmade soy candles for gifting, want a cozy instagram reel")
        pg.wait_for_timeout(400)
        check(pg.locator("#board .panel").count() > 0, f"chat-first creates a plan ({r[:60]!r})")

        # Templates view
        pg.goto(BASE + "/#/templates"); pg.wait_for_timeout(500)
        n = pg.locator("#tpl-grid .chipcard").count()
        check(n == 11, f"11 templates in marketplace (got {n})")
        pg.fill("#tpl-search", "unboxing"); pg.wait_for_timeout(300)
        check(0 < pg.locator("#tpl-grid .chipcard").count() < 11, "search filters")
        pg.fill("#tpl-search", "zzzzqq"); pg.wait_for_timeout(300)
        check(pg.locator("#tpl-grid .empty").count() == 1, "empty search state")
        pg.fill("#tpl-search", ""); pg.wait_for_timeout(300)
        fbtns = pg.locator("#tpl-filters [data-filter]")
        if fbtns.count() > 1:
            fbtns.nth(1).click(); pg.wait_for_timeout(200)
            check(pg.locator("#tpl-grid .chipcard").count() >= 1, "family filter works")
            fbtns.nth(0).click(); pg.wait_for_timeout(200)
        pg.locator("#tpl-grid [data-act=open-tpl]").first.click(); pg.wait_for_timeout(300)
        check(pg.locator("#tpl-dialog[open]").count() == 1, "template dialog opens")
        pg.screenshot(path="tests/screenshots/05-dialog.png")
        check(pg.locator("#tpl-dialog .var").count() >= 3, "dialog shows style variations")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
        check(pg.locator("#tpl-dialog[open]").count() == 0, "dialog closes with Escape")
        pg.locator("#tpl-grid [data-act=open-tpl]").nth(3).click(); pg.wait_for_timeout(300)
        pg.locator("#tpl-dialog [data-act=plan]").nth(1).click(); pg.wait_for_timeout(500)
        check(pg.locator("#view-director").is_visible() and pg.locator("#board .panel").count() > 0, "plan from dialog style")

        # Help widget
        pg.locator("#help-fab").click(); pg.wait_for_timeout(300)
        check(pg.locator("#help-panel").is_visible(), "help panel opens")
        qs = ["how much does it cost", "do my credits expire", "is there a free plan", "can I use it commercially", "how many languages", "what's 4K on basic?", "refund policy", "kya hindi me video bana sakte hai", "write hooks for my candle brand", "blah blah"]
        for q in qs:
            n = pg.locator("#help-log .msg.bot:not(.typing)").count()
            t0 = time.time()
            pg.fill("#help-input", q); pg.press("#help-input", "Enter")
            pg.wait_for_function(f"document.querySelectorAll('#help-log .msg.bot:not(.typing)').length > {n}", timeout=20000)
            dt = time.time() - t0
            r = pg.locator("#help-log .msg.bot:not(.typing)").last.text_content()
            check(bool(r.strip()) and dt < 2.5, f"help {q!r} in {dt:.2f}s: {r[:90]!r}")
        pg.screenshot(path="tests/screenshots/06-help.png")
        # handoff action
        ho = pg.locator("#help-log .msg-actions .chip")
        if ho.count():
            ho.last.click(); pg.wait_for_timeout(600)
            check(pg.locator("#view-director").is_visible(), "help handoff opens Director")
        pg.locator("#help-close").click() if pg.locator("#help-close").is_visible() else None

        # Mobile
        m = b.new_context(viewport={"width": 375, "height": 800}, is_mobile=True, has_touch=True)
        m.route("**/fonts.g*/**", lambda r: r.abort())
        mp = m.new_page()
        mp.on("pageerror", lambda e: errors.append("mobile pageerror: " + str(e)))
        for route, name in [("/", "m-brief"), ("/#/templates", "m-templates")]:
            mp.goto(BASE + route); mp.wait_for_timeout(600)
            ow = mp.evaluate("document.documentElement.scrollWidth")
            check(ow <= 376, f"no horizontal scroll on {route} mobile (scrollWidth {ow})")
            mp.screenshot(path=f"tests/screenshots/{name}.png", full_page=True)
        mp.goto(BASE + "/#/"); mp.wait_for_timeout(500)
        mp.fill("#f-desc", "Chai masala for working moms, youtube shorts, warm tone")
        mp.locator("#brief-form button[type=submit]").click(); mp.wait_for_timeout(400)
        mp.locator("#brief-results [data-act=plan]").first.click(); mp.wait_for_timeout(600)
        ow = mp.evaluate("document.documentElement.scrollWidth")
        check(ow <= 376, f"no horizontal scroll on director mobile (scrollWidth {ow})")
        mp.screenshot(path="tests/screenshots/m-director.png", full_page=True)
        mp.locator("#help-fab").click(); mp.wait_for_timeout(300)
        mp.screenshot(path="tests/screenshots/m-help.png")

        check(not errors, "no JS errors: " + "; ".join(errors[:5]))
        b.close()
finally:
    srv.terminate()
    out = srv.stdout.read().decode()
    print("server:", out[:300])
print("\nPROBLEMS:", len(problems))
for x in problems: print(" -", x)
