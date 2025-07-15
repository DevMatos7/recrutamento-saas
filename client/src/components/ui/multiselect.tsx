import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ options, values, onChange, placeholder }) => {
  const safeValues = Array.isArray(values) ? values : [];
  const handleToggle = (value: string) => {
    if (safeValues.includes(value)) {
      onChange(safeValues.filter(v => v !== value));
    } else {
      onChange([...safeValues, value]);
    }
  };

  return (
    <div className="border rounded px-2 py-1 bg-white dark:bg-gray-900">
      <div className="flex flex-wrap gap-2 mb-1">
        {safeValues.length === 0 && (
          <span className="text-gray-400 text-sm">{placeholder || 'Selecione...'}</span>
        )}
        {safeValues.map(val => {
          const opt = options.find(o => o.value === val);
          return (
            <span key={val} className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs">
              {opt ? opt.label : val}
            </span>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <label key={opt.value} className="flex items-center gap-1 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={safeValues.includes(opt.value)}
              onChange={() => handleToggle(opt.value)}
              className="accent-blue-600"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}; 