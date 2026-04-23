import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, onClear, placeholder = 'Search medicines...' }) {
  return (
    <div className="relative">
      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
      <input
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10 pr-10"
      />
      {value && (
        <button onClick={onClear} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
