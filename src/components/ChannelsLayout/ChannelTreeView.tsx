import { useMemo, useState } from "react";
import { TreeView, createTreeCollection } from "@ark-ui/react/tree-view";
import { Dialog } from "@ark-ui/react/dialog";
import { Menu } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import { InlineEditable } from "./InlineEditable";
import HashtagIcon from "~icons/solar/hashtag-outline";
import CalendarIcon from "~icons/solar/calendar-date-outline";
import ArrowRightIcon from "~icons/solar/alt-arrow-right-outline";
import ArrowDownIcon from "~icons/solar/alt-arrow-down-outline";
import AddIcon from "~icons/solar/add-square-outline";
import LoadingIcon from "~icons/solar/refresh-circle-outline";
import CloseIcon from "~icons/solar/close-circle-outline";
import PenIcon from "~icons/solar/pen-outline";
import TrashIcon from "~icons/solar/trash-bin-minimalistic-outline";
import FileAddIcon from "~icons/solar/document-add-outline";
import { useChannelsContext } from "../../contexts/channels";
import { formatDocumentDate } from "../../services/channels";
import { ChannelWithDocuments } from "../../hooks/useChannelsElectric";

interface TreeNode {
  id: string;
  name: string;
  type: "channel" | "document";
  channelId?: string;
  documentId?: string;
  children?: TreeNode[];
}

function getDocumentDisplayName(doc: { name: string; inserted_at: string }): string {
  if (doc.name) return doc.name;
  if (!doc.inserted_at) return 'Untitled';
  const formatted = formatDocumentDate(doc.inserted_at);
  return formatted === 'Invalid Date' ? 'Untitled' : formatted;
}

function buildTreeNodes(channels: ChannelWithDocuments[]): TreeNode[] {
  return channels.map(channel => ({
    id: `channel-${channel.id}`,
    name: channel.name,
    type: "channel" as const,
    channelId: channel.id,
    children: channel.documents.map(doc => ({
      id: `doc-${doc.id}`,
      name: getDocumentDisplayName(doc),
      type: "document" as const,
      documentId: doc.id,
    })),
  }));
}

const CreateChannelDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await onSubmit(name.trim());
      setName("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Positioner className="fixed inset-0 flex items-center justify-center z-50">
          <Dialog.Content className="bg-white rounded-lg shadow-xl p-6 w-[400px] max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Create Channel
              </Dialog.Title>
              <Dialog.CloseTrigger className="text-gray-500 hover:text-gray-700">
                <CloseIcon className="size-5" />
              </Dialog.CloseTrigger>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Channel name"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Dialog.CloseTrigger className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                  Cancel
                </Dialog.CloseTrigger>
                <button
                  type="submit"
                  disabled={!name.trim() || loading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

const TreeViewActions = () => {
  const { addChannel } = useChannelsContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateChannel = async (name: string) => {
    await addChannel(name);
  };

  return (
    <>
      <div className="flex justify-end px-2 py-1">
        <button 
          onClick={() => setDialogOpen(true)}
          className="text-gray-900 hover:bg-black/5 p-1 rounded transition-colors"
        >
          <AddIcon className="size-5" />
        </button>
      </div>
      <CreateChannelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateChannel}
      />
    </>
  );
};

interface ChannelContextMenuProps {
  channelId: string;
  children: React.ReactNode;
  onRenameClick: () => void;
  onNewDocument: (documentId: string) => void;
}

const ChannelContextMenu = ({ channelId, children, onRenameClick, onNewDocument }: ChannelContextMenuProps) => {
  const { removeChannel, addDocument } = useChannelsContext();

  const handleDelete = async () => {
    await removeChannel(channelId);
  };

  const handleNewDocument = () => {
    const newDocId = addDocument(channelId);
    onNewDocument(newDocId);
  };

  return (
    <>
      <Menu.Root onSelect={(details) => {
        if (details.value === "new-document") {
          handleNewDocument();
        } else if (details.value === "rename") {
          onRenameClick();
        } else if (details.value === "delete") {
          handleDelete();
        }
      }}>
        <Menu.ContextTrigger asChild>
          {children}
        </Menu.ContextTrigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50">
              <Menu.Item value="new-document" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                <FileAddIcon className="size-4" />
                New Document
              </Menu.Item>
              <Menu.Separator className="h-px bg-gray-200 my-1" />
              <Menu.Item value="rename" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                <PenIcon className="size-4" />
                Rename
              </Menu.Item>
              <Menu.Item value="delete" className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
                <TrashIcon className="size-4" />
                Delete
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </>
  );
};

interface DocumentContextMenuProps {
  documentId: string;
  children: React.ReactNode;
  onSelect: () => void;
  onRenameClick: () => void;
}

const DocumentContextMenu = ({ documentId, children, onSelect, onRenameClick }: DocumentContextMenuProps) => {
  const { removeDocument } = useChannelsContext();

  const handleDelete = async () => {
    await removeDocument(documentId);
  };

  return (
    <Menu.Root onSelect={(details) => {
      if (details.value === "rename") {
        onRenameClick();
      } else if (details.value === "delete") {
        handleDelete();
      }
    }}>
      <Menu.ContextTrigger asChild onClick={onSelect}>
        {children}
      </Menu.ContextTrigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50">
            <Menu.Item value="rename" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              <PenIcon className="size-4" />
              Rename
            </Menu.Item>
            <Menu.Item value="delete" className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
              <TrashIcon className="size-4" />
              Delete
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

interface TreeNodeProps {
  node: TreeNode;
  indexPath: number[];
  selectedDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
  editingChannelId: string | null;
  setEditingChannelId: (id: string | null) => void;
  editingDocumentId: string | null;
  setEditingDocumentId: (id: string | null) => void;
}

const TreeNodeComponent = ({ node, indexPath, selectedDocumentId, onSelectDocument, editingChannelId, setEditingChannelId, editingDocumentId, setEditingDocumentId }: TreeNodeProps) => {
  const { updateChannel, updateDocument } = useChannelsContext();
  const isDocument = node.type === "document";
  const isSelected = node.documentId === selectedDocumentId;

  const handleClick = () => {
    if (node.documentId) {
      onSelectDocument(node.documentId);
    }
  };

  return (
    <TreeView.NodeProvider key={node.id} node={node} indexPath={indexPath}>
      {node.children && node.channelId ? (
         <TreeView.Branch>
           <ChannelContextMenu 
             channelId={node.channelId} 
             onRenameClick={() => setEditingChannelId(node.channelId!)}
             onNewDocument={(docId) => {
               onSelectDocument(docId);
               setEditingDocumentId(docId);
             }}
           >
             <TreeView.BranchControl className="flex items-center gap-2 px-2 py-1.5 w-full text-sm text-gray-900 hover:bg-black/5 rounded cursor-pointer data-[state=open]:text-orange-500 transition-colors group">
              <TreeView.BranchIndicator className="text-gray-500 group-data-[state=open]:text-orange-500">
                <ArrowRightIcon className="size-4 group-data-[state=open]:hidden" />
                <ArrowDownIcon className="size-4 hidden group-data-[state=open]:block" />
              </TreeView.BranchIndicator>
              <TreeView.BranchText className="flex items-center gap-2 font-medium">
                <HashtagIcon className="size-4 text-gray-500 group-data-[state=open]:text-orange-500" />
                <InlineEditable
                  value={node.name}
                  onCommit={async (newName) => {
                    if (!newName.trim()) return;
                    await updateChannel(node.channelId!, newName.trim());
                    setEditingChannelId(null);
                  }}
                  className="flex-1"
                  inputClassName="font-medium"
                  previewClassName="font-medium"
                />
              </TreeView.BranchText>
            </TreeView.BranchControl>
          </ChannelContextMenu>
           <TreeView.BranchContent className="pl-4">
            {node.children.map((child, index) => (
              <TreeNodeComponent 
                key={child.id} 
                node={child} 
                indexPath={[...indexPath, index]}
                selectedDocumentId={selectedDocumentId}
                onSelectDocument={onSelectDocument}
                editingChannelId={editingChannelId}
                setEditingChannelId={setEditingChannelId}
                editingDocumentId={editingDocumentId}
                setEditingDocumentId={setEditingDocumentId}
              />
            ))}
           </TreeView.BranchContent>
        </TreeView.Branch>
       ) : isDocument && node.documentId ? (
         <DocumentContextMenu 
           documentId={node.documentId} 
           onSelect={handleClick}
           onRenameClick={() => setEditingDocumentId(node.documentId!)}
         >
           <TreeView.Item 
             className={`flex items-center gap-2 px-2 py-1.5 w-full text-sm text-gray-900 hover:bg-black/5 rounded cursor-pointer pl-8 ${isSelected ? 'bg-orange-100 text-orange-600' : ''}`}
           >
             <TreeView.ItemText className="flex items-center gap-2">
               <CalendarIcon className={`size-4 ${isSelected ? 'text-orange-500' : 'text-gray-500'}`} />
               <InlineEditable
                 value={node.name}
                 onCommit={async (newName) => {
                   if (!newName.trim()) return;
                   await updateDocument(node.documentId!, newName.trim());
                   setEditingDocumentId(null);
                 }}
                 className="flex-1"
               />
             </TreeView.ItemText>
           </TreeView.Item>
         </DocumentContextMenu>
       ) : (
         <TreeView.Item 
           onClick={handleClick}
           className={`flex items-center gap-2 px-2 py-1.5 w-full text-sm text-gray-900 hover:bg-black/5 rounded cursor-pointer pl-8 ${isSelected ? 'bg-orange-100 text-orange-600' : ''}`}
         >
           <TreeView.ItemText className="flex items-center gap-2">
             <CalendarIcon className={`size-4 ${isSelected ? 'text-orange-500' : 'text-gray-500'}`} />
             <InlineEditable
               value={node.name}
               onCommit={async (newName) => {
                 if (!newName.trim()) return;
                 await updateDocument(node.documentId!, newName.trim());
                 setEditingDocumentId(null);
               }}
               className="flex-1"
             />
           </TreeView.ItemText>
         </TreeView.Item>
       )}
    </TreeView.NodeProvider>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center py-8 text-gray-500">
    <LoadingIcon className="size-5 animate-spin" />
    <span className="ml-2 text-sm">Loading channels...</span>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
    <p className="text-sm text-red-500 mb-2">{error}</p>
    <button 
      onClick={onRetry}
      className="text-sm text-orange-500 hover:text-orange-600"
    >
      Retry
    </button>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
    <p className="text-sm">No channels yet</p>
    <p className="text-xs">Click + to create one</p>
  </div>
);

export const ChannelTreeView = () => {
  const { channels, loading, error, selectedDocumentId, selectDocument, refresh } = useChannelsContext();
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);

  const collection = useMemo(() => {
    const treeNodes = buildTreeNodes(channels);
    return createTreeCollection<TreeNode>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      rootNode: {
        id: "ROOT",
        name: "",
        type: "channel",
        children: treeNodes,
      },
    });
  }, [channels]);

  const defaultExpanded = useMemo(() => {
    return channels.map(c => `channel-${c.id}`);
  }, [channels]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <TreeViewActions />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <TreeViewActions />
        <ErrorState error={error} onRetry={refresh} />
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <TreeViewActions />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <TreeViewActions />
      <TreeView.Root
        collection={collection}
        defaultExpandedValue={defaultExpanded}
        className="w-full"
      >
          <TreeView.Tree>
            {collection.rootNode.children?.map((node, index) => (
              <TreeNodeComponent 
                key={node.id} 
                node={node} 
                indexPath={[index]}
                selectedDocumentId={selectedDocumentId}
                onSelectDocument={selectDocument}
                editingChannelId={editingChannelId}
                setEditingChannelId={setEditingChannelId}
                editingDocumentId={editingDocumentId}
                setEditingDocumentId={setEditingDocumentId}
              />
            ))}
          </TreeView.Tree>
      </TreeView.Root>
    </div>
  );
};
