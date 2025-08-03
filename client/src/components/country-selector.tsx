import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface Country {
  name: string;
  code: string;
  flag: string;
}

interface CountrySelectorProps {
  value?: string;
  onChange: (country: Country) => void;
  placeholder?: string;
}

// قائمة البلدان الأكثر شيوعاً مع الدول العربية في المقدمة
const popularCountries: Country[] = [
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦" },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪" },
  { name: "Egypt", code: "EG", flag: "🇪🇬" },
  { name: "Jordan", code: "JO", flag: "🇯🇴" },
  { name: "Kuwait", code: "KW", flag: "🇰🇼" },
  { name: "Lebanon", code: "LB", flag: "🇱🇧" },
  { name: "Qatar", code: "QA", flag: "🇶🇦" },
  { name: "Bahrain", code: "BH", flag: "🇧🇭" },
  { name: "Oman", code: "OM", flag: "🇴🇲" },
  { name: "Iraq", code: "IQ", flag: "🇮🇶" },
  { name: "Syria", code: "SY", flag: "🇸🇾" },
  { name: "Palestine", code: "PS", flag: "🇵🇸" },
  { name: "Morocco", code: "MA", flag: "🇲🇦" },
  { name: "Algeria", code: "DZ", flag: "🇩🇿" },
  { name: "Tunisia", code: "TN", flag: "🇹🇳" },
  { name: "Libya", code: "LY", flag: "🇱🇾" },
  { name: "Sudan", code: "SD", flag: "🇸🇩" },
  { name: "Yemen", code: "YE", flag: "🇾🇪" },
  { name: "United States", code: "US", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { name: "Canada", code: "CA", flag: "🇨🇦" },
  { name: "Germany", code: "DE", flag: "🇩🇪" },
  { name: "France", code: "FR", flag: "🇫🇷" },
  { name: "India", code: "IN", flag: "🇮🇳" },
  { name: "Pakistan", code: "PK", flag: "🇵🇰" },
  { name: "Turkey", code: "TR", flag: "🇹🇷" },
  { name: "Iran", code: "IR", flag: "🇮🇷" },
  { name: "Afghanistan", code: "AF", flag: "🇦🇫" },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩" },
  { name: "Malaysia", code: "MY", flag: "🇲🇾" },
  { name: "Singapore", code: "SG", flag: "🇸🇬" },
  { name: "Thailand", code: "TH", flag: "🇹🇭" },
  { name: "Philippines", code: "PH", flag: "🇵🇭" },
  { name: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "South Korea", code: "KR", flag: "🇰🇷" },
  { name: "China", code: "CN", flag: "🇨🇳" },
  { name: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿" },
  { name: "Brazil", code: "BR", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", flag: "🇲🇽" },
  { name: "Argentina", code: "AR", flag: "🇦🇷" },
  { name: "Colombia", code: "CO", flag: "🇨🇴" },
  { name: "Chile", code: "CL", flag: "🇨🇱" },
  { name: "Peru", code: "PE", flag: "🇵🇪" },
  { name: "Venezuela", code: "VE", flag: "🇻🇪" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦" },
  { name: "Nigeria", code: "NG", flag: "🇳🇬" },
  { name: "Kenya", code: "KE", flag: "🇰🇪" },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹" },
  { name: "Ghana", code: "GH", flag: "🇬🇭" },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿" },
  { name: "Uganda", code: "UG", flag: "🇺🇬" },
  { name: "Somalia", code: "SO", flag: "🇸🇴" },
  { name: "Eritrea", code: "ER", flag: "🇪🇷" },
  { name: "Djibouti", code: "DJ", flag: "🇩🇯" },
  { name: "Comoros", code: "KM", flag: "🇰🇲" },
  { name: "Mauritania", code: "MR", flag: "🇲🇷" },
  { name: "Russia", code: "RU", flag: "🇷🇺" },
  { name: "Ukraine", code: "UA", flag: "🇺🇦" },
  { name: "Poland", code: "PL", flag: "🇵🇱" },
  { name: "Spain", code: "ES", flag: "🇪🇸" },
  { name: "Italy", code: "IT", flag: "🇮🇹" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱" },
  { name: "Belgium", code: "BE", flag: "🇧🇪" },
  { name: "Switzerland", code: "CH", flag: "🇨🇭" },
  { name: "Austria", code: "AT", flag: "🇦🇹" },
  { name: "Sweden", code: "SE", flag: "🇸🇪" },
  { name: "Norway", code: "NO", flag: "🇳🇴" },
  { name: "Denmark", code: "DK", flag: "🇩🇰" },
  { name: "Finland", code: "FI", flag: "🇫🇮" },
  { name: "Iceland", code: "IS", flag: "🇮🇸" }
];

export default function CountrySelector({ value, onChange, placeholder = "اختر بلد الإقامة" }: CountrySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(
    value ? popularCountries.find(c => c.code === value) || null : null
  );

  const filteredCountries = popularCountries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onChange(country);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="country">بلد الإقامة</Label>
      
      {/* Current Selection Display */}
      {selectedCountry && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
          <span className="text-2xl">{selectedCountry.flag}</span>
          <span className="font-medium">{selectedCountry.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCountry(null);
              onChange({ name: "", code: "", flag: "" });
            }}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            تغيير
          </Button>
        </div>
      )}

      {/* Country Selection Interface */}
      {!selectedCountry && (
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="ابحث عن بلد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Country Grid */}
          <div className="max-h-60 overflow-y-auto border rounded-lg bg-white">
            <div className="grid grid-cols-1 gap-1 p-2">
              {filteredCountries.map((country) => (
                <Button
                  key={country.code}
                  type="button"
                  variant="ghost"
                  onClick={() => handleCountrySelect(country)}
                  className="justify-start h-auto p-3 hover:bg-gray-50"
                >
                  <span className="text-xl mr-3">{country.flag}</span>
                  <span className="font-medium">{country.name}</span>
                  <span className="text-gray-500 text-sm ml-auto">{country.code}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}