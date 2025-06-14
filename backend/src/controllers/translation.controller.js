import { translateText } from '../services/translation.service.js';

export const translateMessage = async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    const translatedText = await translateText(text, targetLang);

    res.status(200).json({
      success: true,
      translatedText
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Failed to translate message' });
  }
}; 