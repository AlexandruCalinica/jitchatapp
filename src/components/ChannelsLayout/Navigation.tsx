import HashtagChatIcon from "~icons/solar/hashtag-chat-outline";
import MentionCircleIcon from "~icons/solar/mention-circle-outline";

export const Navigation = () => {
  return (
    <div className="flex items-center gap-1 p-3 bg-gray-100">
      <button className="p-1 rounded text-gray-900 hover:bg-black/5 transition-colors">
        <HashtagChatIcon className="size-5" />
      </button>
      <button className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-black/5 transition-colors">
        <MentionCircleIcon className="size-5" />
      </button>
    </div>
  );
};
