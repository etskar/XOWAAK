import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { writeFileSync } from "node:fs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../..");
const outputPath = path.join(projectRoot, "apps", "web", "src", "types", "database.ts");
const command = process.platform === "win32" ? "supabase.cmd" : "supabase";

const result = spawnSync(command, ["gen", "types", "typescript", "--local"], {
  cwd: projectRoot,
  encoding: "utf8",
});

if (result.error) {
  console.error("Supabase CLI is required. Install it before running pnpm supabase:types.");
  process.exit(1);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr || "Supabase type generation failed.\n");
  process.exit(result.status ?? 1);
}

const generatedTypes = result.stdout.trim();

if (!generatedTypes.includes("export type Database")) {
  console.error("Supabase CLI returned no Database type. The existing type file was not changed.");
  process.exit(1);
}

writeFileSync(outputPath, `${generatedTypes}\n`, "utf8");
console.log(`Generated Supabase types at ${path.relative(projectRoot, outputPath)}`);
