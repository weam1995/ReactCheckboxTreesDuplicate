import React from "react";
import { TreeNode } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleNode } from "@/store/slices/treeSlice";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoIcon } from "lucide-react";

interface CheckboxTreeProps {
  nodeId: string;
  level?: number;
}

export const CheckboxTree: React.FC<CheckboxTreeProps> = ({ 
  nodeId,
  level = 0
}) => {
  const dispatch = useAppDispatch();
  const node = useAppSelector(state => state.tree.allNodes[nodeId]);
  const searchTerm = useAppSelector(state => state.tree.searchTerm);
  
  if (!node) return null;
  
  const handleChange = (checked: boolean) => {
    dispatch(toggleNode({ nodeId, checked }));
  };
  
  // Apply different styles based on level
  const getLevelClasses = () => {
    switch (node.level) {
      case 1:
        return "text-base font-medium mb-4";
      case 2:
        return "mb-2";
      case 3:
        return "mb-1";
      default:
        return "";
    }
  };
  
  // Determine margin-left based on level
  const getMarginLeft = () => {
    return node.level > 1 ? "ml-6 mt-1" : "";
  };
  
  // Show info icon on disabled leaf nodes
  const isLeafNode = !node.children || node.children.length === 0;
  const showInfoIcon = node.disabled && isLeafNode;
  
  // Determine class for container based on node level and type
  const getContainerClass = () => {
    switch (node.level) {
      case 1:
        return "department-node server-type-node db-type-node " + getLevelClasses();
      case 2:
        return "account-type-node access-level-node access-type-node " + getLevelClasses();
      case 3:
        return "access-node server-node instance-node " + getLevelClasses();
      default:
        return "";
    }
  };
  
  return (
    <div className={getContainerClass()}>
      <div className="flex items-center py-1">
        <Checkbox
          id={node.id}
          checked={node.checked}
          disabled={node.disabled}
          onCheckedChange={handleChange}
          className={`h-5 w-5 ${node.disabled ? "text-disabled cursor-not-allowed" : "text-primary"} rounded border-gray-300 focus:ring-primary`}
        />
        <label 
          htmlFor={node.id} 
          className={`ml-2 ${node.disabled ? "text-disabled cursor-not-allowed" : "cursor-pointer"}`}
        >
          {node.label}
        </label>
        {showInfoIcon && (
          <InfoIcon 
            className="ml-2 text-accent cursor-help h-4 w-4" 
            title={getInfoMessage(node.id)}
          />
        )}
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className={getMarginLeft()}>
          {node.children.map(childId => (
            <CheckboxTree 
              key={childId} 
              nodeId={childId} 
              level={node.level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to get info message based on node id
function getInfoMessage(nodeId: string): string {
  switch (nodeId) {
    case "finance-edit-payroll":
      return "This access requires additional approval";
    case "linux-admin-dev":
      return "Access currently restricted";
    case "aix-readonly-prod":
      return "System upgrade in progress";
    case "sql-admin-prod":
      return "Requires security clearance";
    default:
      return "Access is restricted";
  }
}
