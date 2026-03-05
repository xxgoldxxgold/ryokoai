import Avatar from '@/components/ui/Avatar';

interface UserMessageProps {
  content: string;
}

export default function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end gap-3">
      <div className="max-w-[80%] md:max-w-[60%]">
        <div className="bg-gold/10 text-white rounded-2xl rounded-tr-md px-4 py-3 text-sm leading-relaxed">
          {content}
        </div>
      </div>
      <Avatar className="shrink-0 mt-1" />
    </div>
  );
}
