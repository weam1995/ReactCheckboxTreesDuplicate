import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TreeState, TreeNode } from "@/types";
import { 
  updateNodeAndChildren, 
  updateParents, 
  getCheckedLeafNodes 
} from "@/utils/treeUtils";

// Initial state for Standard Accounts tree
const standardAccountsInitial: TreeNode[] = [
  {
    id: "finance",
    label: "Finance",
    checked: false,
    disabled: false,
    level: 1,
    children: ["finance-read", "finance-edit"]
  },
  {
    id: "hr",
    label: "Human Resources",
    checked: true,
    disabled: false,
    level: 1,
    children: ["hr-view", "hr-edit"]
  }
];

// Initial state for Unix Accounts tree
const unixAccountsInitial: TreeNode[] = [
  {
    id: "linux-servers",
    label: "Linux Servers",
    checked: true,
    disabled: false,
    level: 1,
    children: ["linux-admin", "linux-user"]
  },
  {
    id: "aix-servers",
    label: "AIX Servers",
    checked: false,
    disabled: false,
    level: 1,
    children: ["aix-readonly"]
  }
];

// Initial state for Database Security Accounts tree
const dbsecAccountsInitial: TreeNode[] = [
  {
    id: "sql-db",
    label: "SQL Databases",
    checked: false,
    disabled: false,
    level: 1,
    children: ["sql-query", "sql-admin"]
  },
  {
    id: "nosql-db",
    label: "NoSQL Databases",
    checked: false,
    disabled: false,
    level: 1,
    children: ["nosql-readonly"]
  }
];

// Create a flat map of all nodes for easier reference
const createAllNodesMap = (trees: TreeNode[][]) => {
  const allNodes: { [key: string]: TreeNode } = {};
  
  // Add all nodes to the map
  const addNodesToMap = (nodes: TreeNode[], parentId?: string) => {
    for (const node of nodes) {
      const nodeWithParent = {
        ...node,
        parent: parentId
      };
      
      allNodes[node.id] = nodeWithParent;
      
      // Recursively add children
      if (node.children) {
        const childNodes: TreeNode[] = node.children.map(childId => {
          const childObj: TreeNode = {
            id: childId,
            label: "",  // Will be set below
            checked: false,
            disabled: false,
            level: node.level + 1,
            parent: node.id
          };
          return childObj;
        });
        
        addNodesToMap(childNodes, node.id);
      }
    }
  };
  
  trees.forEach(tree => addNodesToMap(tree));
  
  // Finance subtree
  allNodes["finance-read"] = {
    id: "finance-read",
    label: "Read Access",
    checked: false,
    disabled: false,
    level: 2,
    parent: "finance",
    children: ["finance-read-reports", "finance-read-budgets"]
  };
  
  allNodes["finance-read-reports"] = {
    id: "finance-read-reports",
    label: "Financial Reports",
    checked: false,
    disabled: false,
    level: 3,
    parent: "finance-read"
  };
  
  allNodes["finance-read-budgets"] = {
    id: "finance-read-budgets",
    label: "Department Budgets",
    checked: false,
    disabled: false,
    level: 3,
    parent: "finance-read"
  };
  
  allNodes["finance-edit"] = {
    id: "finance-edit",
    label: "Edit Access",
    checked: false,
    disabled: false,
    level: 2,
    parent: "finance",
    children: ["finance-edit-payroll", "finance-edit-invoices"]
  };
  
  allNodes["finance-edit-payroll"] = {
    id: "finance-edit-payroll",
    label: "Payroll",
    checked: false,
    disabled: true,
    level: 3,
    parent: "finance-edit"
  };
  
  allNodes["finance-edit-invoices"] = {
    id: "finance-edit-invoices",
    label: "Invoices",
    checked: false,
    disabled: false,
    level: 3,
    parent: "finance-edit"
  };
  
  // HR subtree
  allNodes["hr-view"] = {
    id: "hr-view",
    label: "View Access",
    checked: false,
    disabled: false,
    level: 2,
    parent: "hr",
    children: ["hr-view-profiles"]
  };
  
  allNodes["hr-view-profiles"] = {
    id: "hr-view-profiles",
    label: "Employee Profiles",
    checked: false,
    disabled: false,
    level: 3,
    parent: "hr-view"
  };
  
  allNodes["hr-edit"] = {
    id: "hr-edit",
    label: "Edit Access",
    checked: true,
    disabled: false,
    level: 2,
    parent: "hr",
    children: ["hr-edit-onboarding"]
  };
  
  allNodes["hr-edit-onboarding"] = {
    id: "hr-edit-onboarding",
    label: "Onboarding",
    checked: true,
    disabled: false,
    level: 3,
    parent: "hr-edit"
  };
  
  // Linux servers subtree
  allNodes["linux-admin"] = {
    id: "linux-admin",
    label: "Administrator",
    checked: true,
    disabled: false,
    level: 2,
    parent: "linux-servers",
    children: ["linux-admin-prod", "linux-admin-dev"]
  };
  
  allNodes["linux-admin-prod"] = {
    id: "linux-admin-prod",
    label: "Production Servers",
    checked: true,
    disabled: false,
    level: 3,
    parent: "linux-admin"
  };
  
  allNodes["linux-admin-dev"] = {
    id: "linux-admin-dev",
    label: "Development Servers",
    checked: false,
    disabled: true,
    level: 3,
    parent: "linux-admin"
  };
  
  allNodes["linux-user"] = {
    id: "linux-user",
    label: "Standard User",
    checked: false,
    disabled: false,
    level: 2,
    parent: "linux-servers",
    children: ["linux-user-all"]
  };
  
  allNodes["linux-user-all"] = {
    id: "linux-user-all",
    label: "All Servers",
    checked: false,
    disabled: false,
    level: 3,
    parent: "linux-user"
  };
  
  // AIX servers subtree
  allNodes["aix-readonly"] = {
    id: "aix-readonly",
    label: "Read-Only",
    checked: false,
    disabled: true,
    level: 2,
    parent: "aix-servers",
    children: ["aix-readonly-prod"]
  };
  
  allNodes["aix-readonly-prod"] = {
    id: "aix-readonly-prod",
    label: "Production",
    checked: false,
    disabled: true,
    level: 3,
    parent: "aix-readonly"
  };
  
  // SQL DB subtree
  allNodes["sql-query"] = {
    id: "sql-query",
    label: "Query Access",
    checked: false,
    disabled: false,
    level: 2,
    parent: "sql-db",
    children: ["sql-query-customer", "sql-query-product"]
  };
  
  allNodes["sql-query-customer"] = {
    id: "sql-query-customer",
    label: "Customer Database",
    checked: false,
    disabled: false,
    level: 3,
    parent: "sql-query"
  };
  
  allNodes["sql-query-product"] = {
    id: "sql-query-product",
    label: "Product Database",
    checked: false,
    disabled: false,
    level: 3,
    parent: "sql-query"
  };
  
  allNodes["sql-admin"] = {
    id: "sql-admin",
    label: "Admin Access",
    checked: false,
    disabled: false,
    level: 2,
    parent: "sql-db",
    children: ["sql-admin-test", "sql-admin-prod"]
  };
  
  allNodes["sql-admin-test"] = {
    id: "sql-admin-test",
    label: "Test Database",
    checked: false,
    disabled: false,
    level: 3,
    parent: "sql-admin"
  };
  
  allNodes["sql-admin-prod"] = {
    id: "sql-admin-prod",
    label: "Production Database",
    checked: false,
    disabled: true,
    level: 3,
    parent: "sql-admin"
  };
  
  // NoSQL DB subtree
  allNodes["nosql-readonly"] = {
    id: "nosql-readonly",
    label: "Read-Only",
    checked: false,
    disabled: false,
    level: 2,
    parent: "nosql-db",
    children: ["nosql-readonly-analytics"]
  };
  
  allNodes["nosql-readonly-analytics"] = {
    id: "nosql-readonly-analytics",
    label: "Analytics Store",
    checked: false,
    disabled: false,
    level: 3,
    parent: "nosql-readonly"
  };
  
  return allNodes;
};

const allNodes = createAllNodesMap([
  standardAccountsInitial,
  unixAccountsInitial,
  dbsecAccountsInitial
]);

// Update parent node states based on child states
Object.keys(allNodes).forEach(nodeId => {
  const updatedNodes = updateParents(nodeId, allNodes);
  Object.assign(allNodes, updatedNodes);
});

const initialState: TreeState = {
  standardAccounts: standardAccountsInitial,
  unixAccounts: unixAccountsInitial,
  dbsecAccounts: dbsecAccountsInitial,
  allNodes,
  selectedLeafNodes: getCheckedLeafNodes([
    ...standardAccountsInitial,
    ...unixAccountsInitial,
    ...dbsecAccountsInitial
  ], allNodes),
  searchTerm: ""
};

const treeSlice = createSlice({
  name: "tree",
  initialState,
  reducers: {
    toggleNode: (state, action: PayloadAction<{ nodeId: string; checked: boolean }>) => {
      const { nodeId, checked } = action.payload;
      const node = state.allNodes[nodeId];
      
      if (!node || node.disabled) return;
      
      // Update the node and its children
      const updatedNodes = updateNodeAndChildren(node, checked, state.allNodes);
      Object.assign(state.allNodes, updatedNodes);
      
      // Update parent states
      const updatedParentNodes = updateParents(nodeId, state.allNodes);
      Object.assign(state.allNodes, updatedParentNodes);
      
      // Update selected leaf nodes
      state.selectedLeafNodes = getCheckedLeafNodes([
        ...state.standardAccounts,
        ...state.unixAccounts,
        ...state.dbsecAccounts
      ], state.allNodes);
    },
    
    removeSelectedNode: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      const node = state.allNodes[nodeId];
      
      if (!node || node.disabled) return;
      
      // Uncheck the node
      state.allNodes[nodeId].checked = false;
      
      // Update parent states
      const updatedParentNodes = updateParents(nodeId, state.allNodes);
      Object.assign(state.allNodes, updatedParentNodes);
      
      // Update selected leaf nodes
      state.selectedLeafNodes = getCheckedLeafNodes([
        ...state.standardAccounts,
        ...state.unixAccounts,
        ...state.dbsecAccounts
      ], state.allNodes);
    },
    
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    }
  }
});

export const { toggleNode, removeSelectedNode, setSearchTerm } = treeSlice.actions;
export default treeSlice.reducer;
