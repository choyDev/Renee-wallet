import BackHomeButton from "../ui/BackHomeButton";

const Contact = ({ showBackButton = false }: { showBackButton?: boolean }) => {
  return (
    <section id="contact" className="overflow-hidden py-16 md:py-20 lg:py-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap justify-center">
          <div className="w-full px-4 lg:w-7/12 xl:w-8/12">

            <div
              className="
                group mb-12 rounded-2xl border border-[var(--brand-600)]/50 dark:border-white/10 bg-[rgba(255,255,255,0.05)]
                p-8 backdrop-blur
                shadow-[0_0_0_rgba(110,59,255,0)]
                transition-all duration-300
                hover:-translate-y-[6px]
                hover:border-[var(--brand-600)]
                hover:shadow-[0_20px_48px_rgba(110,59,255,0.18)]
                lg:mb-5 lg:p-8
              "
              data-wow-delay=".15s"
            >
              {/* Glow ring */}
              <div
                className="
                  pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-xl
                  bg-gradient-to-br from-[var(--brand-600)]/15 via-transparent to-[var(--brand-400)]/10
                  transition-opacity duration-300 group-hover:opacity-100
                "
              />
              {showBackButton && <BackHomeButton />}   {/* <===== ONLY HERE IF ENABLED */}

              {/* Title */}
              <h2 className="text-center mt-6 mb-3 text-2xl font-bold text-balck dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                Need Help? Send a Message
              </h2>

              <p className="text-center mb-10 text-base text-body-color dark:text-slate-300">
                Our support team will get back to you ASAP via email.
              </p>

              {/* Form */}
              <form className="grid grid-cols-1 gap-6 md:grid-cols-2">

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black/80 dark:text-slate-200">Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="
                      w-full rounded-xl border border-[var(--brand-500)]/50 dark:border-white/10 bg-white/5 px-4 py-3
                      text-slate-100 placeholder:text-slate-400
                      outline-none ring-0 transition
                      focus:border-[var(--brand-500)]
                    "
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black/80 dark:text-slate-200">Your Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="
                      w-full rounded-xl border border-[var(--brand-500)]/50 dark:border-white/10 bg-white/5 px-4 py-3
                      text-slate-100 placeholder:text-slate-400
                      outline-none ring-0 transition
                      focus:border-[var(--brand-500)]
                    "
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-black/80 dark:text-slate-200">Your Message</label>
                  <textarea
                    rows={5}
                    placeholder="Enter your message"
                    className="
                      w-full resize-none rounded-xl border border-[var(--brand-500)]/50 dark:border-white/10 bg-white/5 px-4 py-3
                      text-slate-100 placeholder:text-slate-400
                      outline-none ring-0 transition
                      focus:border-[var(--brand-500)]
                    "
                  />
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 flex justify-center items-center mt-3">
                  <button
                    type="submit"
                    className="
                      group relative inline-flex items-center justify-center w-1/2
                      px-8 py-3 text-[15px] font-semibold text-white rounded-sm
                      bg-[linear-gradient(135deg,var(--brand-600)_0%,var(--brand-400)_100%)]
                      shadow-[0_6px_20px_rgba(110,59,255,0.45)]
                      transition-all duration-300
                      hover:-translate-y-[3px]
                      hover:shadow-[0_6px_20px_var(--brand-500-65)]
                      active:scale-[0.98]
                    "
                  >
                    <span className="text-[18px] relative z-10">Send</span>

                    {/* Glow overlay (working now because button has group) */}
                    <span
                      className="
                        absolute inset-0 rounded-sm opacity-0 blur-[22px]
                        bg-[linear-gradient(135deg,var(--brand-600)_0%,var(--brand-400)_100%)]
                        transition-opacity duration-300
                      "
                    />
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
