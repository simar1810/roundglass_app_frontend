import useClickOutside from '@/hooks/useClickOutside';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

const alignClasses = {
  top: "bottom-[120%]",
  bottom: "bottom-[100%]"
}

export default function SelectMultiple({
  label,
  options,
  value,
  onChange,
  className = '',
  selectAll = false,
  align = "top",
  searchable = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef();

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
    setSearchQuery('');
  })

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }
    const query = searchQuery.toLowerCase().trim();
    return options.filter(option => 
      option.name?.toLowerCase().includes(query)
    );
  }, [options, searchQuery, searchable]);

  function toggleOption(selectedValue) {
    const newValue = value.includes(selectedValue)
      ? value.filter((v) => v !== selectedValue)
      : [...value, selectedValue];
    onChange(newValue);
  };

  function toggleSelectAll() {
    if (value.length === filteredOptions.length && filteredOptions.every(opt => value.includes(opt.value))) {
      // Deselect all filtered options
      onChange(value.filter(v => !filteredOptions.some(opt => opt.value === v)))
    } else {
      // Select all filtered options (merge with existing selections)
      const newSelections = filteredOptions
        .filter(opt => !value.includes(opt.value))
        .map(option => option.value);
      onChange([...value, ...newSelections])
    }
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="flex items-center justify-between">
        {/* <span className="label font-[600] block mb-1">{label || <>Select</>}</span> */}
      </div>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-[#D6D6D6] rounded-[8px] bg-white cursor-pointer flex justify-between items-center"
      >
        <span className="w-full text-sm text-gray-700 truncate overflow-clip">
          {label
            ? label
            : value.length ? value.slice(0, 4).join(', ') : 'Select options'}
        </span>
        <span className="text-sm text-nowrap">{value.length} selected</span>
        {/* <ChevronDown className="w-4 h-4 text-gray-500" /> */}
        {isOpen ? <X
          className="hover:text-[var(--accent-2)] w-[20px] h-[20px] ml-2 opacity-50 hover:opacity-100 hover:scale-[1.1]"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          strokeWidth={3}
        /> : <div className='w-[30px] h-[20px]' />}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-10 mt-1 w-full bg-white border border-[#D6D6D6] rounded-[8px] shadow-lg max-h-60 flex flex-col",
            alignClasses[align]
          )}
        >
          {searchable && (
            <div className="sticky top-0 bg-white border-b border-[#D6D6D6] p-2 z-10">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSearchQuery(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Search..."
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-1)] focus:border-transparent"
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto max-h-[200px]">
            {selectAll && filteredOptions.length > 0 && (
              <label
                className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-100"
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filteredOptions.every(opt => value.includes(opt.value))}
                  onChange={toggleSelectAll}
                />
                Select All {searchable && searchQuery && `(${filteredOptions.length})`}
              </label>
            )}
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={value.includes(option.value)}
                    onChange={() => toggleOption(option.value)}
                  />
                  {option.name}
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
