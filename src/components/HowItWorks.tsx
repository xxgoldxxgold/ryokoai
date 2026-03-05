const STEPS = [
  { num: '1', title: 'ホテル名を入力', desc: '泊まりたいホテルの名前またはOTAのURLを入力します。' },
  { num: '2', title: '国別リンクが生成', desc: '18カ国分のAgoda・Booking.comリンクが一覧表示されます。' },
  { num: '3', title: '各国の価格をチェック', desc: 'リンクをクリックして、各国設定での料金を比較します。' },
  { num: '4', title: '最安値で予約', desc: '一番安い国設定のリンクから予約。VPNを使うとさらにお得に。' },
];

export default function HowItWorks() {
  return (
    <section className="max-w-3xl mx-auto">
      <h2 className="text-white font-bold text-xl text-center mb-8">使い方</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step) => (
          <div key={step.num} className="bg-[#1E293B] border border-white/5 rounded-xl p-5 space-y-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold">
              {step.num}
            </div>
            <h3 className="text-white text-sm font-medium">{step.title}</h3>
            <p className="text-white/40 text-xs leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
