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
  
  // Find exact matching nodes
  const matchingNodes: string[] = [];
  for (const id in allNodes) {
    if (allNodes[id].label.toLowerCase().includes(searchTermLower)) {
      matchingNodes.push(id);
    }
  }
  
  if (matchingNodes.length === 0) {
    return [];
  }
  
  // Build paths from root to each matching node
  const pathsToMatches: Record<string, string[]> = {};
  matchingNodes.forEach(matchId => {
    // Start with the matching node
    let path: string[] = [matchId];
    let currentNodeId = matchId;
    
    // Walk up the tree to find all ancestors
    while (allNodes[currentNodeId]?.parent) {
      const parentId = allNodes[currentNodeId].parent!;
      path.unshift(parentId);
      currentNodeId = parentId;
    }
    
    pathsToMatches[matchId] = path;
  });
  
  // Create a filtered copy of the tree that only shows paths to matches
  const result: TreeNode[] = [];
  
  // Process the root nodes for matches
  nodes.forEach(rootNode => {
    // Check if any matching paths start with this root
    const matchPathsFromThisRoot = matchingNodes
      .filter(matchId => pathsToMatches[matchId][0] === rootNode.id);
    
    if (matchPathsFromThisRoot.length === 0) {
      return; // No matches from this root
    }
    
    // Create a filtered tree starting from this root
    const newRoot = { ...rootNode, children: [] };
    
    // For each matching path from this root
    matchPathsFromThisRoot.forEach(matchId => {
      const path = pathsToMatches[matchId];
      
      // Start at the root level
      let currentNode = newRoot;
      
      // Build the path from root to match
      for (let i = 1; i < path.length; i++) {
        const childId = path[i];
        
        // Check if this child is already in the filtered tree
        let childExists = false;
        let childIndex = -1;
        
        if (currentNode.children) {
          for (let j = 0; j < currentNode.children.length; j++) {
            if (currentNode.children[j] === childId) {
              childExists = true;
              childIndex = j;
              break;
            }
          }
        } else {
          currentNode.children = [];
        }
        
        // Add child if it doesn't exist
        if (!childExists) {
          currentNode.children.push(childId);
        }
        
        // Move to the next node in the path
        if (i < path.length - 1) {
          // Update current node to this child (create if needed)
          const childNodeId = path[i + 1];
          const originalChild = allNodes[childId];
          
          // The next node becomes current node for next iteration
          currentNode = originalChild;
        }
      }
    });
    
    result.push(newRoot);
  });
  
  return result;
};
