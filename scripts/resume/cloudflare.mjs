import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { clientConfig } from "./client.mjs";

// Reuse pixelating's existing Terraform configuration. Never serialize credentials.
const action = process.argv[2];
async function main() {
  if (!["inventory", "init", "plan", "provision", "migrate", "deploy", "admin"].includes(action))
    throw new Error("Use inventory, init, plan, provision, migrate, deploy, or admin");
  const path =
    process.env.PIXELATING_TFVARS ||
    resolve(homedir(), "pixelating/web/infra/terraform/terraform.tfvars");
  const source = await readFile(path, "utf8");
  const values = Object.fromEntries(
    [...source.matchAll(/^\s*(\w+)\s*=\s*"([^"\n]*)"/gm)].map((m) => [m[1], m[2]]),
  );
  const token = process.env.CLOUDFLARE_API_TOKEN || values.cloudflare_api_token;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID || values.account_id;
  if (!token || !account)
    throw new Error("Cloudflare credentials unavailable in existing local config");
  async function cloudflare(endpoint, method = "GET", body) {
    let response;
    try {
      response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${account}/${endpoint}`,
        {
          method,
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          ...(method !== "GET" && body ? { body: JSON.stringify(body) } : {}),
        },
      );
    } catch {
      throw new Error("Cloudflare network request failed");
    }
    if (!response.ok)
      throw new Error(
        `Cloudflare ${endpoint.split("/")[0]} returned HTTP ${response.status}; check existing credential permissions`,
      );
    const data = await response.json();
    if (!data.success) throw new Error("Cloudflare operation failed");
    return data.result;
  }
  if (action === "inventory") {
    for (const endpoint of ["workers/scripts", "r2/buckets"]) {
      const data = await cloudflare(endpoint);
      const rows = Array.isArray(data) ? data : data.buckets;
      process.stdout.write(
        `${endpoint}: ${JSON.stringify(rows.map((item) => ({ name: item.name || item.id })))}\n`,
      );
    }
    return;
  }
  if (action === "migrate") {
    process.stdout.write(
      "SQLite schema migrations run transactionally when the résumé database starts.\n",
    );
    return;
  }
  const base = ["--config", "workers/resume/wrangler.jsonc"];
  let secrets;
  let installAdminAfterDeployment = false;
  if (action === "deploy" || action === "admin") {
    const { token: admin } = await clientConfig();
    const keyPath = new URL("../../private/resume-share-key", import.meta.url);
    let key;
    try {
      key = (await readFile(keyPath, "utf8")).trim();
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      key = randomBytes(32).toString("hex");
      await writeFile(keyPath, `${key}\n`, { mode: 0o600 });
    }
    if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("Invalid private share URL key");
    secrets = new URL("../../private/resume-admin.env", import.meta.url);
    await writeFile(
      secrets,
      `ADMIN_TOKEN_SHA256=${createHash("sha256").update(admin).digest("hex")}\nSHARE_URL_KEY=${key}\n`,
      { mode: 0o600 },
    );
  }
  let args;
  let executable = process.execPath;
  const terraform = ["-chdir=infra/resume"];
  if (action === "init") {
    executable = "terraform";
    args = [...terraform, "init", "-input=false"];
  } else if (action === "plan") {
    executable = "terraform";
    args = [...terraform, "plan", "-input=false", "-out=../../private/resume-r2.tfplan"];
  } else if (action === "provision") {
    executable = "terraform";
    args = [...terraform, "apply", "-input=false", "../../private/resume-r2.tfplan"];
  } else if (action === "admin") {
    args = ["secret", "bulk", fileURLToPath(secrets), ...base];
  } else {
    const workers = await cloudflare("workers/scripts");
    const exists = workers.some(
      (item) => item.id === "private-resume" || item.name === "private-resume",
    );
    args = exists
      ? ["deploy", "--secrets-file", fileURLToPath(secrets), ...base]
      : ["deploy", ...base];
    installAdminAfterDeployment = !exists;
  }
  const commandArgs =
    executable === "terraform" ? args : ["node_modules/wrangler/bin/wrangler.js", ...args];
  const environment = {
    ...process.env,
    CLOUDFLARE_API_TOKEN: token,
    CLOUDFLARE_ACCOUNT_ID: account,
    TF_VAR_cloudflare_api_token: token,
    TF_VAR_account_id: account,
    WRANGLER_SEND_METRICS: "false",
    WRANGLER_LOG: "error",
  };
  const child = spawn(executable, commandArgs, {
    env: environment,
    stdio: "inherit",
  });
  const code = await new Promise((res, reject) => {
    child.once("error", reject);
    child.once("exit", res);
  });
  if (code !== 0) throw new Error("Wrangler operation failed");
  if (installAdminAfterDeployment) {
    const setup = spawn(
      process.execPath,
      ["node_modules/wrangler/bin/wrangler.js", "secret", "bulk", fileURLToPath(secrets), ...base],
      { env: environment, stdio: "inherit" },
    );
    const status = await new Promise((res, reject) => {
      setup.once("error", reject);
      setup.once("exit", res);
    });
    if (status !== 0) throw new Error("Admin secret setup failed");
  }
}
main().catch((error) => {
  process.stderr.write(
    `${error.code ? "Cannot access local Cloudflare configuration" : error.message}\n`,
  );
  process.exitCode = 1;
});
