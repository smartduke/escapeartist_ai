import React, { useEffect, useState, useRef } from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

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

const BestIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="currentColor"
      d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-1 14v-2h2v2h-2zm1-4c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1 8h2v2h-2z"
    />
    <circle cx="12" cy="9" r="2" fill="currentColor" />
    <path
      fill="currentColor"
      d="M7.5 9.5m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0M16.5 9.5m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0"
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
    displayName: 'Best',
    description: 'Optimized for quick, accurate responses',
    plan: 'Free',
    icon: Bot
  },
  {
    key: 'gpt-4.1',
    provider: 'openai',
    displayName: 'GPT-4.1',
    description: 'Advanced analysis & complex tasks',
    plan: 'Pro',
    icon: OpenAIIcon
  },
  {
    key: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    displayName: 'Claude 4 Sonnet',
    description: 'Expert in research & reasoning',
    plan: 'Pro',
    icon: AnthropicIcon
  }
];

const ModelSelector = ({ className }: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [dropdownPosition, setDropdownPosition] = useState<'up' | 'down'>('down');
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0, width: 0 });
  const [subscription, setSubscription] = useState<{ plan: string } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const loadSelectedModel = () => {
      const savedModel = localStorage.getItem('chatModel') || 'gpt-4o-mini';
      // Validate that the saved model exists in our configuration
      if (PRIMARY_MODELS.some(model => model.key === savedModel)) {
        setSelectedModel(savedModel);
      } else {
        // If saved model is invalid, reset to default
        setSelectedModel('gpt-4o-mini');
        localStorage.setItem('chatModel', 'gpt-4o-mini');
      }
    };

    loadSelectedModel();
  }, []);

  // Fetch subscription status when user changes
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null);
        return;
      }

      try {
        const response = await fetch('/api/subscriptions', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };

    fetchSubscription();
  }, [user]);

  const handleModelSelect = async (model: string) => {
    // Find the selected model config
    const modelConfig = PRIMARY_MODELS.find(m => m.key === model);
    if (!modelConfig) return;

    // Check if model requires pro plan
    if (modelConfig.plan === 'Pro') {
      if (!user) {
        router.push('/pricing');
        setIsOpen(false);
        return;
      }

      const isPro = subscription?.plan && subscription.plan !== 'free';
      if (!isPro) {
        router.push('/pricing');
        setIsOpen(false);
        return;
      }
    }

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

  // Get the selected model configuration
  const selectedModelConfig = PRIMARY_MODELS.find(model => model.key === selectedModel) || PRIMARY_MODELS[0];
  const Icon = selectedModelConfig.icon;
  const isBasicModel = selectedModel === 'gpt-4o-mini';

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={false}
        type="button"
        className={cn(
          "transition-colors duration-200 whitespace-nowrap",
          selectedModel === 'gpt-4o-mini'
            ? "p-2 rounded-full"
            : "flex items-center gap-2 px-2.5 py-2 rounded-xl",
          isOpen
            ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
            : 'text-black/70 dark:text-white/70 hover:bg-light-secondary dark:hover:bg-dark-secondary hover:text-black dark:hover:text-white'
        )}
        title={selectedModelConfig.displayName}
      >
        {React.createElement(selectedModelConfig.icon, { size: 18 })}
        {selectedModel !== 'gpt-4o-mini' && (
          <span className="text-sm font-medium truncate">{selectedModelConfig.displayName}</span>
        )}
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[99998]" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div 
            className={cn(
              "fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
              "border border-gray-200/40 dark:border-gray-700/40 rounded-2xl",
              "shadow-2xl z-[99999] overflow-hidden w-72",
              dropdownPosition === 'down' ? "mt-2" : "mb-2"
            )}
            style={{
              left: dropdownCoords.x,
              top: dropdownPosition === 'down' ? dropdownCoords.y : undefined,
              bottom: dropdownPosition === 'up' ? window.innerHeight - dropdownCoords.y : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-1.5">
              {PRIMARY_MODELS.map((model) => {
                const ModelIcon = model.icon;
                const isPro = model.plan === 'Pro';
                const isSelected = selectedModel === model.key;
                return (
                  <button
                    key={model.key}
                    onClick={() => handleModelSelect(model.key)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-2.5 py-2 rounded-xl transition-all duration-200",
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <div className="flex-shrink-0">
                      <ModelIcon />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{model.displayName}</span>
                        {isPro && (
                          <span className="flex-shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {model.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      </div>
                    )}
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