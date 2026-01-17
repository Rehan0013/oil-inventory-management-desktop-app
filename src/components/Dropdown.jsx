import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Dropdown = ({ options, value, onChange, icon: Icon, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-xl outline-none hover:border-blue-500 focus:border-blue-500 transition-all min-w-[200px] justify-between ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}`}
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon size={16} className="text-gray-400" />}
                    <span className="truncate">{selectedOption ? selectedOption.label : label}</span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-full min-w-[200px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in py-1">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${value === option.value
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 font-medium'
                                : 'text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            <span>{option.label}</span>
                            {value === option.value && <Check size={14} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dropdown;
