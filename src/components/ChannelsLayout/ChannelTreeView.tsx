import { useMemo } from "react";
import { TreeView, createTreeCollection } from "@ark-ui/react/tree-view";
import HashtagIcon from "~icons/solar/hashtag-outline";
import CalendarIcon from "~icons/solar/calendar-date-outline";
import ArrowRightIcon from "~icons/solar/alt-arrow-right-outline";
import ArrowDownIcon from "~icons/solar/alt-arrow-down-outline";
import AddIcon from "~icons/solar/add-square-outline";
import LoadingIcon from "~icons/solar/refresh-circle-outline";
import { useChannelsContext } from "../../contexts/channels";
import { formatDocumentDate, Channel } from "../../services/channels";

interface TreeNode {
  id: string;
  name: string;
  type: "channel" | "document";
  documentId?: string;
  children?: TreeNode[];
}

function buildTreeNodes(channels: Channel[]): TreeNode[] {
  return channels.map(channel => ({
    id: `channel-${channel.id}`,
    name: channel.name,
    type: "channel" as const,
    children: channel.documents.map(doc => ({
      id: `doc-${doc.id}`,
      name: doc.title || formatDocumentDate(doc.created_at),
      type: "document" as const,
      documentId: doc.id,
    })),
  }));
}

const TreeViewActions = () => {
  const { addChannel } = useChannelsContext();
  
  const handleAddChannel = async () => {
    const name = prompt("Enter channel name:");
    if (name?.trim()) {
      await addChannel(name.trim());
    }
  };
  
  return (
    <div className="flex justify-end px-2 py-1">
      <button 
        onClick={handleAddChannel}
        className="text-gray-900 hover:bg-black/5 p-1 rounded transition-colors"
      >
        <AddIcon className="size-5" />
      </button>
    </div>
  );
};

interface TreeNodeProps {
  node: TreeNode;
  indexPath: number[];
  selectedDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
}

const TreeNodeComponent = ({ node, indexPath, selectedDocumentId, onSelectDocument }: TreeNodeProps) => {
  const isChannel = node.type === "channel";
  const isSelected = node.documentId === selectedDocumentId;

  const handleClick = () => {
    if (node.documentId) {
      onSelectDocument(node.documentId);
    }
  };

  return (
    <TreeView.NodeProvider key={node.id} node={node} indexPath={indexPath}>
      {node.children && node.children.length > 0 ? (
        <TreeView.Branch>
          <TreeView.BranchControl className="flex items-center gap-2 px-2 py-1.5 w-full text-sm text-gray-900 hover:bg-black/5 rounded cursor-pointer data-[state=open]:text-orange-500 transition-colors group">
            <TreeView.BranchIndicator className="text-gray-500 group-data-[state=open]:text-orange-500">
              <ArrowRightIcon className="size-4 group-data-[state=open]:hidden" />
              <ArrowDownIcon className="size-4 hidden group-data-[state=open]:block" />
            </TreeView.BranchIndicator>
            <TreeView.BranchText className="flex items-center gap-2 font-medium">
              <HashtagIcon className="size-4 text-gray-500 group-data-[state=open]:text-orange-500" />
              {node.name}
            </TreeView.BranchText>
          </TreeView.BranchControl>
          <TreeView.BranchContent className="pl-4">
            {node.children.map((child, index) => (
              <TreeNodeComponent 
                key={child.id} 
                node={child} 
                indexPath={[...indexPath, index]}
                selectedDocumentId={selectedDocumentId}
                onSelectDocument={onSelectDocument}
              />
            ))}
          </TreeView.BranchContent>
        </TreeView.Branch>
      ) : (
        <TreeView.Item 
          onClick={handleClick}
          className={`flex items-center gap-2 px-2 py-1.5 w-full text-sm text-gray-900 hover:bg-black/5 rounded cursor-pointer pl-8 ${isSelected ? 'bg-orange-100 text-orange-600' : ''}`}
        >
          <TreeView.ItemText className="flex items-center gap-2">
            {isChannel ? (
               <HashtagIcon className="size-4 text-gray-500" />
            ) : (
               <CalendarIcon className={`size-4 ${isSelected ? 'text-orange-500' : 'text-gray-500'}`} />
            )}
            {node.name}
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
            />
          ))}
        </TreeView.Tree>
      </TreeView.Root>
    </div>
  );
};
