import Link from "next/link";
import CreateWeddingForm from "@/components/admin/create-wedding-form";
import MarketingShell from "@/components/marketing/shell";
import { authLinkClass } from "@/components/auth/fields";
import { verifySession } from "@/lib/dal";
import { getPartnerName } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { getStarterPlan } from "@/lib/starter-plan";

export default async function NewWeddingPage() {
  const user = await verifySession();
  const partnerName = await getPartnerName();
  const starter = await getStarterPlan();
  const hasWeddings = (await prisma.weddingMember.count({ where: { userId: user.id } })) > 0;

  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-5 pt-6 pb-24 sm:px-8 sm:pt-10">
        {hasWeddings && (
          <Link href="/dashboard" className={`text-sm ${authLinkClass}`}>
            Back to your weddings
          </Link>
        )}
        <h1 className="mt-4 max-w-2xl font-(family-name:--m-display) text-4xl leading-[0.95] font-extrabold tracking-[-0.03em] sm:text-6xl">
          Let&apos;s set up your site
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/75">
          It starts as a private draft only you can see. Add your story, registry and bank details next, then publish when
          you&apos;re ready for guests.
        </p>
        <div className="mt-12">
          <CreateWeddingForm initialNames={{ bride: user.name ?? "", groom: partnerName }} includedThemes={starter?.themes ?? []} />
        </div>
      </div>
    </MarketingShell>
  );
}
