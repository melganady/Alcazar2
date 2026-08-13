import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { getPayload } from "payload";
import config from "../payload.config";

/**
 * Prompts for exactly N lines, one at a time, off a single readline
 * interface. Deliberately not readline/promises' repeated .question()
 * calls — with piped/non-TTY stdin, closing after the first question
 * ends the underlying stream and every question after it hangs. One
 * interface, one pass over its async iterator, works in both a real
 * terminal and a piped one.
 */
async function askAll(prompts: string[]): Promise<string[]> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: false });
  const answers: string[] = [];
  stdout.write(prompts[0]);
  for await (const line of rl) {
    answers.push(line);
    if (answers.length < prompts.length) stdout.write(prompts[answers.length]);
    else break;
  }
  rl.close();
  return answers;
}

/**
 * One-off: create an admin user directly against whichever database
 * DATABASE_URI points to. There is no npm script for this on purpose —
 * run it yourself, pointed at the right environment file, so you always
 * know which database you're about to write to:
 *
 *   node --env-file=.env.production.local --import tsx scripts/create-admin.ts
 *
 * (swap the env file for whichever one holds your production DATABASE_URI
 * and PAYLOAD_SECRET — .env targets local dev instead.)
 *
 * Name, email and password are typed into YOUR terminal when the script
 * runs. Nothing is passed as a command-line argument, logged, or sent
 * anywhere else — this script never leaves your machine.
 */
async function main() {
  const redactedUri = process.env.DATABASE_URI?.replace(/:\/\/[^@]*@/, "://***@") ?? "(no DATABASE_URI set)";
  console.log(`Target database: ${redactedUri}`);
  if (!process.env.DATABASE_URI?.startsWith("postgres")) {
    console.log("⚠️  This does not look like a production Postgres URI — double check your --env-file before continuing.\n");
  }

  const [name, email, password] = (
    await askAll(["Name: ", "Email: ", "Temporary password (8+ characters): "])
  ).map((v, i) => (i < 2 ? v.trim() : v));

  if (!name || !email || password.length < 8) {
    console.error("Name, email and an 8+ character password are all required. Nothing was created.");
    process.exit(1);
  }

  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
  });
  if (existing.totalDocs > 0) {
    console.error(
      `A user with ${email} already exists (id ${existing.docs[0].id}). Nothing was created — ` +
        `sign in and use /crm/team, or /admin → Users, to change their role instead.`,
    );
    process.exit(1);
  }

  const user = await payload.create({
    collection: "users",
    data: { name, email, password, role: "admin" },
  });

  console.log(`\nCreated admin user ${user.email} (id ${user.id}). Sign in at /crm/login or /admin.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
