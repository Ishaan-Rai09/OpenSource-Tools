export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-mono text-sm uppercase tracking-widest">Privacy</h1>
      <p className="mt-4 text-sm leading-6">
        OSSwap finds open-source alternatives to paid tools. We collect as little as possible.
      </p>
      <h2 className="mt-8 font-mono text-xs uppercase tracking-widest">What we store</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
        <li>Repos you save (repo full name, stored in your browser localStorage only).</li>
        <li>Anonymous search queries (query text only, kept for 90 days, then auto-deleted).</li>
      </ul>
      <h2 className="mt-8 font-mono text-xs uppercase tracking-widest">What we never store</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
        <li>Passwords or API keys.</li>
        <li>Accounts or sign-in identity — there is no login; saves live in browser localStorage.</li>
        <li>Query attribution in logs — logs never include who searched what.</li>
      </ul>
      <h2 className="mt-8 font-mono text-xs uppercase tracking-widest">Contact</h2>
      <p className="mt-3 text-sm leading-6">
        Questions about your data? Open an issue on the project repository and we will help.
      </p>
    </div>
  );
}
