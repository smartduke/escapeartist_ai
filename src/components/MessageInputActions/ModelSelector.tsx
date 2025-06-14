import { useEffect, useState } from 'react';
import { ChevronDown, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelProvider {
  displayName: string;
}

interface ModelSelectorProps {
  className?: string;
}

const ModelSelector = ({ className }: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<Record<string, Record<string, ModelProvider>>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/models');
        if (!res.ok) throw new Error('Failed to fetch models');
        
        const data = await res.json();
        setProviders(data.chatModelProviders || {});
        
        // Get current selection from localStorage
        const savedProvider = localStorage.getItem('chatModelProvider');
        const savedModel = localStorage.getItem('chatModel');
        
        if (savedProvider && savedModel) {
          setSelectedProvider(savedProvider);
          setSelectedModel(savedModel);
        } else {
          // Set defaults
          const firstProvider = Object.keys(data.chatModelProviders || {})[0];
          if (firstProvider) {
            const firstModel = Object.keys(data.chatModelProviders[firstProvider] || {})[0];
            if (firstModel) {
              setSelectedProvider(firstProvider);
              setSelectedModel(firstModel);
              localStorage.setItem('chatModelProvider', firstProvider);
              localStorage.setItem('chatModel', firstModel);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleModelSelect = (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
    localStorage.setItem('chatModelProvider', provider);
    localStorage.setItem('chatModel', model);
    setIsOpen(false);
  };

  const getProviderDisplayName = (provider: string) => {
    const providerNames: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      groq: 'Groq',
      ollama: 'Ollama',
      gemini: 'Google',
      deepseek: 'Deepseek',
      lmstudio: 'LM Studio',
      custom_openai: 'Custom OpenAI',
    };
    return providerNames[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  const getModelDisplayName = (model: string) => {
    // Find the model in providers to get display name
    for (const providerModels of Object.values(providers)) {
      if (providerModels[model]) {
        return providerModels[model].displayName;
      }
    }
    return model;
  };

  if (loading) {
    return (
      <div className={cn("flex items-center space-x-2 px-3 py-2 text-xs text-black/70 dark:text-white/70", className)}>
        <Bot size={14} />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 text-xs border rounded-lg transition-all duration-200 min-w-[120px]",
          isOpen 
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
            : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
        )}
      >
        <Bot size={14} />
        <span className="flex-1 truncate text-left">
          {getModelDisplayName(selectedModel) || 'Select Model'}
        </span>
        <ChevronDown size={12} className={cn("transition-transform duration-200 flex-shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[60] max-h-80 overflow-y-auto">
          {Object.keys(providers).length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No models available. Please configure API keys in settings.
            </div>
          ) : (
            Object.entries(providers).map(([provider, models]) => (
              <div key={provider} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                  {getProviderDisplayName(provider)} ({Object.keys(models).length} models)
                </div>
                <div className="p-2">
                                      {Object.entries(models).map(([modelKey, model]) => (
                      <button
                        key={modelKey}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleModelSelect(provider, modelKey);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors mb-1",
                          selectedProvider === provider && selectedModel === modelKey
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        )}
                      >
                      <div className="truncate">{model.displayName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {modelKey}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[50]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ModelSelector; 