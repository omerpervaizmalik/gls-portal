"use client";

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';

interface SearchableCategorySelectProps {
  groups: Record<string, string[]>;
  name?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export default function SearchableCategorySelect({
  groups,
  name = "",
  label,
  value,
  onChange,
  required,
  placeholder = "Select or type..."
}: SearchableCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customValue, setCustomValue] = useState("");
  
  const [internalValue, setInternalValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isControlled = value !== undefined;
  const actualValue = isControlled ? value : internalValue;

  useEffect(() => {
    if (isControlled) {
      const allOptions = Object.values(groups).flat();
      if (value !== "" && !allOptions.includes(value!)) {
        setIsOtherSelected(true);
        setCustomValue(value!);
        setSearchTerm("Other");
      } else {
        setIsOtherSelected(false);
        setCustomValue("");
        setSearchTerm(value || "");
      }
    }
  }, [value, groups, isControlled]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (!isOtherSelected) {
          setSearchTerm(actualValue || "");
        } else {
          setSearchTerm("Other");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actualValue, isOtherSelected]);

  const handleSelect = (option: string) => {
    setSearchTerm(option);
    setIsOpen(false);
    setIsOtherSelected(false);
    setCustomValue("");
    
    if (onChange) {
      onChange(option);
    }
    if (!isControlled) {
      setInternalValue(option);
    }
  };

  const handleSelectOther = () => {
    setIsOtherSelected(true);
    setIsOpen(false);
    setSearchTerm("Other");
    
    if (onChange) {
      onChange("");
    }
    if (!isControlled) {
      setInternalValue("");
    }
  };

  const handleCustomValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    if (onChange) {
      onChange(val);
    }
    if (!isControlled) {
      setInternalValue(val);
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (isOtherSelected) {
      setIsOtherSelected(false);
      setCustomValue("");
      if (onChange) onChange("");
      if (!isControlled) setInternalValue("");
    }
  };

  const filteredGroups = Object.entries(groups).map(([groupName, items]) => {
    const filteredItems = items.filter(item => 
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { groupName, items: filteredItems };
  }).filter(group => group.items.length > 0);

  // Hidden input value should be either the selected standard category or the custom value
  const hiddenFormValue = isOtherSelected ? customValue : actualValue;

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      
      <input
        type="hidden"
        name={name}
        value={hiddenFormValue || ""}
      />
      
      <input
        type="text"
        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleSearchChange}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        required={required && !isOtherSelected}
      />
      
      {isOtherSelected && (
        <input
          type="text"
          className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mt-2"
          placeholder="Type your custom category..."
          value={customValue}
          onChange={handleCustomValueChange}
          required={required}
          autoFocus
        />
      )}
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filteredGroups.length > 0 ? (
            filteredGroups.map(({ groupName, items }) => (
              <div key={groupName}>
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 sticky top-0">
                  {groupName}
                </div>
                {items.map(item => (
                  <div
                    key={item}
                    className="px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 cursor-pointer transition-colors"
                    onClick={() => handleSelect(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500 italic">No matches found</div>
          )}
          
          <div 
            className="px-3 py-2 text-sm text-amber-600 font-bold hover:bg-amber-50 cursor-pointer border-t border-slate-100 bg-white"
            onClick={handleSelectOther}
          >
            Other — Type your own
          </div>
        </div>
      )}
    </div>
  );
}
