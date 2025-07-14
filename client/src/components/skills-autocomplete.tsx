import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Tag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Skill {
  id: string;
  nome: string;
  codigoExterno?: string;
  categoria?: string;
}

interface SkillsAutocompleteProps {
  selectedSkills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  placeholder?: string;
  maxSkills?: number;
  className?: string;
}

export default function SkillsAutocomplete({
  selectedSkills,
  onSkillsChange,
  placeholder = "Buscar competências...",
  maxSkills = 10,
  className = ""
}: SkillsAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Buscar skills com debounce
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/skills", "search", searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) return [];
      const params = new URLSearchParams();
      params.append("search", searchTerm);
      params.append("limit", "20");
      const res = await apiRequest("GET", `/api/skills?${params}`);
      const skills = await res.json();
      // Filtrar skills já selecionadas
      return skills.filter((skill: Skill) => 
        !selectedSkills.some(selected => selected.id === skill.id)
      );
    },
    enabled: searchTerm.length >= 2,
    refetchOnWindowFocus: false,
  });

  // Gerenciar foco e navegação
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
            handleSelectSkill(suggestions[highlightedIndex]);
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
  }, [isOpen, suggestions, highlightedIndex]);

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectSkill = (skill: Skill) => {
    if (selectedSkills.length >= maxSkills) return;
    onSkillsChange([...selectedSkills, skill]);
    setSearchTerm("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemoveSkill = (skillId: string) => {
    onSkillsChange(selectedSkills.filter(skill => skill.id !== skillId));
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (searchTerm.length < 2) setIsOpen(false);
  }, [searchTerm]);

  return (
    <div className={`relative ${className}`}>
      {/* Input e Skills selecionadas */}
      <div className="min-h-[40px] border rounded-md p-2 flex flex-wrap gap-1 items-center">
        {/* Skills selecionadas */}
        {selectedSkills.map((skill) => (
          <Badge key={skill.id} variant="secondary" className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {skill.nome}
            <button
              type="button"
              onClick={() => handleRemoveSkill(skill.id)}
              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        {/* Input de busca */}
        <div className="flex-1 min-w-[200px]">
          <Input
            ref={inputRef}
            type="text"
            placeholder={selectedSkills.length === 0 ? placeholder : ""}
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            className="border-0 p-0 h-auto focus:ring-0 focus:outline-none"
            disabled={selectedSkills.length >= maxSkills}
          />
        </div>
      </div>

      {/* Dropdown de sugestões */}
      {isOpen && (searchTerm.length >= 2 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Buscando competências...
            </div>
          ) : suggestions.length === 0 && searchTerm.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-4 h-4 mx-auto mb-2" />
              Nenhuma competência encontrada
            </div>
          ) : (
            <div className="py-1">
              {suggestions.map((skill: Skill, index: number) => (
                <button
                  key={skill.id}
                  type="button"
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between gap-2 ${
                    index === highlightedIndex ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleSelectSkill(skill)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{skill.nome}</span>
                    {skill.categoria && (
                      <Badge variant="outline" className="text-xs">
                        {skill.categoria}
                      </Badge>
                    )}
                  </div>
                  {skill.codigoExterno && (
                    <span className="text-xs text-gray-500">{skill.codigoExterno}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contador de skills */}
      {maxSkills && (
        <div className="text-xs text-gray-500 mt-1">
          {selectedSkills.length} de {maxSkills} competências selecionadas
        </div>
      )}
    </div>
  );
} 