import Link from 'next/link';

type ListenPageProps = {
  params: {
    roomId: string;
  };
};

export default function ListenPage({ params }: ListenPageProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto max-w-xl rounded-3xl bg-white/10 p-8 shadow-sm ring-1 ring-white/10">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">GuideRoom listener</p>
        <h1 className="mt-5 text-3xl font-bold">Ready to listen</h1>
        <p className="mt-3 text-slate-300">Room ID: {params.roomId}</p>

        <div className="mt-8 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
          <p className="font-semibold">Please put on your earphones.</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            In the next milestone, this button will connect to the live audio room. For now this page is the listener flow prototype.
          </p>
        </div>

        <button className="mt-8 w-full rounded-full bg-white px-5 py-4 text-sm font-bold text-slate-950">
          Start listening
        </button>

        <Link href="/" className="mt-6 block text-center text-sm text-slate-300">
          Back to GuideRoom
        </Link>
      </section>
    </main>
  );
}
