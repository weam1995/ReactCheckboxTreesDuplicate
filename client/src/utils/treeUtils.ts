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
 * Filter tree based on search term - extremely simple fixed path approach
 */
export const filterTree = (
  nodes: TreeNode[],
  allNodes: { [key: string]: TreeNode },
  searchTerm: string
): TreeNode[] => {
  if (!searchTerm) return nodes;
  
  // Convert search term to lowercase for case-insensitive matching
  const searchTermLower = searchTerm.toLowerCase();
  
  // Step 1: Find all nodes that match the search term
  const matchingNodes: TreeNode[] = [];
  
  Object.values(allNodes).forEach(node => {
    if (node.label.toLowerCase().includes(searchTermLower)) {
      matchingNodes.push(node);
    }
  });
  
  // If no matches, return empty array
  if (matchingNodes.length === 0) {
    return [];
  }
  
  // Step 2: Create a new set of nodes with only the exact paths to matches
  const filteredCopyOfOriginalNodes: TreeNode[] = [];
  
  // Process each matching node
  matchingNodes.forEach(matchNode => {
    // Create a path from this node up to the root
    const pathIds: string[] = [matchNode.id];
    let currentId = matchNode.id;
    
    // Walk up the tree adding all ancestors
    while (allNodes[currentId].parent) {
      currentId = allNodes[currentId].parent!;
      pathIds.unshift(currentId);
    }
    
    // Find or create the root in our filtered copy
    const rootId = pathIds[0];
    let rootInFilter = filteredCopyOfOriginalNodes.find(n => n.id === rootId);
    
    if (!rootInFilter) {
      // Create a copy of the root with empty children array
      rootInFilter = {
        ...allNodes[rootId],
        children: []
      };
      filteredCopyOfOriginalNodes.push(rootInFilter);
    }
    
    // Now create the exact path down to this matching node
    let parentNode = rootInFilter;
    
    // For each level beneath the root, create or update the node
    for (let i = 1; i < pathIds.length; i++) {
      const currentPathId = pathIds[i];
      const originalNode = allNodes[currentPathId];
      
      // Check if the parent already has this node as a child
      if (!parentNode.children!.includes(currentPathId)) {
        parentNode.children!.push(currentPathId);
      }
      
      // If this is not the last node in the path, prepare for next iteration
      if (i < pathIds.length - 1) {
        // Set up the next parent for iteration
        if (allNodes[currentPathId].children) {
          // Update parent to this node for next iteration
          parentNode = allNodes[parentNode.children![parentNode.children!.length - 1]]; 
        }
      }
    }
  });
  
  return filteredCopyOfOriginalNodes;
};
