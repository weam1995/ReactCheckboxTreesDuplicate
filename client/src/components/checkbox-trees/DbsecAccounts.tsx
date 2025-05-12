import React from "react";
import { CheckboxTree } from "@/components/ui/checkbox-tree";
import { useAppSelector } from "@/store/hooks";
import { filterTree } from "@/utils/treeUtils";

const DbsecAccounts: React.FC = () => {
  const dbsecAccounts = useAppSelector(state => state.tree.dbsecAccounts);
  const allNodes = useAppSelector(state => state.tree.allNodes);
  const searchTerm = useAppSelector(state => state.tree.searchTerm);
  
  // Filter the tree based on search term
  const filteredAccounts = searchTerm 
    ? filterTree(dbsecAccounts, allNodes, searchTerm)
    : dbsecAccounts;
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-3">Database Security Accounts</h2>
      
      <div className="tree-container">
        {filteredAccounts.map(node => (
          <CheckboxTree key={node.id} nodeId={node.id} />
        ))}
      </div>
    </div>
  );
};

export default DbsecAccounts;
