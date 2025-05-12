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
 * Filter tree based on search term - extremely simple direct path approach
 */
export const filterTree = (
  nodes: TreeNode[],
  allNodes: { [key: string]: TreeNode },
  searchTerm: string
): TreeNode[] => {
  if (!searchTerm) return nodes;
  
  // Convert search term to lowercase for case-insensitive matching
  const searchTermLower = searchTerm.toLowerCase();
  
  // Step 1: Find matching nodes
  const matchingNodeIds: string[] = [];
  Object.keys(allNodes).forEach(id => {
    if (allNodes[id].label.toLowerCase().includes(searchTermLower)) {
      matchingNodeIds.push(id);
    }
  });
  
  // If no matches, return empty array
  if (matchingNodeIds.length === 0) {
    return [];
  }
  
  // Step 2: Create direct paths from each matching node to root
  const pathMap: { [rootId: string]: Set<string> } = {};
  
  // For each matching node, trace path to root
  matchingNodeIds.forEach(matchId => {
    // Trace path up to root
    const path: string[] = [matchId];
    let currentNodeId = matchId;
    
    // Walk up to root
    while (allNodes[currentNodeId]?.parent) {
      const parentId = allNodes[currentNodeId].parent!;
      path.unshift(parentId);
      currentNodeId = parentId;
    }
    
    // Root node is first in path
    const rootId = path[0];
    
    // Initialize path map for this root if needed
    if (!pathMap[rootId]) {
      pathMap[rootId] = new Set<string>();
    }
    
    // Add all nodes in path to this root's set
    path.forEach(id => {
      pathMap[rootId].add(id);
    });
  });
  
  // Step 3: Create the filtered trees
  return nodes
    .map(rootNode => {
      // Skip roots that don't lead to matches
      if (!pathMap[rootNode.id]) {
        return null;
      }
      
      // Create filtered version of root
      const newRoot: TreeNode = {
        ...rootNode,
        children: undefined
      };
      
      // Get IDs of visible nodes for this root
      const visibleIds = pathMap[rootNode.id];
      
      // Helper to create filtered tree
      const createFilteredNode = (nodeId: string): TreeNode => {
        const node = allNodes[nodeId];
        
        // Create a filtered children list only with nodes in our path
        const filteredChildren = node.children 
          ? node.children.filter(childId => visibleIds.has(childId))
          : undefined;
        
        // Return a node copy with filtered children
        return {
          ...node,
          children: filteredChildren && filteredChildren.length > 0 
            ? filteredChildren 
            : undefined
        };
      };
      
      // Build the filtered tree starting from root
      const buildFilteredTree = (nodeId: string): TreeNode => {
        return createFilteredNode(nodeId);
      };
      
      return buildFilteredTree(rootNode.id);
    })
    .filter(Boolean) as TreeNode[];
};
