export interface TreeNode {
  id: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  children?: TreeNode[];
  path?: string[];
  parent?: string;
  level: number;
}

export interface SearchState {
  searchTerm: string;
}

export interface TreeState {
  standardAccounts: TreeNode[];
  unixAccounts: TreeNode[];
  dbsecAccounts: TreeNode[];
  allNodes: { [key: string]: TreeNode };
  selectedLeafNodes: TreeNode[];
  searchTerm: string;
}
