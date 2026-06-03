"use client";

import { Search } from "lucide-react";

interface RosterSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export default function RosterSearchBar({
  value,
  onChange,
  placeholder,
  className = "mb-4",
}: RosterSearchBarProps) {
  return (
    <label className={`roster-search ${className}`}>
      <Search className="h-4 w-4 shrink-0" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="roster-search__input"
        aria-label={placeholder}
      />
    </label>
  );
}
