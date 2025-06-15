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
      <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl", className)}>
        <Bot size={16} className="text-gray-600 dark:text-gray-400 animate-pulse" />
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
        className="group relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-200"
        title={getModelDisplayName(selectedModel) || 'Select Model'}
      >
        <div className={cn(
          "transition-colors",
          isOpen 
            ? "text-purple-600 dark:text-purple-400"
            : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100"
        )}>
          <Bot size={16} className="stroke-[1.5]" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-white/5 z-[60] max-h-80 overflow-hidden">
          {Object.keys(providers).length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400 font-medium">
              No models available. Please configure API keys in settings.
            </div>
          ) : (
            <div className="overflow-y-auto max-h-80">
              {Object.entries(providers).map(([provider, models]) => (
                <div key={provider} className="border-b border-gray-100/60 dark:border-gray-700/60 last:border-b-0">
                  <div className="sticky top-0 bg-gradient-to-r from-gray-50/90 to-gray-100/90 dark:from-gray-700/90 dark:to-gray-800/90 backdrop-blur-sm px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200/40 dark:border-gray-600/40">
                    {getProviderDisplayName(provider)} <span className="text-gray-500 dark:text-gray-400 font-medium">({Object.keys(models).length})</span>
                  </div>
                  <div className="p-3 space-y-1">
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
                          "w-full text-left px-4 py-3 text-sm rounded-xl transition-all duration-200 group",
                          selectedProvider === provider && selectedModel === modelKey
                            ? "bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200/60 dark:border-purple-700/60 text-purple-700 dark:text-purple-300 shadow-sm"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/50 dark:hover:to-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                        )}
                      >
                        <div className="font-semibold truncate">{model.displayName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 font-medium">
                          {modelKey}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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