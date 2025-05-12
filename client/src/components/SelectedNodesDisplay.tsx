import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeSelectedNode } from "@/store/slices/treeSlice";
import { X } from "lucide-react";

const SelectedNodesDisplay: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedNodes = useAppSelector(state => state.tree.selectedLeafNodes);
  
  const handleRemoveNode = (nodeId: string) => {
    dispatch(removeSelectedNode(nodeId));
  };
  
  return (
    <div className="mb-6 bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium mb-3">Selected Accounts</h2>
      <div>
        <span className="text-sm text-textSecondary">
          {selectedNodes.length} accounts selected
        </span>
      </div>
      <div className="mt-2">
        {selectedNodes.map(node => (
          <div 
            key={node.id}
            className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm mr-2 mb-2"
          >
            <span>{node.label}</span>
            <button 
              className="ml-2 text-gray-500 hover:text-gray-700"
              onClick={() => handleRemoveNode(node.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedNodesDisplay;
