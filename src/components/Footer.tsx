export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-8 mt-16">
      <div className="max-w-5xl mx-auto px-4 text-center text-gray-500 text-sm space-y-2">
        <p>RyokoAIは価格を保証するものではありません。最終的な料金は各予約サイトでご確認ください。</p>
        <p>&copy; {new Date().getFullYear()} RyokoAI</p>
      </div>
    </footer>
  );
}
