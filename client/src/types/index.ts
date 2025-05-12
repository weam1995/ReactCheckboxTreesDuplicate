export interface TreeNode {
  id: string;
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  disabled: boolean;
  children?: string[];
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
