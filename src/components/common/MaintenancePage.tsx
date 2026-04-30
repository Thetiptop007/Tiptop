import PageMeta from "./PageMeta";

export default function MaintenancePage() {
  return (
    <>
      <PageMeta
        title="Temporarily Under Maintenance | The Tip Top"
        description="The Tip Top website is temporarily under maintenance and will be back live soon."
      />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07111f] px-6 py-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(70,95,255,0.28),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,133,58,0.18),_transparent_30%),linear-gradient(135deg,_#07111f_0%,_#0d1b33_55%,_#101828_100%)]" />
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute bottom-[-7rem] right-[-6rem] h-80 w-80 rounded-full bg-orange-400/15 blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/8 px-6 py-12 text-center shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-10 sm:py-16">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            Maintenance mode
          </span>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            We&apos;ll be live soon.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
            The Tip Top is temporarily under maintenance while we finish a few updates.
            Please check back shortly.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              "New updates in progress",
              "Orders and browsing paused",
              "Back online very soon",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-sm text-white/80"
              >
                {item}
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-white/55">
            Thank you for your patience.
          </p>
        </div>
      </div>
    </>
  );
}
