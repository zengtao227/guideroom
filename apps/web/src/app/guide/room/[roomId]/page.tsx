import Link from 'next/link';

type GuideRoomPageProps = {
  params: {
    roomId: string;
  };
};

export default function GuideRoomPage({ params }: GuideRoomPageProps) {
  const listenUrl = `/listen/${params.roomId}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <Link href="/guide/create" className="text-sm font-medium text-slate-500">← Create another room</Link>
          <h1 className="mt-6 text-3xl font-bold">Guide control room</h1>
          <p className="mt-3 text-slate-600">Room ID: {params.roomId}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Status</p>
              <p className="mt-2 font-semibold">Demo active</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Listeners</p>
              <p className="mt-2 font-semibold">0 connected</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Microphone</p>
              <p className="mt-2 font-semibold">Not connected</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Start speaking</button>
            <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">Stop speaking</button>
            <button className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700">End room</button>
          </div>
        </div>

        <aside className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
            QR placeholder
          </div>
          <p className="mt-5 text-sm text-slate-600">Listener link</p>
          <Link href={listenUrl} className="mt-2 block break-all text-sm font-semibold text-slate-950">
            {listenUrl}
          </Link>
        </aside>
      </section>
    </main>
  );
}
