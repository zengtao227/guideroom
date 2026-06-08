import Link from 'next/link';

export default function CreateRoomPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <Link href="/" className="text-sm font-medium text-slate-500">← Back</Link>
        <h1 className="mt-6 text-3xl font-bold">Create a GuideRoom</h1>
        <p className="mt-3 text-slate-600">
          This is the static MVP screen. The next milestone will connect this form to room creation logic.
        </p>

        <form className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Room title</span>
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Basel Old Town Tour" />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Duration</span>
            <select className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" defaultValue="3h">
              <option value="1h">1 hour</option>
              <option value="3h">3 hours</option>
              <option value="half-day">Half day</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Guide name optional</span>
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Tao" />
          </label>

          <Link href="/guide/room/demo-room" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            Create demo room
          </Link>
        </form>
      </section>
    </main>
  );
}
