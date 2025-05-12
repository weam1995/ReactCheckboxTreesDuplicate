import React from "react";
import StandardAccounts from "@/components/checkbox-trees/StandardAccounts";
import UnixAccounts from "@/components/checkbox-trees/UnixAccounts";
import DbsecAccounts from "@/components/checkbox-trees/DbsecAccounts";
import SearchBox from "@/components/SearchBox";
import SelectedNodesDisplay from "@/components/SelectedNodesDisplay";

const BaseSSoComponent: React.FC = () => {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-medium mb-6">SSO Account Management</h1>
      
      {/* Search Box */}
      <SearchBox />
      
      {/* Selected Nodes Display */}
      <SelectedNodesDisplay />
      
      {/* Tree Container */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200">
        {/* Standard Accounts Tree */}
        <StandardAccounts />
        
        {/* Unix Accounts Tree */}
        <UnixAccounts />
        
        {/* Database Security Accounts Tree */}
        <DbsecAccounts />
      </div>
    </div>
  );
};

export default BaseSSoComponent;
