import { TreeNode } from "@/types";

/**
 * Updates the checked state of a node and its children
 */
export const updateNodeAndChildren = (
  node: TreeNode,
  checked: boolean,
  allNodes: { [key: string]: TreeNode }
): { [key: string]: TreeNode } => {
  const updatedNodes = { ...allNodes };
  const queue: TreeNode[] = [node];
  
  while (queue.length > 0) {
    const currentNode = queue.shift();
    if (!currentNode) continue;
    
    // Skip disabled nodes
    if (!currentNode.disabled) {
      updatedNodes[currentNode.id] = {
        ...currentNode,
        checked
      };
    }
    
    // Add children to queue
    if (currentNode.children) {
      for (const childId of currentNode.children) {
        const child = allNodes[childId];
        if (child) {
          queue.push(child);
        }
      }
    }
  }
  
  return updatedNodes;
};

/**
 * Updates the parent nodes based on the state of their children
 */
export const updateParents = (
  nodeId: string,
  allNodes: { [key: string]: TreeNode }
): { [key: string]: TreeNode } => {
  const updatedNodes = { ...allNodes };
  let currentNodeId: string | undefined = nodeId;
  
  while (currentNodeId) {
    const currentNode = updatedNodes[currentNodeId];
    
    // Get parent
    const parentId = currentNode.parent;
    if (!parentId) break;
    
    const parent = updatedNodes[parentId];
    if (!parent) break;
    
    // Check if parent should be disabled
    const children = parent.children || [];
    const childNodes = children.map(id => updatedNodes[id]);
    
    const allChildrenDisabled = childNodes.length > 0 && 
      childNodes.every(child => child.disabled);
    
    // Count non-disabled children
    const nonDisabledChildren = childNodes.filter(child => !child.disabled);
    
    // Check if all non-disabled children are checked
    const allNonDisabledChildrenChecked = nonDisabledChildren.length > 0 && 
      nonDisabledChildren.every(child => child.checked);
    
    // Check if all non-disabled children are unchecked
    const allNonDisabledChildrenUnchecked = nonDisabledChildren.length > 0 && 
      nonDisabledChildren.every(child => !child.checked);
    
    // Check if some but not all non-disabled children are checked (indeterminate state)
    const someNonDisabledChildrenChecked = nonDisabledChildren.length > 0 &&
      nonDisabledChildren.some(child => child.checked || child.indeterminate) &&
      !allNonDisabledChildrenChecked && !allNonDisabledChildrenUnchecked;
    
    updatedNodes[parentId] = {
      ...parent,
      disabled: allChildrenDisabled,
      checked: allNonDisabledChildrenChecked,
      indeterminate: someNonDisabledChildrenChecked
    };
    
    // Move up to the next parent
    currentNodeId = parentId;
  }
  
  return updatedNodes;
};

/**
 * Gets all leaf nodes from the tree
 */
export const getLeafNodes = (
  nodes: TreeNode[],
  allNodes: { [key: string]: TreeNode }
): TreeNode[] => {
  const leafNodes: TreeNode[] = [];
  
  const traverse = (nodeId: string) => {
    const node = allNodes[nodeId];
    if (!node) return;
    
    // If node has no children or all children are disabled, it's a leaf node
    if (!node.children || node.children.length === 0) {
      leafNodes.push(node);
    } else {
      // Otherwise, traverse children
      for (const childId of node.children) {
        traverse(childId);
      }
    }
  };
  
  // Start traversal from each root node
  for (const node of nodes) {
    if (node.children) {
      for (const childId of node.children) {
        traverse(childId);
      }
    }
  }
  
  return leafNodes;
};

/**
 * Gets all checked leaf nodes
 */
export const getCheckedLeafNodes = (
  nodes: TreeNode[],
  allNodes: { [key: string]: TreeNode }
): TreeNode[] => {
  return getLeafNodes(nodes, allNodes).filter(node => node.checked && !node.disabled);
};

/**
 * Filter tree based on search term
 */
export const filterTree = (
  nodes: TreeNode[],
  allNodes: { [key: string]: TreeNode },
  searchTerm: string
): TreeNode[] => {
  if (!searchTerm) return nodes;
  
  const searchTermLower = searchTerm.toLowerCase();
  
  // Track matching nodes and their parent paths
  const directMatchIds = new Set<string>();  // Nodes that directly match the search text
  const pathNodeIds = new Set<string>();     // Parent nodes needed to show the path
  
  // Find nodes that directly match the search term
  Object.values(allNodes).forEach(node => {
    if (node.label.toLowerCase().includes(searchTermLower)) {
      // This is a directly matching node
      directMatchIds.add(node.id);
      
      // Add parent path nodes for navigation context
      let currentNode = node;
      while (currentNode.parent) {
        pathNodeIds.add(currentNode.parent);
        currentNode = allNodes[currentNode.parent];
      }
    }
  });
  
  // If no matches found, return empty tree
  if (directMatchIds.size === 0) {
    return [];
  }
  
  // Create a filtered tree with just matching nodes and their parent paths
  const filterNode = (node: TreeNode): TreeNode | null => {
    // If this is a path node (parent of a match) but not itself a match
    const isPathNode = pathNodeIds.has(node.id);
    // If this node directly matches the search term
    const isMatchNode = directMatchIds.has(node.id);
    
    // If neither a path node nor a match, skip this branch
    if (!isPathNode && !isMatchNode) {
      return null;
    }
    
    // For path nodes, only include children that are either matches or part of a path to matches
    if (node.children && node.children.length > 0) {
      const filteredChildren = node.children
        .filter(childId => directMatchIds.has(childId) || pathNodeIds.has(childId))
        .map(childId => {
          const childNode = filterNode(allNodes[childId]);
          return childNode ? childId : null;
        })
        .filter(Boolean) as string[];
      
      // Only include this node if it has matching children or is itself a match
      if (filteredChildren.length > 0 || isMatchNode) {
        return {
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        };
      }
    } 
    // If this is a leaf node that matches the search
    else if (isMatchNode) {
      return node;
    }
    
    return null;
  };
  
  return nodes
    .map(node => filterNode(node))
    .filter(Boolean) as TreeNode[];
};
