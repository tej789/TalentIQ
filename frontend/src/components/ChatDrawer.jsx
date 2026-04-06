import { XIcon, MessageSquareIcon } from "lucide-react";
import { Channel, Chat, MessageInput, MessageList, Thread, Window } from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";

/**
 * ChatDrawer renders as a side drawer on desktop and bottom sheet on mobile.
 * It uses the existing Stream Chat SDK.
 */
function ChatDrawer({ isOpen, onClose, chatClient, channel }) {
  // Guard against disconnected chat client
  if (!chatClient || !channel) return null;

  // Check if the client has been disconnected
  const isClientReady = chatClient.userID && chatClient.wsConnection?.isHealthy !== false;
  if (!isClientReady) return null;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`chat-drawer ${isOpen ? "chat-drawer-open" : "chat-drawer-closed"}`}
      >
        {/* Header */}
        <div className="chat-drawer-header">
          <div className="flex items-center gap-2">
            <MessageSquareIcon className="w-4 h-4 text-accent-primary" />
            <h3 className="font-semibold text-text-primary text-sm">Session Chat</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-hover rounded-md text-text-secondary hover:text-text-primary transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Chat content */}
        {isOpen && (
          <div className="chat-drawer-content stream-chat-dark">
            <Chat client={chatClient} theme="str-chat__theme-dark">
              <Channel channel={channel}>
                <Window>
                  <MessageList />
                  <MessageInput />
                </Window>
                <Thread />
              </Channel>
            </Chat>
          </div>
        )}
      </div>
    </>
  );
}

export default ChatDrawer;
