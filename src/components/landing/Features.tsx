import Card from '@/components/ui/Card';

const steps = [
  { icon: '💬', title: 'Chat with AI', desc: 'Tell us where and when you want to go' },
  { icon: '🔍', title: 'Compare Prices', desc: 'We search 100+ booking sites instantly' },
  { icon: '💰', title: 'Book & Save', desc: 'Always get the cheapest price available' },
];

const features = [
  { icon: '🌏', title: '100+ Booking Sites', desc: 'Compare across all major OTAs' },
  { icon: '🤖', title: 'AI Recommendations', desc: 'Smart travel planning powered by AI' },
  { icon: '🌐', title: 'Any Language', desc: 'Chat in Japanese, English, or any language' },
  { icon: '💸', title: 'Always Free', desc: 'No subscription or hidden fees' },
  { icon: '✈️', title: 'Flights + Hotels', desc: 'Everything you need in one place' },
  { icon: '🔒', title: 'No Account Needed', desc: 'Start planning right away' },
];

export default function Features() {
  return (
    <>
      {/* How it Works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            How it Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-3">{step.icon}</div>
                <div className="text-white/30 text-xs mb-1">Step {i + 1}</div>
                <h3 className="text-white font-medium mb-1">{step.title}</h3>
                <p className="text-white/50 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price Comparison Demo */}
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="p-6 space-y-4">
            <div className="text-center">
              <h3 className="text-white font-medium">Hilton Hawaiian Village — 5 nights</h3>
              <p className="text-white/40 text-xs mt-1">Price comparison example</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <span className="text-white/70 text-sm">Agoda</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-bold text-sm">$189/night</span>
                  <span className="text-green-400 text-xs px-1.5 py-0.5 bg-green-500/20 rounded">Best!</span>
                </div>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/[0.02]">
                <span className="text-white/50 text-sm">Booking.com</span>
                <span className="text-white/40 text-sm">$210/night</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/[0.02]">
                <span className="text-white/50 text-sm">Expedia</span>
                <span className="text-white/40 text-sm">$205/night</span>
              </div>
            </div>
            <div className="text-center text-green-400 text-sm font-medium">
              Save $105 with RyokoAI
            </div>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Features
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <Card key={i} className="flex items-start gap-3 p-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <h3 className="text-white text-sm font-medium">{f.title}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{f.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Ready to save on your next trip?
        </h2>
        <a
          href="/chat"
          className="inline-flex items-center gap-2 bg-gold text-black font-medium px-8 py-3 rounded-xl hover:bg-gold/90 transition-colors"
        >
          Start Planning for Free →
        </a>
      </section>
    </>
  );
}
