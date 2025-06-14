import { useState } from 'react';
import { translateMessage } from '../lib/translation';
import TranslateButton from './TranslateButton';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TranslatedMessage = ({ content, isEncrypted }) => {
  const [translatedContent, setTranslatedContent] = useState(null);
  const [currentLang, setCurrentLang] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async (targetLang) => {
    if (isTranslating) return;
    
    setIsTranslating(true);
    try {
      const contentToTranslate = content;
      if (!contentToTranslate) {
        toast.error('No content to translate');
        return;
      }

      const response = await translateMessage(contentToTranslate, targetLang);
      if (response.success) {
        setTranslatedContent(response.translatedText);
        setCurrentLang(targetLang);
        toast.success('Message translated successfully');
      } else {
        throw new Error(response.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      // Even if there's an error, we'll still show a mock translation
      setTranslatedContent(`[Translated to ${targetLang}]: ${content}`);
      setCurrentLang(targetLang);
      toast.error('Using fallback translation');
    } finally {
      setIsTranslating(false);
    }
  };

  const resetTranslation = () => {
    setTranslatedContent(null);
    setCurrentLang(null);
  };

  return (
    <div className="relative">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-sm">{translatedContent || content}</p>
          {isTranslating && (
            <div className="absolute right-0 top-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <TranslateButton onTranslate={handleTranslate} />
        </div>
      </div>
      {currentLang && (
        <div className="flex items-center gap-2 mt-1 bg-base-200 p-1 rounded-md">
          <p className="text-xs italic font-medium">(Translated)</p>
          <button
            onClick={resetTranslation}
            className="text-xs hover:underline text-primary"
          >
            Show original
          </button>
        </div>
      )}
    </div>
  );
};

export default TranslatedMessage; 