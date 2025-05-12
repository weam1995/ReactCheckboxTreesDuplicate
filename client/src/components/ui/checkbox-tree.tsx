import React from "react";
import { TreeNode } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleNode } from "@/store/slices/treeSlice";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoIcon, ChevronRight, ChevronDown } from "lucide-react";

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
  const [expanded, setExpanded] = React.useState(true);
  
  if (!node) return null;
  
  const handleChange = (checked: boolean) => {
    dispatch(toggleNode({ nodeId, checked }));
  };
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  // Apply different styles based on level
  const getLevelClasses = () => {
    switch (node.level) {
      case 1:
        return "text-base font-medium";
      case 2:
        return "text-sm";
      case 3:
        return "text-sm";
      default:
        return "";
    }
  };
  
  // Show info icon on disabled leaf nodes
  const isLeafNode = !node.children || node.children.length === 0;
  const showInfoIcon = node.disabled && isLeafNode;
  const hasChildren = node.children && node.children.length > 0;
  
  // Get left padding for alignment
  const getPaddingLeft = () => {
    return node.level === 1 ? "pl-0" : node.level === 2 ? "pl-6" : "pl-10";
  };
  
  // Highlight text that matches search term
  const highlightMatchedText = (text: string) => {
    if (!searchTerm) return text;
    
    const searchTermLower = searchTerm.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Check if this text contains the search term
    if (textLower.includes(searchTermLower)) {
      const startIndex = textLower.indexOf(searchTermLower);
      const endIndex = startIndex + searchTermLower.length;
      
      const before = text.substring(0, startIndex);
      const match = text.substring(startIndex, endIndex);
      const after = text.substring(endIndex);
      
      return (
        <>
          {before}
          <span className="bg-yellow-200 font-medium text-gray-900">{match}</span>
          {after}
        </>
      );
    }
    
    return text;
  };
  
  // Determine if this node directly matches the search term
  const isSearchMatch = searchTerm ? 
    node.label.toLowerCase().includes(searchTerm.toLowerCase()) : false;
  
  return (
    <div className="tree-node-container">
      <div 
        className={`flex items-center py-1.5 w-full hover:bg-gray-50 ${isSearchMatch ? 'bg-gray-50' : ''} ${getPaddingLeft()} ${node.level === 1 ? 'mt-2' : ''}`}
      >
        {hasChildren && (
          <span 
            className="mr-1 cursor-pointer text-gray-500 flex items-center justify-center w-5 h-5" 
            onClick={toggleExpand}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
        {!hasChildren && <span className="w-5 mr-1"></span>}
        
        <Checkbox
          id={node.id}
          checked={node.checked}
          disabled={node.disabled}
          indeterminate={!!node.indeterminate}
          onCheckedChange={handleChange}
          className={`h-4 w-4 ${node.disabled ? "text-gray-300 cursor-not-allowed" : "text-primary"} rounded border-gray-300 focus:ring-primary`}
        />
        <label 
          htmlFor={node.id} 
          className={`ml-2 ${node.disabled ? "text-gray-400 cursor-not-allowed" : "cursor-pointer"} ${getLevelClasses()}`}
        >
          {highlightMatchedText(node.label)}
        </label>
        {showInfoIcon && (
          <div className="relative group">
            <InfoIcon 
              className="ml-2 text-blue-500 cursor-help h-4 w-4" 
            />
            <span className="hidden group-hover:block absolute z-10 bg-gray-800 text-white text-xs rounded py-1 px-2 -mt-1 ml-6 min-w-[180px]">
              {getInfoMessage(node.id)}
            </span>
          </div>
        )}
      </div>
      
      {hasChildren && expanded && node.children && (
        <div className={`tree-children ${node.level >= 3 ? 'pl-4' : ''}`}>
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
