import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "../../..");
const outputPath = path.join(projectRoot, "apps", "web", "src", "types", "database.ts");
const localEnvPath = path.join(projectRoot, "apps", "web", ".env.local");
const linkedProjectPath = path.join(projectRoot, "supabase", ".temp", "project-ref");

function getDatabaseUrl() {
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }

  try {
    const envLine = readFileSync(localEnvPath, "utf8")
      .split(/\r?\n/)
      .find((line) => line.startsWith("SUPABASE_DB_URL="));

    return envLine?.slice("SUPABASE_DB_URL=".length).trim() || undefined;
  } catch {
    return undefined;
  }
}

const localCommandName = process.platform === "win32" ? "supabase.cmd" : "supabase";
const localCliScript = path.join(projectRoot, "node_modules", "supabase", "dist", "supabase.js");
const hasLocalCli = existsSync(localCliScript);
const command = hasLocalCli ? process.execPath : localCommandName;
const databaseUrl = getDatabaseUrl();
const hasLinkedProject = existsSync(linkedProjectPath);
const cliArguments = hasLocalCli
  ? [localCliScript, "gen", "types", "typescript"]
  : ["gen", "types", "typescript"];

if (hasLinkedProject) {
  cliArguments.push("--linked");
} else if (databaseUrl) {
  cliArguments.push("--db-url", databaseUrl);
} else {
  cliArguments.push("--local");
}

const result = spawnSync(command, cliArguments, {
  cwd: projectRoot,
  encoding: "utf8",
});

if (result.error) {
  console.error("Supabase CLI is required. Install it before running pnpm supabase:types.");
  process.exit(1);
}

if (result.status !== 0) {
  const diagnostic = [result.stderr, result.stdout].filter(Boolean).join("\n");
  process.stderr.write(diagnostic || "Supabase type generation failed.\n");
  process.exit(result.status ?? 1);
}

const generatedTypes = result.stdout.trim();

if (!generatedTypes.includes("export type Database")) {
  console.error("Supabase CLI returned no Database type. The existing type file was not changed.");
  process.exit(1);
}

writeFileSync(outputPath, `${generatedTypes}\n`, "utf8");
console.log(`Generated Supabase types at ${path.relative(projectRoot, outputPath)}`);
