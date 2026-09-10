import { Ticker } from "@/components/Ticker";
export default function Page() {
  return (<div className="mx-auto max-w-6xl px-4 py-10">
    <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-tight">STOP PAYING<br/>FOR SOFTWARE.</h1>
    <p className="mt-3 max-w-xl text-lg">Type “whatsapp api” or “Twilio” — get maintained open-source GitHub alternatives with a real comparison.</p>
    <form action="/api/search" method="post" className="mt-6 flex gap-2"><input name="query" placeholder="try: whatsapp api thing…" className="w-full border-[1.5px] border-[#111111] bg-white px-4 py-4 text-lg outline-none" /><button className="hard border-[1.5px] border-[#111111] bg-[#D9FF3D] px-6 font-bold">Find OSS</button></form>
    <Ticker /></div>);
}
