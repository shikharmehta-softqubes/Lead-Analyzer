const sanitizePrompt = (text) => {
  if (typeof text !== 'string') return text;
  // Remove email addresses
  const noEmails = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  // Remove phone numbers (basic patterns)
  const noPhones = noEmails.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE]');
  return noPhones;
};

export const generateEmailWithAI = async (prompt, model = 'gpt-4o-mini') => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, using fallback template');
    return null;
  }

  const sanitizedPrompt = sanitizePrompt(prompt);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional sales email writer. Generate concise, personalized, and engaging emails for B2B event planning. CRITICAL: Do not include specific email addresses or phone numbers in your draft. Use placeholders like [Email] or [Phone] if you need to reference contact info. Keep emails under 200 words. Do not include subject lines.',
          },
          {
            role: 'user',
            content: sanitizedPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Failed to call OpenAI API:', error);
    return null;
  }
};
