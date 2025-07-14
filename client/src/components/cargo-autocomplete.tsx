import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Tag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CargoAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface CargoOption {
  id: string;
  nome: string;
  codigoExterno?: string;
}

export default function CargoAutocomplete({
  value,
  onChange,
  placeholder = "Digite ou selecione o cargo...",
  className = ""
}: CargoAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Buscar cargos do CBO
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/skills", "cargo", searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) return [];
      const params = new URLSearchParams();
      params.append("search", searchTerm);
      params.append("limit", "20");
      const res = await apiRequest("GET", `/api/skills?${params}`);
      return await res.json();
    },
    enabled: searchTerm.length >= 2,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (searchTerm.length < 2) setIsOpen(false);
  }, [searchTerm]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navegação com teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            handleSelectCargo(suggestions[highlightedIndex].nome);
          } else if (searchTerm.trim()) {
            handleSelectCargo(searchTerm.trim());
          }
          break;
        case "Escape":
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, suggestions, highlightedIndex, searchTerm]);

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setIsOpen(true);
    setHighlightedIndex(-1);
    onChange(value); // Atualiza o valor do campo
  };

  const handleSelectCargo = (cargo: string) => {
    onChange(cargo);
    setSearchTerm(cargo);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={searchTerm || value}
        onChange={e => handleInputChange(e.target.value)}
        onFocus={handleInputFocus}
        className="pr-10"
      />
      {/* Dropdown de sugestões */}
      {isOpen && (searchTerm.length >= 2 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Buscando cargos...
            </div>
          ) : suggestions.length === 0 && searchTerm.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-4 h-4 mx-auto mb-2" />
              Nenhum cargo encontrado
            </div>
          ) : (
            <div className="py-1">
              {suggestions.map((cargo: CargoOption, index: number) => (
                <button
                  key={cargo.id}
                  type="button"
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                    index === highlightedIndex ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleSelectCargo(cargo.nome)}
                >
                  <Tag className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{cargo.nome}</span>
                  {cargo.codigoExterno && (
                    <span className="text-xs text-gray-500 ml-2">{cargo.codigoExterno}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 