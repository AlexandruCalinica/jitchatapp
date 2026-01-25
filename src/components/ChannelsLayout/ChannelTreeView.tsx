import { TreeView, createTreeCollection } from "@ark-ui/react/tree-view";
import HashtagIcon from "~icons/solar/hashtag-outline";
import CalendarIcon from "~icons/solar/calendar-date-outline";
import ArrowRightIcon from "~icons/solar/alt-arrow-right-outline";
import ArrowDownIcon from "~icons/solar/alt-arrow-down-outline";
import AddIcon from "~icons/solar/add-square-outline";

interface ChannelNode {
  id: string;
  name: string;
  type: "channel" | "date";
  children?: ChannelNode[];
}

const collection = createTreeCollection<ChannelNode>({
  nodeToValue: (node) => node.id,
  nodeToString: (node) => node.name,
  rootNode: {
    id: "ROOT",
    name: "",
    type: "channel",
    children: [
      {
        id: "channel-2",
        name: "Channel2",
        type: "channel",
      },
      {
        id: "channel-1",
        name: "Channel1",
        type: "channel",
        children: [
          { id: "date-1", name: "19 Jan", type: "date" },
          { id: "date-2", name: "Yesterday", type: "date" },
          { id: "date-3", name: "Today", type: "date" },
        ],
      },
      {
        id: "channel-3",
        name: "Channel3",
        type: "channel",
      },
    ],
  },
});

const TreeViewActions = () => (
  <div className="flex justify-end px-2 py-1">
    <button className="text-gray-900 hover:bg-black/5 p-1 rounded transition-colors">
      <AddIcon className="size-5" />
    </button>
  </div>
);

const TreeNode = (props: TreeView.NodeProviderProps<ChannelNode>) => {
  const { node, indexPath } = props;
  const isChannel = node.type === "channel";

  return (
    <TreeView.NodeProvider key={node.id} node={node} indexPath={indexPath}>
      {node.children ? (
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
              <TreeNode key={child.id} node={child} indexPath={[...indexPath, index]} />
            ))}
          </TreeView.BranchContent>
        </TreeView.Branch>
      ) : (
        <TreeView.Item className="flex items-center gap-2 px-2 py-1.5 w-full text-sm text-gray-900 hover:bg-black/5 rounded cursor-pointer data-[selected]:bg-black/5 pl-8">
          <TreeView.ItemText className="flex items-center gap-2">
            {isChannel ? (
               <HashtagIcon className="size-4 text-gray-500" />
            ) : (
               <CalendarIcon className="size-4 text-gray-500" />
            )}
            {node.name}
          </TreeView.ItemText>
        </TreeView.Item>
      )}
    </TreeView.NodeProvider>
  );
};

export const ChannelTreeView = () => {
  return (
    <div className="flex flex-col gap-2">
      <TreeViewActions />
      <TreeView.Root
        collection={collection}
        defaultExpandedValue={["channel-1"]}
        className="w-full"
      >
        <TreeView.Tree>
          {collection.rootNode.children?.map((node, index) => (
            <TreeNode key={node.id} node={node} indexPath={[index]} />
          ))}
        </TreeView.Tree>
      </TreeView.Root>
    </div>
  );
};
