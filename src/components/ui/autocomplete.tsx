import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './input';
import { Check, Plus, MapPin, Building, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ConfirmationModal } from './confirmation-modal';
import { useToast } from '../../hooks/use-toast';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  type: 'city' | 'sector';
  cityValue?: string; // Para filtrar setores por cidade
  className?: string;
  error?: string;
  onValidationChange?: (isValid: boolean) => void; // Callback para informar se é válido
  ref?: React.Ref<any>; // Para permitir acesso externo
}

interface Suggestion {
  id: string;
  name: string;
  count?: number;
}

// Função para normalizar texto (remove acentos, converte para minúsculo, etc.)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .trim();
};

// Função para calcular similaridade entre strings (mais flexível)
const calculateSimilarity = (str1: string, str2: string): number => {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);
  
  console.log('🔍 Calculando similaridade:', {
    original1: str1,
    original2: str2,
    normalized1,
    normalized2
  });
  
  // Se são exatamente iguais após normalização
  if (normalized1 === normalized2) {
    console.log('✅ Match exato:', 1);
    return 1;
  }
  
  // Se uma contém a outra (busca parcial)
  if (normalized1.includes(normalized2)) {
    return 0.9; // Alta similaridade se contém
  }
  if (normalized2.includes(normalized1)) {
    return 0.85; // Boa similaridade se é contido
  }
  
  // Busca por palavras individuais
  const words1 = normalized1.split(' ').filter(w => w.length > 0);
  const words2 = normalized2.split(' ').filter(w => w.length > 0);
  
  let wordMatches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.includes(word2) || word2.includes(word1)) {
        wordMatches++;
        break;
      }
    }
  }
  
  if (wordMatches > 0) {
    return 0.7 + (wordMatches / Math.max(words1.length, words2.length)) * 0.2;
  }
  
  // Calcular similaridade usando algoritmo de Levenshtein
  const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
  const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  const similarity = (longer.length - distance) / longer.length;
  
  // Ajustar threshold para ser mais permissivo
  return similarity > 0.4 ? similarity : 0;
};

// Algoritmo de distância de Levenshtein
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

export interface AutocompleteRef {
  validateValue: () => Promise<{ isValid: boolean; error?: string }>;
  getValue: () => string;
}

export const Autocomplete = React.forwardRef<AutocompleteRef, AutocompleteProps>(({
  value,
  onChange,
  placeholder,
  icon,
  type,
  cityValue,
  className = '',
  error,
  onValidationChange
}, ref) => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Debug: rastrear mudanças no isLoading
  useEffect(() => {
    console.log('🔄 isLoading mudou para:', isLoading);
  }, [isLoading]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ title: '', message: '', type: 'success' });
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const debouncedSearch = useCallback(async (query: string) => {
    if (query.length < 1) { // Reduzido para 1 caractere
      setSuggestions([]);
      return;
    }

    console.log('⏳ setIsLoading(true) - Iniciando busca');
    setIsLoading(true);
    try {
      let suggestions: Suggestion[] = [];

      if (type === 'city') {
        // Buscar diretamente na tabela cities
        const { data, error } = await supabase
          .from('cities')
          .select('id, name')
          .eq('state', 'GO')
          .ilike('name', `%${query}%`)
          .limit(10);

        if (!error && data) {
          suggestions = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            count: 0
          }));
        }

      } else if (type === 'sector' && cityValue) {
        // Buscar diretamente na tabela sectors
        const { data, error } = await supabase
          .from('sectors')
          .select(`
            id, 
            name,
            cities!inner(name)
          `)
          .ilike('name', `%${query}%`)
          .ilike('cities.name', `%${cityValue}%`)
          .limit(10);

        if (!error && data) {
          suggestions = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            count: 0
          }));
        }
      }

      // Ordenar sugestões por similaridade (mais flexível)
      const sortedSuggestions = suggestions.sort((a, b) => {
        const similarityA = calculateSimilarity(query, a.name);
        const similarityB = calculateSimilarity(query, b.name);
        
        return similarityB - similarityA;
      }).filter(suggestion => {
        const similarity = calculateSimilarity(query, suggestion.name);
        // Threshold mais baixo para ser mais permissivo
        return similarity >= 0.2;
      });

      setSuggestions(sortedSuggestions);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setSuggestions([]);
    } finally {
      console.log('✅ setIsLoading(false) - Finalizando busca');
      setIsLoading(false);
    }
  }, [type, cityValue]);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      debouncedSearch(newValue);
    }, 250);

    setIsOpen(true);
    setSelectedIndex(-1);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: Suggestion) => {
    onChange(suggestion.name);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Validar se o valor atual é válido
  const isValidValue = (currentValue: string): boolean => {
    if (!currentValue.trim()) return false;
    
    // Verificar se existe uma sugestão exata ou muito similar
    const exactMatch = suggestions.find(s => 
      normalizeText(s.name) === normalizeText(currentValue)
    );
    
    if (exactMatch) return true;
    
    // Verificar se há uma sugestão muito similar (>80%)
    const similarMatch = suggestions.find(s => 
      calculateSimilarity(currentValue, s.name) > 0.8
    );
    
    return !!similarMatch;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle create new option
  const handleCreateNew = async () => {
    console.log('🚀 FUNÇÃO handleCreateNew EXECUTADA!', { 
      value: value.trim(), 
      type, 
      cityValue,
      suggestions: suggestions.length,
      isLoading 
    });
    
    if (type === 'city') {
      // Para cidade, apenas selecionar (não criar)
      onChange(value.trim());
      setIsOpen(false);
      
      toast({
        title: "Cidade selecionada",
        description: `"${value.trim()}" foi selecionada. Certifique-se de que existe no banco de dados.`,
        variant: "destructive",
      });
    } else if (type === 'sector') {
      // Para setor, apenas selecionar (será criado no final)
      onChange(value.trim());
      setIsOpen(false);
      
      toast({
        title: "Setor selecionado",
        description: `"${value.trim()}" será criado automaticamente ao finalizar o cadastro.`,
      });
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Notificar sobre mudanças na validação
  useEffect(() => {
    if (onValidationChange) {
      const isValid = isValidValue(value);
      onValidationChange(isValid);
    }
  }, [value, suggestions, onValidationChange]);

  // Função para validar valor contra o banco de dados
  const validateValueInDatabase = async (): Promise<{ isValid: boolean; error?: string }> => {
    if (!value.trim()) {
      return { isValid: false, error: `${type === 'city' ? 'Cidade' : 'Setor'} é obrigatório` };
    }

    try {
      if (type === 'city') {
        // Verificar se a cidade existe exatamente no banco
        const { data, error } = await supabase
          .from('cities')
          .select('id, name')
          .eq('state', 'GO')
          .ilike('name', value.trim())
          .single();

        if (error || !data) {
          return { 
            isValid: false, 
            error: `Cidade "${value.trim()}" não encontrada no banco de dados. Selecione uma cidade válida da lista.` 
          };
        }

        // Verificar se o nome está exatamente igual (case-insensitive)
        if (normalizeText(data.name) !== normalizeText(value.trim())) {
          return { 
            isValid: false, 
            error: `Cidade deve ser exatamente "${data.name}". Corrija o nome.` 
          };
        }

        return { isValid: true };

      } else if (type === 'sector' && cityValue) {
        // Verificar se o setor existe exatamente no banco para a cidade
        const { data, error } = await supabase
          .from('sectors')
          .select(`
            id, 
            name,
            cities!inner(name)
          `)
          .ilike('name', value.trim())
          .ilike('cities.name', cityValue)
          .single();

        if (error || !data) {
          return { 
            isValid: false, 
            error: `Setor "${value.trim()}" não encontrado em ${cityValue}. Selecione um setor válido da lista.` 
          };
        }

        // Verificar se o nome está exatamente igual (case-insensitive)
        if (normalizeText(data.name) !== normalizeText(value.trim())) {
          return { 
            isValid: false, 
            error: `Setor deve ser exatamente "${data.name}". Corrija o nome.` 
          };
        }

        return { isValid: true };
      }

      return { isValid: false, error: 'Tipo de validação não suportado' };
    } catch (error) {
      console.error('Erro na validação:', error);
      return { 
        isValid: false, 
        error: `Erro ao validar ${type === 'city' ? 'cidade' : 'setor'}. Tente novamente.` 
      };
    }
  };

  // Expor métodos via ref
  React.useImperativeHandle(ref, () => ({
    validateValue: validateValueInDatabase,
    getValue: () => value
  }));

  return (
    <div className="relative">
      <div className="relative">
        {icon}
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className={`pl-12 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-institutional-gold focus:ring-institutional-gold rounded-lg ${
            error ? 'border-red-500' : 
            value.trim() && !isValidValue(value) ? 'border-yellow-500' : ''
          } ${className}`}
          required
        />
      </div>

      {/* Suggestions dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="px-4 py-3 text-gray-400 text-sm text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
                Buscando...
              </div>
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <>
              {suggestions.map((suggestion, index) => {
                const similarity = calculateSimilarity(value, suggestion.name);
                const isExactMatch = similarity === 1;
                const isVerySimilar = similarity > 0.8;
                
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center justify-between ${
                      index === selectedIndex ? 'bg-gray-700' : ''
                    } ${isExactMatch ? 'bg-green-900/20' : isVerySimilar ? 'bg-yellow-900/20' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Check className={`w-4 h-4 ${isExactMatch ? 'text-green-400' : isVerySimilar ? 'text-yellow-400' : 'text-green-500'}`} />
                      <div className="flex flex-col">
                        <span className="font-medium">{suggestion.name}</span>
                        {isVerySimilar && !isExactMatch && (
                          <span className="text-xs text-yellow-400">
                            Muito similar ao digitado
                          </span>
                        )}
                      </div>
                    </div>
                    {suggestion.count && (
                      <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                        {suggestion.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Create new option */}
          {value.trim() && (
            <div className="border-t border-gray-700">
              {(() => {
                const hasSimilar = suggestions.some(suggestion => 
                  calculateSimilarity(value.trim(), suggestion.name) > 0.8
                );
                
                const maxSimilarity = Math.max(...suggestions.map(s => 
                  calculateSimilarity(value.trim(), s.name)
                ), 0);
                
                const canCreate = true; // Temporariamente desabilitar validação para debug
                const forceEnabled = true; // Forçar botão habilitado para debug
                
                console.log('🎨 Renderizando botão Criar:', {
                  value: value.trim(),
                  suggestions: suggestions.length,
                  maxSimilarity,
                  canCreate,
                  hasSimilar,
                  isLoading
                });
                
                return (
                  <button
                    onClick={(e) => {
                      console.log('🔥 CLIQUE DIRETO NO BOTÃO!', e);
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateNew();
                    }}
                    disabled={!forceEnabled}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center gap-3 transition-colors ${
                      hasSimilar ? 'text-yellow-400' : 
                      canCreate ? 'text-institutional-gold' : 'text-red-400'
                    } ${isLoading || !canCreate ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ 
                      pointerEvents: 'auto', 
                      cursor: 'pointer',
                      zIndex: 9999,
                      position: 'relative'
                    }}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-institutional-gold border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {isLoading ? 'Criando...' : 
                         !canCreate ? `Não é possível criar "${value.trim()}"` :
                         `Criar "${value.trim()}"`}
                      </span>
                      {hasSimilar && !isLoading && (
                        <span className="text-xs text-yellow-300">
                          ⚠️ Existem itens similares acima
                        </span>
                      )}
                      {!canCreate && !hasSimilar && !isLoading && (
                        <span className="text-xs text-red-300">
                          ❌ Muito similar aos itens existentes
                        </span>
                      )}
                      {isLoading && (
                        <span className="text-xs text-gray-400">
                          Salvando no banco de dados...
                        </span>
                      )}
                    </div>
                  </button>
                );
              })()}
            </div>
          )}

          {/* No results */}
          {!isLoading && suggestions.length === 0 && value.length >= 2 && (
            <div className="px-4 py-3 text-gray-400 text-sm text-center">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1 text-red-400 text-sm mt-1">
          <span>{error}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title={confirmationData.title}
        message={confirmationData.message}
        type={confirmationData.type}
      />
    </div>
  );
});
