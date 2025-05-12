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
    
    if (nonDisabledChildren.length === 0) {
      // If no enabled children, parent should match disabled children's state
      const allChildrenChecked = childNodes.length > 0 && 
        childNodes.every(child => child.checked);
      
      updatedNodes[parentId] = {
        ...parent,
        disabled: allChildrenDisabled,
        checked: allChildrenChecked,
        indeterminate: false
      };
    } else {
      // Check children that aren't disabled
      const checkedChildren = nonDisabledChildren.filter(child => child.checked);
      const indeterminateChildren = nonDisabledChildren.filter(child => child.indeterminate);
      
      // All enabled children are checked
      const allChecked = checkedChildren.length === nonDisabledChildren.length;
      
      // All enabled children are unchecked
      const allUnchecked = checkedChildren.length === 0 && indeterminateChildren.length === 0;
      
      // Some children are checked or indeterminate, but not all (partial state)
      const partialState = !allChecked && !allUnchecked;
      
      updatedNodes[parentId] = {
        ...parent,
        disabled: allChildrenDisabled,
        checked: allChecked,
        indeterminate: partialState
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
