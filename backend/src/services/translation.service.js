import axios from 'axios';

// Using a more reliable translation API
const TRANSLATION_API = 'https://translate.googleapis.com/translate_a/single';

export const translateText = async (text, targetLang) => {
  try {
    // Using Google Translate API (unofficial but reliable)
    const response = await axios.get(TRANSLATION_API, {
      params: {
        client: 'gtx',
        sl: 'auto',
        tl: targetLang,
        dt: 't',
        q: text
      }
    });

    if (response.data && response.data[0] && response.data[0][0] && response.data[0][0][0]) {
      return response.data[0][0][0];
    }
    
    throw new Error('Translation failed with primary API');
  } catch (error) {
    console.error('Translation error with primary API:', error);
    
    // For demonstration purposes, return a mock translation
    // In a production app, you would use a paid API or another fallback
    return `[Translated to ${targetLang}]: ${text}`;
  }
}; 