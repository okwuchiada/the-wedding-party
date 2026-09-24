// Gives someone an account, optionally access to a wedding and/or super admin,
// and prints (and emails, when Resend is configured) a link to set their password.
//
//   npm run invite-user -- ada@example.com --wedding adanma-and-tobi --role OWNER
//   npm run invite-user -- you@example.com --super-admin
import { parseArgs } from "node:util";
import { sendInvite } from "@/lib/invites";
import { prisma } from "@/lib/prisma";

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      wedding: { type: "string" },
      role: { type: "string", default: "OWNER" },
      "super-admin": { type: "boolean", default: false },
      name: { type: "string" },
    },
  });

  const email = positionals[0]?.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Usage: invite-user <email> [--wedding <slug>] [--role OWNER|EDITOR] [--super-admin]");
  const role = values.role === "EDITOR" ? "EDITOR" : "OWNER";

  const user = await prisma.user.upsert({
    where: { email },
    update: values["super-admin"] ? { role: "SUPER_ADMIN" } : {},
    create: { email, name: values.name, role: values["super-admin"] ? "SUPER_ADMIN" : "USER" },
  });
  console.log(`User ${email}${values["super-admin"] ? " (super admin)" : ""}`);

  let weddingName: string | null = null;
  if (values.wedding) {
    const wedding = await prisma.wedding.findUnique({
      where: { slug: values.wedding },
      include: { story: { select: { brideName: true, groomName: true } } },
    });
    if (!wedding) throw new Error(`No wedding with slug "${values.wedding}"`);
    await prisma.weddingMember.upsert({
      where: { weddingId_userId: { weddingId: wedding.id, userId: user.id } },
      update: { role },
      create: { weddingId: wedding.id, userId: user.id, role },
    });
    weddingName = wedding.story ? `${wedding.story.brideName} & ${wedding.story.groomName}` : null;
    console.log(`${role} of /w/${wedding.slug}`);
  }

  if (user.passwordHash) {
    console.log("They already have a password; no invite sent.");
    return;
  }
  const token = await sendInvite(user, weddingName);
  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  console.log(`Set-password link (valid 7 days):\n${siteUrl}/reset-password?token=${token}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
