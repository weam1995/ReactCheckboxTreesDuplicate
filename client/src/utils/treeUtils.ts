import { TreeNode } from "@/types";

/**
 * Updates the checked state of a node and its children
 * - When a node is checked/unchecked, all its non-disabled children inherit that state
 * - When a node is checked/unchecked, its indeterminate state is cleared
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
        checked,
        indeterminate: false // Always clear indeterminate state when explicitly checked/unchecked
      };
      
      // Only cascade to children if the parent is not disabled
      if (currentNode.children) {
        for (const childId of currentNode.children) {
          const child = allNodes[childId];
          if (child) {
            queue.push(child);
          }
        }
      }
    }
  }
  
  return updatedNodes;
};

/**
 * Updates the parent nodes based on the state of their children
 * - A parent is checked if all non-disabled children are checked
 * - A parent is indeterminate if some but not all non-disabled children are checked
 * - A parent is unchecked if all non-disabled children are unchecked
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
    
    // Parent is disabled only if all children are disabled
    const allChildrenDisabled = childNodes.length > 0 && 
      childNodes.every(child => child.disabled);
    
    // Only consider non-disabled children for checking status
    const nonDisabledChildren = childNodes.filter(child => !child.disabled);
    
    if (nonDisabledChildren.length === 0) {
      // If all children are disabled, parent is disabled and status follows children
      const allDisabledChildrenChecked = childNodes.length > 0 && 
        childNodes.every(child => child.checked);
      
      updatedNodes[parentId] = {
        ...parent,
        disabled: allChildrenDisabled,
        checked: allDisabledChildrenChecked,
        indeterminate: false
      };
    } else {
      // For active children, calculate check states:
      
      // Count checked active children
      const checkedNonDisabledChildren = nonDisabledChildren.filter(child => child.checked);
      
      // Count indeterminate active children 
      const indeterminateNonDisabledChildren = nonDisabledChildren.filter(
        child => child.indeterminate
      );
      
      // Parent is checked only if ALL non-disabled children are checked
      const allNonDisabledChildrenChecked = checkedNonDisabledChildren.length === nonDisabledChildren.length;
      
      // Parent is unchecked only if ALL non-disabled children are unchecked and non-indeterminate
      const allNonDisabledChildrenUnchecked = 
        checkedNonDisabledChildren.length === 0 && 
        indeterminateNonDisabledChildren.length === 0;
      
      // Parent is indeterminate if:
      // 1. Some but not all non-disabled children are checked, OR
      // 2. Any non-disabled child is indeterminate
      const someButNotAllChecked = !allNonDisabledChildrenChecked && !allNonDisabledChildrenUnchecked;
      const anyIndeterminate = indeterminateNonDisabledChildren.length > 0;
      const isIndeterminate = someButNotAllChecked || anyIndeterminate;
      
      updatedNodes[parentId] = {
        ...parent,
        disabled: allChildrenDisabled,
        checked: allNonDisabledChildrenChecked,
        indeterminate: isIndeterminate
      };
    }
    
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
 * Filter tree based on search term - only show exact matches and their parent paths
 */
export const filterTree = (
  nodes: TreeNode[],
  allNodes: { [key: string]: TreeNode },
  searchTerm: string
): TreeNode[] => {
  if (!searchTerm) return nodes;
  
  // Convert search term to lowercase for case-insensitive matching
  const searchTermLower = searchTerm.toLowerCase();
  
  // Step 1: Find nodes that exactly match the search term
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
  
  // Step 2: Create paths from matching nodes to their roots
  const nodePaths: Record<string, string[]> = {};
  
  // Build path from each matching node to its root
  matchingNodeIds.forEach(nodeId => {
    const path: string[] = [];
    let currentId = nodeId;
    
    // Add the current node and walk up to root
    while (currentId) {
      path.unshift(currentId);
      
      // If we reached the root, stop
      if (!allNodes[currentId].parent) {
        break;
      }
      
      // Move to parent
      currentId = allNodes[currentId].parent!;
    }
    
    // Store the path for this node
    nodePaths[nodeId] = path;
  });
  
  // Step 3: Create filtered tree structure with only match paths
  const result: TreeNode[] = [];
  
  // Process each root node
  nodes.forEach(rootNode => {
    // Check if this root is in any paths
    const matchPathsFromThisRoot = matchingNodeIds.filter(
      nodeId => nodePaths[nodeId][0] === rootNode.id
    );
    
    if (matchPathsFromThisRoot.length === 0) {
      return; // Skip roots with no matches
    }
    
    // Create a filtered copy of this root
    const filteredRoot: TreeNode = {
      ...rootNode,
      children: []
    };
    
    // Add this root to the result
    result.push(filteredRoot);
    
    // For each match through this root, build the exact path
    matchPathsFromThisRoot.forEach(matchId => {
      const path = nodePaths[matchId];
      
      // Skip the root (index 0) and build the path
      let currentNode = filteredRoot;
      
      for (let i = 1; i < path.length; i++) {
        const childId = path[i];
        const originalChild = allNodes[childId];
        
        // Check if this node is already in the parent's children
        if (!currentNode.children!.includes(childId)) {
          currentNode.children!.push(childId);
        }
        
        // If we're not at the last node in path, prepare for next iteration
        if (i < path.length - 1) {
          // Find the next node in allNodes
          const nextNode = allNodes[path[i]];
          
          // Make sure this child node has a children array if needed
          if (!nextNode.children) {
            const updatedNode = {
              ...nextNode,
              children: []
            };
            allNodes[path[i]] = updatedNode;
          }
          
          // Move to the next node in the path
          currentNode = allNodes[path[i]];
        }
      }
    });
  });
  
  return result;
};
