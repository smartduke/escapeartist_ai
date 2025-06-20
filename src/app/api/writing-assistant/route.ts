import { NextRequest } from 'next/server';

export const POST = async (req: NextRequest) => {
  try {
    const { text, action, customPrompt, chatModel, embeddingModel } = await req.json();

    if (!text && !customPrompt) {
      return Response.json(
        { error: 'Text or custom prompt is required' },
        { status: 400 }
      );
    }

    if (!chatModel || !chatModel.provider || !chatModel.name) {
      return Response.json(
        { error: 'Chat model configuration is required' },
        { status: 400 }
      );
    }

    // Import the necessary modules dynamically
    const { getAvailableChatModelProviders } = await import('@/lib/providers');
    const providers = await getAvailableChatModelProviders();

    // Log debugging information
    console.log('Writing Assistant Debug:', {
      chatModel,
      availableProviders: Object.keys(providers),
      providerExists: !!providers[chatModel.provider]
    });

    // Get the chat model provider
    const provider = providers[chatModel.provider];
    if (!provider) {
      console.error('Invalid chat model provider:', chatModel.provider);
      console.error('Available providers:', Object.keys(providers));
      return Response.json(
        { error: `Invalid chat model provider: ${chatModel.provider}. Available providers: ${Object.keys(providers).join(', ')}` },
        { status: 400 }
      );
    }

    const chatModelData = provider[chatModel.name];
    if (!chatModelData) {
      console.error('Invalid chat model:', chatModel.name);
      console.error('Available models for provider:', Object.keys(provider));
      return Response.json(
        { error: `Invalid chat model: ${chatModel.name}. Available models: ${Object.keys(provider).join(', ')}` },
        { status: 400 }
      );
    }

    const chatModelInstance = chatModelData.model;

    // Generate the appropriate prompt based on action
    let prompt = '';
    const textToProcess = text || '';

    switch (action) {
      case 'improve':
        prompt = `Please improve the following text by making it clearer, more engaging, and better structured. Keep the same meaning and tone but enhance readability. Return only the improved version without any explanations:\n\n${textToProcess}`;
        break;
      case 'grammar':
        prompt = `Fix grammar, spelling, and punctuation errors in the following text. Return only the corrected version without any explanations:\n\n${textToProcess}`;
        break;
      case 'formal':
        prompt = `Rewrite the following text in a more formal, professional tone. Return only the rewritten version without any explanations:\n\n${textToProcess}`;
        break;
      case 'casual':
        prompt = `Rewrite the following text in a more casual, friendly tone. Return only the rewritten version without any explanations:\n\n${textToProcess}`;
        break;
      case 'shorter':
        prompt = `Make the following text more concise while keeping all important information. Return only the shortened version without any explanations:\n\n${textToProcess}`;
        break;
      case 'longer':
        prompt = `Expand the following text with more details, examples, and explanations. Return only the expanded version without any explanations:\n\n${textToProcess}`;
        break;
      case 'translate':
        prompt = `Translate the following text to English (if it's not English) or to the most appropriate language based on context. Return only the translated version without any explanations:\n\n${textToProcess}`;
        break;
      case 'custom':
        prompt = `${customPrompt}\n\n${textToProcess}`;
        break;
      default:
        prompt = `Help improve the following text:\n\n${textToProcess}`;
    }

    // Generate the AI response (no streaming for simplicity)
    try {
      // Import the message classes
      const { HumanMessage, SystemMessage } = await import('@langchain/core/messages');
      
      const response = await chatModelInstance.invoke([
        new SystemMessage('You are a helpful writing assistant. Provide clear, concise improvements to text. Return only the improved text without any explanations or additional formatting.'),
        new HumanMessage(prompt)
      ]);

      const aiResponse = typeof response.content === 'string' ? response.content : response.content.toString();
      
      if (!aiResponse.trim()) {
        return Response.json(
          { error: 'No response generated from AI' },
          { status: 500 }
        );
      }

      // Return the suggestions as a simple JSON response
      return Response.json({
        suggestions: [aiResponse.trim()]
      });

    } catch (error) {
      console.error('Writing assistant error:', error);
      return Response.json(
        { error: 'Failed to process writing request' },
        { status: 500 }
      );
    }



  } catch (error) {
    console.error('Writing assistant API error:', error);
    return Response.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
}; 