import { useState, useEffect } from 'react';
import { Tab, TabGroup, TabList } from '@headlessui/react';
import { FaChevronUp } from 'react-icons/fa';
import { CiFilter } from "react-icons/ci";
import { motion } from 'motion/react';

export default function FL({ filters, onFilterSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetailFilters, setShowDetailFilters] = useState(false);
  const placeholders = ["anubis con flash", "Search by title..."];
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState("typing1");
  const options = [
    { label: 'Most Liked', value: 'mostLiked' },
    { label: 'Newest', value: 'newest' },
  ];

  const [searchDraft, setSearchDraft] = useState(filters.searchTerm || "");

  const mapFilters = [
    { id: 'anubis', label: 'Anubis' },
    { id: 'ancient', label: 'Ancient' },
    { id: 'mirage', label: 'Mirage' },
    { id: 'inferno', label: 'Inferno' },
    { id: 'overpass', label: 'Overpass' },
    { id: 'train', label: 'Train' },
    { id: 'nuke', label: 'Nuke' },
    { id: 'dust2', label: 'Dust II' }
  ];

  const utilityFilters = [
    { id: 'Flash', label: 'Flash' },
    { id: 'Smoke', label: 'Smoke' },
    { id: 'Grenade', label: 'Grenade' },
    { id: 'Molotov', label: 'Molotov' }
  ];

  const sideFilters = [
    { id: 'CT', label: 'CT' },
    { id: 'T', label: 'T' }
  ];

  const handleMapClick = (mapId) => {
    const newMap = filters.map === mapId ? 'all' : mapId;
    onFilterSelect({ ...filters, map: newMap });
  };

  const handleDetailFilter = (type, value) => {
    const newValue = filters[type] === value ? null : value;
    onFilterSelect({ ...filters, [type]: newValue });
  };

  const handleSearchChange = (e) => {
    setSearchDraft(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      onFilterSelect({
        ...filters,
        searchTerm: searchDraft.trim(),
      });
    }
  };

  const handleSortChange = (value) => {
    onFilterSelect({ ...filters, sortBy: value });
  };

  useEffect(() => {
    let i = 0;
    let interval;

    if (phase === "typing1") {
      i = 0;
      interval = setInterval(() => {
        setDisplayText(placeholders[0].slice(0, i + 1));
        i++;
        if (i === placeholders[0].length) {
          clearInterval(interval);
          setTimeout(() => setPhase("deleting"), 800);
        }
      }, 100);
    }

    if (phase === "deleting") {
      i = placeholders[0].length;
      interval = setInterval(() => {
        setDisplayText(placeholders[0].slice(0, i - 1));
        i--;
        if (i === 0) {
          clearInterval(interval);
          setTimeout(() => setPhase("typing2"), 300);
        }
      }, 50);
    }

    if (phase === "typing2") {
      i = 0;
      interval = setInterval(() => {
        setDisplayText(placeholders[1].slice(0, i + 1));
        i++;
        if (i === placeholders[1].length) {
          clearInterval(interval);
        }
      }, 100);
    }

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    setSearchDraft(filters.searchTerm || "");
  }, [filters.searchTerm]);

  return (
    <div className="relative pt-16 font-mono">
      <div className="flex flex-col md:flex-row justify-center items-center gap-3 mt-3">
        <div className="flex items-center">
          <div className="hidden xl:flex items-center">
            {/* TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setShowDetailFilters((p) => !p)}
              className="mr-1 h-14 w-3 rounded-l-md border-2 text-[10px] border-slate-700 bg-gray-900 text-gray-200 hover:bg-gray-800 transition-colors flex items-center justify-center shrink-0"
              title={showDetailFilters ? "Hide utility & side" : "Show utility & side"}
            >
              {showDetailFilters ? "▶" : "◀"}
            </button>

            {/* Collapsible Side + Utility */}
            <div
              className={`flex items-start overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out
                ${showDetailFilters 
                  ? "max-w-[420px] opacity-100 gap-2" 
                  : "max-w-0 opacity-0 gap-0 pointer-events-none"
                }
              `}
            >
              {/* SIDE */}
              <div className="grid grid-rows-2 gap-1 shrink-0">
                {sideFilters.map((side) => (
                  <button
                    key={side.id}
                    type="button"
                    className={`px-2 py-1 text-xs rounded-md transition-all duration-200 border-2 border-slate-700
                      ${
                        filters.side === side.id
                          ? side.id === "CT"
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-orange-500 text-white shadow-md"
                          : "bg-gray-900 text-gray-200 hover:bg-gray-800"
                      }
                    `}
                    onClick={() => handleDetailFilter("side", side.id)}
                  >
                    {side.label}
                  </button>
                ))}
              </div>

              {/* UTILITY */}
              <div className="grid grid-cols-2 gap-1 mr-2 shrink-0">
                {utilityFilters.map((util) => (
                  <button
                    key={util.id}
                    type="button"
                    className={`px-2 py-1 text-xs rounded-md transition-all duration-200 border-2 border-slate-700
                      ${
                        filters.utility === util.id
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-gray-900 text-gray-200 hover:bg-gray-800"
                      }
                    `}
                    onClick={() => handleDetailFilter("utility", util.id)}
                  >
                    {util.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MAP */}
            <div className="grid grid-rows-2 grid-flow-col gap-1 mr-2">
              {mapFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`whitespace-nowrap px-2 py-1 text-xs rounded-md transition-all duration-200 border-2 border-slate-700
                    ${
                      filters.map === filter.id
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-900 text-gray-200 hover:bg-gray-800"
                    }
                  `}
                  onClick={() => handleMapClick(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <button 
            className="xl:hidden mr-3 p-1 text-slate-200 hover:text-gray-800 transition-colors duration-200 ring-2 hover:bg-slate-200 rounded-full"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Hide filters' : 'Show filters'}
            type="button"
          >
            <CiFilter style={{position: "relative", top: 1}} size={20} strokeWidth={1}/>
          </button>
          <input
            type="text"
            value={searchDraft}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={displayText || " "}
            maxLength={60}
            className="px-3 py-2 w-64 rounded-md border-2 border-slate-700 shadow-sm focus:border-white"
          />
        </div>
        <TabGroup
          selectedIndex={options.findIndex(o => o.value === filters.sortBy)}
          onChange={(index) => handleSortChange(options[index].value)}
        >
          <TabList className="relative flex space-x-2 bg-gray-900 rounded-full border-2 border-slate-700 p-1 overflow-hidden">
            {options.map((option) => (
              <Tab key={option.value} className="relative z-10 focus:outline-none">
                {({ selected }) => (
                  <div className="relative py-0.5 px-0.5">
                    {selected && (
                      <motion.div
                        layoutId="tab-highlight"
                        className="absolute inset-0 rounded-full inset-ring-2 inset-ring-slate-300"
                        animate={{
                          backgroundColor: option.value === 'mostLiked' ? '#f97316' : '#3b82f6',
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 30,
                          backgroundColor: { duration: 0.3 },
                        }}
                      />
                    )}
                    <span
                      className={`relative z-10 rounded-xl px-3 py-1 text-sm/6 font-semibold text-white transition-colors duration-200
                        ${selected ? "text-white" : "text-gray-300 hover:text-white hover:bg-gray-200/30"}
                      `}
                    >
                      {option.label}
                    </span>
                  </div>
                )}
              </Tab>
            ))}
          </TabList>
        </TabGroup>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-20 xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Filters panel */}
      <div className={`fixed text-sm inset-x-0 xl:hidden ${isOpen ? 'top-15' : '-top-full'} z-30 transition-[top] duration-300 bg-gray-800 shadow-lg p-4 rounded-b-lg`}>
        {/* Map filters */}
        <div className="flex flex-wrap gap-2 justify-center max-h-[70vh] overflow-y-auto">
          {mapFilters.map((filter) => (
            <button
              key={filter.id}
              className={`px-2 py-1 rounded-md transition-all border-2 border-white duration-200 ${
                filters.map === filter.id
                  ? 'bg-blue-500 shadow-md'
                  : 'bg-transparent hover:bg-gray-600'
              }`}
              onClick={() => handleMapClick(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Utility filters */}
        <div className="flex flex-col md:flex-row justify-center">
          <div className="flex flex-col items-center">
            <div className="flex mt-2 flex-wrap gap-2 justify-center">
              {utilityFilters.map((util) => (
                <button
                  key={util.id}
                  className={`px-2 py-1 rounded-md transition-all border-2 border-white duration-200 ${
                    filters.utility === util.id
                      ? 'bg-blue-500 shadow-md'
                      : 'bg-transparent hover:bg-gray-600'
                  }`}
                  onClick={() => handleDetailFilter('utility', util.id)}
                >
                  {util.label}
                </button>
              ))}
            </div>
          </div>

          {/* Side filters */}
          <div className="flex flex-col items-center ml-2">
            <div className="flex mt-2 flex-wrap gap-2 justify-center">
              {sideFilters.map((side) => (
                <button
                  key={side.id}
                  className={`px-2 py-1 rounded-md border-2 border-white transition-all duration-200 ${
                    filters.side === side.id
                      ? side.id === 'CT'
                        ? 'bg-blue-500'
                        : 'bg-orange-500'
                      : 'bg-transparent hover:bg-gray-600'
                  }`}
                  onClick={() => handleDetailFilter('side', side.id)}
                >
                  {side.label}
                </button>
              ))}
            </div>
          </div>
          </div>
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-sm h-5 w-16 rounded-b-md border-2 border-white/70 bg-transparent text-white hover:bg-gray-600 transition-colors flex items-center justify-center"
            aria-label="Close filters"
            title="Close filters"
          >
            <FaChevronUp/>
          </button>
        </div>
      </div>
    </div>
  );
}