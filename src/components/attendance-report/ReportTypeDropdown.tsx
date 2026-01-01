import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  hiddenOptions?: string[];
}

export default function ReportTypeDropdown({ options, value, onChange, hiddenOptions = [] }: Props) {
  const visibleOptions = options.filter(option => !hiddenOptions.includes(option));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDropdownHovered, setIsDropdownHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={() => setIsDropdownHovered(true)}
      onMouseLeave={() => {
        setIsDropdownHovered(false);
        if (!dropdownOpen) {
          setTimeout(() => {
            if (!isDropdownHovered) {
              setDropdownOpen(false);
            }
          }, 100);
        }
      }}
    >
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 bg-[#181b21] text-white hover:bg-[#1C1F26] flex items-center gap-2"
      >
        {value}
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg z-20 bg-[#181b21] bg-opacity-70 backdrop-blur-md
        transition-all duration-300 ease-in-out ${(dropdownOpen || isDropdownHovered) ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 overflow-hidden'}`}
        style={{ transitionProperty: 'opacity, max-height' }}
      >
        <div className="p-2 max-h-60 overflow-y-auto column-scroll flex flex-col gap-1">
          {visibleOptions.map((option) => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setDropdownOpen(false);
                setIsDropdownHovered(false);
              }}
              className={`flex items-center p-2 rounded cursor-pointer transition-colors duration-150 ${
                value === option
                  ? 'bg-[#3D4149]'
                  : 'hover:bg-[#2D3139]'
              }`}
            >
              <span className="text-sm text-white">{option}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
