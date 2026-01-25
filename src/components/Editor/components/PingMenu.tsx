import { useState, useEffect, useRef } from "react";
import { Popover } from "@ark-ui/react/popover";
import { Checkbox } from "@ark-ui/react/checkbox";
import clsx from "clsx";

import { Avatar } from "../../Avatar/Avatar";
import { PresenceUser } from "../shared/followTypes";

interface PingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: PresenceUser[];
  onSendPing: (targets: string[] | "all") => void;
  position?: { x: number; y: number };
  currentDocId?: string | null;
}

export function PingMenu({
  isOpen,
  onClose,
  onlineUsers,
  onSendPing,
  position,
  currentDocId,
}: PingMenuProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserIds([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (anchorRef.current && position) {
      anchorRef.current.style.left = `${position.x}px`;
      anchorRef.current.style.top = `${position.y}px`;
    }
  }, [position]);

  const handleBroadcast = () => {
    onSendPing("all");
    onClose();
  };

  const handleSendToSelected = () => {
    if (selectedUserIds.length > 0) {
      onSendPing(selectedUserIds);
      onClose();
    }
  };

  const getPositioning = () => {
    if (position) {
      return {
        placement: "bottom-start" as const,
        offset: { mainAxis: 0, crossAxis: 0 },
      };
    }
    return {
      placement: "bottom" as const,
      offset: { mainAxis: 0 },
    };
  };

  return (
    <>
      <div
        ref={anchorRef}
        style={{
          position: "fixed",
          left: position?.x ?? "50%",
          top: position?.y ?? "50%",
          width: 1,
          height: 1,
          pointerEvents: "none",
        }}
        data-ping-anchor
      />
      <Popover.Root
        open={isOpen}
        onOpenChange={(details) => {
          if (!details.open) onClose();
        }}
        positioning={{
          ...getPositioning(),
          getAnchorRect: () => {
            if (anchorRef.current) {
              return anchorRef.current.getBoundingClientRect();
            }
            return null;
          },
        }}
        portalled
        lazyMount
        unmountOnExit
      >
        <Popover.Positioner>
          <Popover.Content
            className="bg-zed-bg border border-zed-border rounded-lg shadow-lg min-w-[240px] p-2 z-50 outline-none"
          >
            <Popover.Title className="text-sm font-medium text-zed-fg mb-2 px-2">
              Ping to Follow
            </Popover.Title>

            {onlineUsers.length === 0 ? (
              <Popover.Description className="text-sm text-zed-muted px-2 py-3">
                No other users online
              </Popover.Description>
            ) : (
              <>
                <button
                  onClick={handleBroadcast}
                  className={clsx(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left",
                    "hover:bg-zed-active text-zed-fg transition-colors"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-zed-muted/20 flex items-center justify-center text-xs">
                    {onlineUsers.length}
                  </div>
                  <span>Broadcast to All</span>
                </button>

                <div className="h-px bg-zed-border my-1.5" />

                <Checkbox.Group
                  value={selectedUserIds}
                  onValueChange={(value) => setSelectedUserIds(value)}
                  className="max-h-[200px] overflow-y-auto"
                >
                  {onlineUsers.map((user) => {
                    const isInDifferentDoc =
                      currentDocId &&
                      user.current_doc_id &&
                      user.current_doc_id !== currentDocId;
                    return (
                      <Checkbox.Root
                        key={user.user_id}
                        value={user.user_id}
                        className={clsx(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left cursor-pointer",
                          "hover:bg-zed-active transition-colors",
                          "data-[state=checked]:bg-zed-active"
                        )}
                      >
                        <Checkbox.Control
                          className={clsx(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                            "border-zed-border",
                            "data-[state=checked]:bg-zed-blue data-[state=checked]:border-zed-blue"
                          )}
                        >
                          <Checkbox.Indicator>
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </Checkbox.Indicator>
                        </Checkbox.Control>
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: user.color }}
                        />
                        <Avatar size="xs" name={user.username} />
                        <Checkbox.Label className="text-zed-fg truncate flex-1">
                          {user.username}
                        </Checkbox.Label>
                        {isInDifferentDoc && (
                          <span className="text-xs text-zed-muted">other doc</span>
                        )}
                        <Checkbox.HiddenInput />
                      </Checkbox.Root>
                    );
                  })}
                </Checkbox.Group>

                {selectedUserIds.length > 0 && (
                  <>
                    <div className="h-px bg-zed-border my-1.5" />
                    <button
                      onClick={handleSendToSelected}
                      className={clsx(
                        "w-full px-2 py-1.5 rounded-md text-sm text-center",
                        "bg-zed-blue text-white hover:bg-zed-blue/90 transition-colors"
                      )}
                    >
                      Send Ping ({selectedUserIds.length})
                    </button>
                  </>
                )}
              </>
            )}
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>
    </>
  );
}
