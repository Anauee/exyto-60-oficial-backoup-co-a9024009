import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function MultiSelectDropdown({ 
  options = [], 
  selectedValues = [], 
  onChange, 
  placeholder = "Selecione opções...",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleOption = (value) => {
    const currentValues = selectedValues || [];
    const isSelected = currentValues.includes(value);
    const newValues = isSelected 
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onChange(newValues);
  };

  const handleRemoveValue = (value, e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentValues = selectedValues || [];
    onChange(currentValues.filter(v => v !== value));
  };

  const currentSelectedValues = selectedValues || [];
  const selectedOptions = options.filter(option => currentSelectedValues.includes(option.value));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${className}`}
        >
          <div className="flex items-center gap-1 flex-wrap">
            {selectedOptions.length === 0 ? (
              <span className="text-slate-500">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, 2).map((option) => (
                  <Badge 
                    key={option.value} 
                    variant="secondary" 
                    className="text-xs flex items-center gap-1"
                  >
                    {option.label}
                    <X 
                      className="w-3 h-3 hover:bg-slate-300 rounded cursor-pointer" 
                      onClick={(e) => handleRemoveValue(option.value, e)}
                    />
                  </Badge>
                ))}
                {selectedOptions.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedOptions.length - 2} mais
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              Nenhuma opção disponível
            </div>
          ) : (
            <div className="p-2">
              {options.map((option) => {
                const isSelected = currentSelectedValues.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer rounded"
                    onClick={() => handleToggleOption(option.value)}
                  >
                    <Checkbox checked={isSelected} />
                    <span className="flex-1">{option.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-green-600" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}