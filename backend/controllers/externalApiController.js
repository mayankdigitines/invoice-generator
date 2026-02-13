const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.fetchGstDetails = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // 1. Initialize Gemini with your API Key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 2. Configure the model (Use 'gemini-1.5-flash' for speed and cost)
    // CRITICAL FIX: We enable 'responseMimeType: "application/json"' to ensure valid JSON output
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    // 3. Create the prompt
    const prompt = `
      You are an Indian GST expert API. 
      I will give you a product name or HSN code: "${query}".
      Identify the most likely HSN Code (4 or 6 digits) and the standard GST Rate (%) for this item in India.
      Also provide a short 10-word description.
      
      Return a JSON object with these exact keys:
      { "hsnCode": "string", "gstRate": number, "description": "string" }
    `;

    // 4. Generate Content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Parse and Send
    // Since we used JSON mode, 'text' is guaranteed to be a valid JSON string
    const data = JSON.parse(text);

    res.json(data);

  } catch (error) {
    console.error('External API Error:', error.message);
    
    // Handle specific Google API errors gracefully
    if (error.message.includes('404') || error.message.includes('Not Found')) {
       return res.status(500).json({ 
         message: 'AI Model not reachable. Please check if "Generative Language API" is enabled in Google Cloud Console.' 
       });
    }

    // Fallback default to prevent app crash
    res.json({ 
      hsnCode: 'GEN-ERR', 
      gstRate: 18, 
      description: 'Could not fetch details automatically. Please enter manually.' 
    });
  }
};