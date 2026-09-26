require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.local") });
const token = (process.env.DISCORD_BOT_TOKEN || "").replace(/^"(.*)"$/, "$1");
const guild = "1387155425710833674";
const ARABIC_CHAT_ROLE = "1549487723004432605";

(async () => {
  const res = await fetch(`https://discord.com/api/v10/guilds/${guild}/onboarding`, {
    headers: { Authorization: `Bot ${token}` },
  });
  const j = await res.json();

  const prompts = j.prompts.map((p) => ({
    id: p.id,
    type: p.type ?? 1,
    title: p.title,
    single_select: p.single_select,
    required: p.required,
    in_onboarding: p.in_onboarding,
    options: p.options.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description || "",
      emoji_name: o.emoji_name || null,
      emoji_id: o.emoji_id || null,
      role_ids: o.role_ids || [],
      channel_ids: o.channel_ids || [],
    })),
  }));

  const hasLang = prompts.some((p) => p.title && p.title.toLowerCase().includes("language"));
  if (!hasLang) {
    prompts.push({
      id: Date.now(),
      type: 1,
      title: "🗣️ اختر لغتك · Choose your language",
      single_select: true,
      required: false,
      in_onboarding: true,
      options: [
        {
          id: Date.now() + 1,
          title: "العربية · Arabic",
          description: "احصل على روول Arabic Chat وافتح قناة 🗨️-arabic-chat & 🎮-aion-2",
          emoji_name: "🇪🇬",
          emoji_id: null,
          role_ids: [ARABIC_CHAT_ROLE],
          channel_ids: [],
        },
      ],
    });
  }

  const payload = {
    enabled: true,
    default_channel_ids: [
      "1548477682201665607", // welcome-briefing
      "1548330499917742180", // 📜 rules-and-guidelines
      "1548332218563166221", // 🎮 lfg
    ],
    prompts,
  };

  const put = await fetch(`https://discord.com/api/v10/guilds/${guild}/onboarding`, {
    method: "PUT",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const out = await put.json().catch(() => ({}));
  if (!put.ok) { console.error("PUT failed", put.status, JSON.stringify(out).slice(0, 900)); process.exit(1); }
  console.log("OK — onboarding saved:");
  for (let i = 0; i < (out.prompts || []).length; i++) {
    const p = out.prompts[i];
    console.log(`[${i}] ${p.title} single=${p.single_select} onBrd=${p.in_onboarding} req=${p.required}`);
    for (const o of p.options || []) console.log(`   - ${o.title} -> roles[${(o.role_ids || []).join(",")}]`);
  }
})()