import React from "react";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSearchTerm } from "@/store/slices/treeSlice";
import { Search } from "lucide-react";

const SearchBox: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchTerm = useAppSelector(state => state.tree.searchTerm);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(e.target.value));
  };
  
  return (
    <div className="mb-6 relative">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-3 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <span className="absolute left-3 top-3 text-gray-400">
          <Search className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
};

export default SearchBox;
