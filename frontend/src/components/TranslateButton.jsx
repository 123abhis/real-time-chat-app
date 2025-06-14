import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../lib/translation';
import toast from 'react-hot-toast';

const TranslateButton = ({ onTranslate }) => {
  const [selectedLang, setSelectedLang] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleTranslate = async (langCode) => {
    if (isTranslating) return;
    
    setIsTranslating(true);
    try {
      await onTranslate(langCode);
      setSelectedLang(langCode);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to translate message');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        className="btn btn-ghost btn-sm bg-base-200 hover:bg-base-300"
        disabled={isTranslating}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isTranslating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Languages size={16} />
        )}
      </button>
      {isOpen && (
        <ul
          className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 max-h-60 overflow-y-auto border border-base-300"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                className={`flex items-center justify-between ${
                  selectedLang === lang.code ? 'active bg-primary text-primary-content' : 'hover:bg-base-200'
                }`}
                onClick={() => handleTranslate(lang.code)}
                disabled={isTranslating}
              >
                <span>{lang.name}</span>
                {selectedLang === lang.code && (
                  <span className="text-xs opacity-70">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TranslateButton; 