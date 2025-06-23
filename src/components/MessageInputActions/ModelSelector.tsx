import { useEffect, useState, useRef } from 'react';
import { ChevronDown, Bot, Sparkles, Zap, BrainCircuit, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

// Brand Icons
const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="currentColor"
      d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
    />
  </svg>
);

const AnthropicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="currentColor"
      d="M16.6582 8.2689L19.5 12.0749L16.6582 15.881L13.8164 12.0749L16.6582 8.2689ZM12.0001 4L14.8419 7.80603L12.0001 11.6121L9.15824 7.80603L12.0001 4ZM7.34191 8.2689L10.1837 12.0749L7.34191 15.881L4.50012 12.0749L7.34191 8.2689ZM12.0001 12.5377L14.8419 16.3437L12.0001 20.1498L9.15824 16.3437L12.0001 12.5377Z"
    />
  </svg>
);

const GeminiIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="currentColor"
      d="M12 2L2 19h20L12 2zm0 4.19L18.74 17H5.26L12 6.19zm-1 6.06V16h2v-3.75h-2z"
    />
  </svg>
);

interface ModelProvider {
  displayName: string;
}

interface ModelSelectorProps {
  className?: string;
}

// Primary models configuration
const PRIMARY_MODELS = [
  {
    key: 'gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4o Mini',
    description: 'Fast & efficient',
    plan: 'Free',
    icon: OpenAIIcon
  },
  {
    key: 'gpt-4.1',
    provider: 'openai',
    displayName: 'GPT-4.1',
    description: 'Most capable',
    plan: 'Pro',
    icon: OpenAIIcon
  },
  {
    key: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    displayName: 'Claude Sonnet',
    description: 'Balanced performance',
    plan: 'Pro',
    icon: AnthropicIcon
  },
  {
    key: 'gemini-2.5-pro',
    provider: 'google',
    displayName: 'Gemini Pro',
    description: 'Advanced reasoning',
    plan: 'Pro',
    icon: BrainCircuit
  }
];

const ModelSelector = ({ className }: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<Record<string, Record<string, ModelProvider>>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dropdownPosition, setDropdownPosition] = useState<'up' | 'down'>('down');
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const loadSelectedModel = () => {
      const savedModel = localStorage.getItem('chatModel') || 'gpt-4o-mini';
      setSelectedModel(savedModel);
    };

    loadSelectedModel();
    setLoading(false);
  }, []);

  const handleModelSelect = (model: string) => {
    // Find the selected model config
    const modelConfig = PRIMARY_MODELS.find(m => m.key === model);
    if (!modelConfig) return;

    // Store both model name and provider
    localStorage.setItem('chatModel', modelConfig.key);
    localStorage.setItem('chatModelProvider', modelConfig.provider);
    
    setSelectedModel(model);
    
    // Dispatch event with correct name and full model info
    const event = new CustomEvent('modelSelectionChanged', { 
      detail: { 
        model: modelConfig.key,
        provider: modelConfig.provider 
      } 
    });
    window.dispatchEvent(event);
    setIsOpen(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isOpen && buttonRef.current) {
      // Calculate position when opening
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 280; // Approximate dropdown height
      
      const position = spaceBelow >= dropdownHeight || spaceBelow > spaceAbove ? 'down' : 'up';
      setDropdownPosition(position);
      setDropdownCoords({
        x: rect.left,
        y: position === 'down' ? rect.bottom : rect.top,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  const selectedModelConfig = PRIMARY_MODELS.find(model => model.key === selectedModel);
  const Icon = selectedModelConfig?.icon || Bot;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        type="button"
        className={cn(
          "flex items-center h-10 px-3 rounded-xl transition-all duration-200",
          "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
          "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
          "group shadow-sm hover:shadow-md",
          className
        )}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-lg group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 transition-colors duration-200">
          <Icon size={16} />
        </div>
        <span className="ml-2 text-sm font-medium">{selectedModelConfig?.displayName || 'Select Model'}</span>
        <ChevronDown size={16} className="ml-1" />
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[99998]" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }} 
          />
          
          {/* Dropdown */}
          <div 
            className={cn(
              "fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
              "border border-gray-200/40 dark:border-gray-700/40 rounded-2xl",
              "shadow-2xl z-[99999] overflow-hidden w-64",
              dropdownPosition === 'down' ? "mt-2" : "mb-2"
            )}
            style={{
              left: dropdownCoords.x,
              top: dropdownPosition === 'down' ? dropdownCoords.y : undefined,
              bottom: dropdownPosition === 'up' ? window.innerHeight - dropdownCoords.y : undefined,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="p-2">
              {PRIMARY_MODELS.map((model) => {
                const ModelIcon = model.icon;
                return (
                  <button
                    key={model.key}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleModelSelect(model.key);
                    }}
                    className={cn(
                      "flex items-center w-full p-3 rounded-xl transition-all duration-200 group",
                      "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
                      selectedModel === model.key
                        ? "bg-gradient-to-r from-blue-100/80 to-purple-100/80 dark:from-blue-900/30 dark:to-purple-900/30 text-gray-900 dark:text-white"
                        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-white/50 dark:group-hover:bg-gray-800/50 transition-colors duration-200">
                      <ModelIcon size={18} />
                    </div>
                    <div className="ml-3 text-left">
                      <div className="text-sm font-medium">{model.displayName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {model.description}
                        {model.plan === 'Pro' && (
                          <>
                            <span className="text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Pro</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default ModelSelector; 