import React from "react";
import { CheckboxTree } from "@/components/ui/checkbox-tree";
import { useAppSelector } from "@/store/hooks";
import { filterTree } from "@/utils/treeUtils";

const StandardAccounts: React.FC = () => {
  const standardAccounts = useAppSelector(state => state.tree.standardAccounts);
  const allNodes = useAppSelector(state => state.tree.allNodes);
  const searchTerm = useAppSelector(state => state.tree.searchTerm);
  
  // Filter the tree based on search term
  const filteredAccounts = searchTerm 
    ? filterTree(standardAccounts, allNodes, searchTerm)
    : standardAccounts;
  
  return (
    <div className="p-4 border-b border-gray-200">
      <h2 className="text-lg font-medium mb-3">Standard Accounts</h2>
      
      <div className="tree-container">
        {filteredAccounts.map(node => (
          <CheckboxTree key={node.id} nodeId={node.id} />
        ))}
      </div>
    </div>
  );
};

export default StandardAccounts;
