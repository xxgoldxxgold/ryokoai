const STEPS = [
  { num: '1', title: 'ホテル名を入力', desc: '泊まりたいホテルの名前またはURLを入力します。' },
  { num: '2', title: '価格を一括取得', desc: '複数の予約サイトから最新価格を自動で取得します。' },
  { num: '3', title: '最安値を確認', desc: '予約サイト別の価格ランキングで一番安いサイトが一目でわかります。' },
  { num: '4', title: 'そのまま予約', desc: '最安サイトのリンクをタップしてそのまま予約できます。' },
];

export default function HowItWorks() {
  return (
    <section className="max-w-3xl mx-auto">
      <h2 className="text-gray-900 font-bold text-xl text-center mb-8">使い方</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step) => (
          <div key={step.num} className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
              {step.num}
            </div>
            <h3 className="text-gray-900 text-sm font-medium">{step.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
