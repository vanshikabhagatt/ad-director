import http from "node:http";
let mode = process.env.FAKE_MODE || "ok"; let calls = 0;
http.createServer(async (req, res) => {
  let raw = ""; for await (const c of req) raw += c;
  if (req.url === "/mode") { mode = raw; res.end("ok"); return; }
  if (req.url === "/calls") { res.end(String(calls)); return; }
  calls++;
  const body = JSON.parse(raw);
  const sys = body.messages[0].content; const user = body.messages.at(-1).content;
  if (mode === "429") { res.writeHead(429); res.end('{"error":"rate"}'); return; }
  if (mode === "401") { res.writeHead(401); res.end('{"error":"bad key"}'); return; }
  if (mode === "slow") { await new Promise(r => setTimeout(r, 30000)); }
  let content;
  if (mode === "garbage") content = "Sure! Here's what I think... no json at all";
  else if (mode === "evil") content = JSON.stringify({ reply: "<script>alert(1)</script>ok", ops: [{op:"set_scene",index:"1",fields:{line:"x"}},{op:"set_scene",index:99,fields:{line:"y"}},{op:"drop_db"},{op:"set_scene",index:0,fields:{line:"<img src=x onerror=alert(2)>Hook"}},{op:"rebuild",templateId:"nope"},{op:"set_meta",fields:{duration:999,platform:"myspace",tone:"evil"}}] });
  else if (sys.startsWith("You are the help")) content = JSON.stringify({ reply: "AI says: plans start from $10 a month.", source: "https://hexcoded.ai/pricing", handoff: /hook/.test(user) });
  else {
    const board = JSON.parse(user.split("\n")[1]);
    if (/Polish/.test(user)) content = JSON.stringify({ reply: "Polished every line.", ops: [...board.scenes.filter(s=>s.line).map(s => ({ op: "set_scene", index: s.index, fields: { line: `AI line ${s.index + 1}` } })), { op: "set_hooks", hooks: ["AI hook one", "AI hook two", "AI hook three", "AI hook four", "AI hook five"] }] });
    else content = "```json\n" + JSON.stringify({ reply: "Made scene 2 warmer.", ops: [{ op: "set_scene", index: 1, fields: { line: "AI rewrote this warmly" } }] }) + "\n```";
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ choices: [{ message: { content } }] }));
}).listen(4999);
