import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export const SRI_LANKA_CITIES = [
  { city: 'Colombo 01 - Fort', code: '00100' },
  { city: 'Colombo 02 - Slave Island', code: '00200' },
  { city: 'Colombo 03 - Kollupitiya', code: '00300' },
  { city: 'Colombo 04 - Bambalapitiya', code: '00400' },
  { city: 'Colombo 05 - Havelock Town', code: '00500' },
  { city: 'Colombo 06 - Wellawatte', code: '00600' },
  { city: 'Colombo 07 - Cinnamon Gardens', code: '00700' },
  { city: 'Dehiwala', code: '10350' },
  { city: 'Mount Lavinia', code: '10370' },
  { city: 'Moratuwa', code: '10400' },
  { city: 'Kotte / Rajagiriya', code: '10100' },
  { city: 'Battaramulla', code: '10120' },
  { city: 'Maharagama', code: '10280' },
  { city: 'Nugegoda', code: '10250' },
  { city: 'Homagama', code: '10200' },
  { city: 'Kaduwela', code: '10640' },
  { city: 'Malabe', code: '10115' },
  { city: 'Piliyandala', code: '10300' },
  { city: 'Gampaha', code: '11000' },
  { city: 'Negombo', code: '11500' },
  { city: 'Kelaniya', code: '11600' },
  { city: 'Kiribathgoda', code: '11600' },
  { city: 'Kadawatha', code: '11850' },
  { city: 'Wattala', code: '11300' },
  { city: 'Ja-Ela', code: '11350' },
  { city: 'Kalutara', code: '12000' },
  { city: 'Panadura', code: '12500' },
  { city: 'Horana', code: '12400' },
  { city: 'Kandy', code: '20000' },
  { city: 'Peradeniya', code: '20400' },
  { city: 'Katugastota', code: '20000' },
  { city: 'Matale', code: '21000' },
  { city: 'Nuwara Eliya', code: '22200' },
  { city: 'Galle', code: '80000' },
  { city: 'Hikkaduwa', code: '80240' },
  { city: 'Matara', code: '81000' },
  { city: 'Akuressa', code: '81400' },
  { city: 'Hambantota', code: '82000' },
  { city: 'Tangalle', code: '82200' },
  { city: 'Embilipitiya', code: '70200' },
  { city: 'Ratnapura', code: '70000' },
  { city: 'Balangoda', code: '70100' },
  { city: 'Kegalle', code: '71000' },
  { city: 'Mawanella', code: '71500' },
  { city: 'Kurunegala', code: '60000' },
  { city: 'Kuliyapitiya', code: '60200' },
  { city: 'Chilaw', code: '61000' },
  { city: 'Anuradhapura', code: '50000' },
  { city: 'Polonnaruwa', code: '51000' },
  { city: 'Badulla', code: '90000' },
  { city: 'Bandarawela', code: '90100' },
  { city: 'Jaffna', code: '40000' },
  { city: 'Batticaloa', code: '30000' },
  { city: 'Trincomalee', code: '31000' }
];

export default function CitySelect({ selectedCity, onCityChange, onPostalCodeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  const filtered = SRI_LANKA_CITIES.filter(c => 
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.includes(searchTerm)
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    onCityChange(item.city);
    if (onPostalCodeChange) {
      onPostalCodeChange(item.code);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white flex items-center justify-between cursor-pointer hover:border-amber-400 transition"
      >
        <span className={selectedCity ? 'text-white font-medium' : 'text-neutral-500'}>
          {selectedCity || 'Search & Select City...'}
        </span>
        <ChevronDown className="w-4 h-4 text-neutral-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-[#18181b] border border-amber-500/40 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-neutral-800 flex items-center gap-2 bg-neutral-900">
            <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <input 
              type="text" 
              autoFocus
              placeholder="Type city (e.g. Kandy, Galle)..." 
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-neutral-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-48 overflow-y-auto no-scrollbar py-1">
            {filtered.length === 0 ? (
              <div className="text-center py-4 text-xs text-neutral-500">No matching city found</div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.city}
                  onClick={() => handleSelect(item)}
                  className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-400 hover:text-black transition ${
                    selectedCity === item.city ? 'bg-amber-400/20 text-amber-300 font-semibold' : 'text-neutral-300'
                  }`}
                >
                  <span>{item.city}</span>
                  <span className="font-mono text-[10px] opacity-75">{item.code}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
