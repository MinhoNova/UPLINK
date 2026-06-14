const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");
const files = [
  "app/api/subscription/request/route.ts",
  "app/api/reviews/route.ts",
  "app/api/friends/route.ts",
  "app/api/dm/route.ts",
  "app/api/community/reports/route.ts",
  "app/api/community/reactions/route.ts",
  "app/api/community/posts/route.ts",
  "app/api/community/comments/route.ts",
  "app/api/community/comment-reactions/route.ts",
  "app/api/community/check-access/route.ts",
  "app/api/community/activity/route.ts",
  "app/leaderboard/page.tsx",
];

for (const f of files) {
  const p = path.join(root, f);
  let s = fs.readFileSync(p, "utf8");
  if (!s.includes("getServerSession")) continue;

  s = s.replace(
    /import \{ getServerSession \} from "next-auth";\r?\nimport \{ authOptions \} from "@\/lib\/auth";\r?\n/g,
    'import { getAppSession } from "@/lib/authEnv";\n'
  );
  s = s.replace(/await getServerSession\(authOptions\)/g, "await getAppSession(req)");
  s = s.replace(/export async function GET\(\)/g, "export async function GET(req: Request)");
  fs.writeFileSync(p, s);
  console.log("updated", f);
}
