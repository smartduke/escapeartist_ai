import { NextRequest, NextResponse } from 'next/server';
import {
  getAvailableChatModelProviders,
} from '@/lib/providers';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BlogExportRequest = {
  content: string;
  userQuestion?: string;
  chatModel?: {
    provider: string;
    name: string;
  };
  sources?: Array<{
    metadata: {
      title: string;
      url: string;
    };
  }>;
};

const SEO_BLOG_PROMPT = `You are an expert SEO content writer and Yoast SEO specialist. Your task is to EXPAND and ENHANCE the given content into a comprehensive, 100% Yoast SEO-compliant blog post that is LONGER and MORE DETAILED than the original.

CRITICAL INSTRUCTION - EXPAND, DON'T SUMMARIZE:
- Take the original content and EXPAND it by 150-200% 
- ADD more details, examples, statistics, and insights to every section
- ENHANCE each point with additional explanations and context
- NEVER shorten or condense the original content
- CREATE a comprehensive article that's significantly more valuable than the source
- ADD tables, detailed lists, step-by-step guides where appropriate
- INCLUDE specific examples, case studies, and expert insights
- EXPAND each section with actionable advice and practical tips

YOAST SEO REQUIREMENTS - MUST MEET ALL:

**READABILITY:**
1. Sentences: Max 20 words per sentence, avg 15 words
2. Paragraphs: Max 150 words per paragraph
3. Subheadings: Every 300 words maximum
4. Passive voice: Less than 10% of sentences
5. Transition words: Use in 30%+ of sentences
6. Flesch Reading Ease: 60+ score (conversational tone)

**SEO OPTIMIZATION:**
1. Focus keyword: Choose 1 primary keyword (2-3 words max)
2. Title: Include focus keyword at beginning, 50-60 chars
3. Meta description: Include focus keyword, 150-160 chars
4. URL slug: Include focus keyword, max 5 words
5. H1: Include focus keyword exactly once
6. H2/H3: Include focus keyword or synonyms in 50% of headings
7. Keyword density: 0.5-2.5% throughout content
8. First paragraph: Include focus keyword in first 100 words
9. Internal links: Suggest 3-5 with keyword-rich anchor text
10. External links: 1-2 authoritative sources
11. Image alt text: Include focus keyword  
12. Content length: 1200+ words minimum (aim for 1500-2000 words)

**CONTENT ENHANCEMENT REQUIREMENTS:**
- MINIMUM 2000-3000 words (much longer than original)
- EXPAND every section from the original content
- ADD detailed explanations, statistics, and real-world examples
- INCLUDE comparison tables where relevant
- CREATE comprehensive lists with detailed explanations
- ADD step-by-step guides and actionable advice
- INCORPORATE expert insights and industry best practices
- PROVIDE specific examples and case studies

**ARTICLE STRUCTURE (MUCH MORE DETAILED THAN ORIGINAL):**
- Extended Introduction (250-300 words with focus keyword and overview)
- 6-8 main sections with H2 headings (300-400 words each, expanded from original)
- 3-4 detailed subsections per main section with H3 headings (200-300 words each)
- Additional sections: Benefits, Challenges, Best Practices, Expert Tips
- Comprehensive comparison tables and detailed lists
- Step-by-step guides and actionable frameworks
- Extended conclusion with multiple CTAs and next steps (250-300 words)
- DO NOT include FAQ section in content

**CRITICAL: Write COMPLETE content - expand on every point:**
- PRESERVE ALL original citations [1], [2], [3] from the source content
- Provide detailed explanations, examples, and insights WITH proper citations
- Use transition sentences between paragraphs
- Include specific details, statistics, and expert advice WITH citation support
- Never use "..." or incomplete sentences
- Each paragraph must be fully developed with supporting details and citations
- When expanding content, add MORE citations to support new claims

**HTML FORMATTING REQUIREMENTS:**
- Use <h1>, <h2>, <h3>, <h4> tags for headings (not markdown #)
- Use <p> tags for complete paragraphs (200+ words each)
- Use <strong> for bold text, <em> for italic text
- Use <ul><li> for bullet points, <ol><li> for numbered lists
- Use <table><tr><td> for comparison tables and data
- Use <blockquote> for expert quotes and key insights
- Add proper spacing with line breaks between elements
- Include <div class="highlight"> for important callout boxes
- Use detailed lists with explanations for each point

**CITATION REQUIREMENTS:**
- PRESERVE ALL original citations from the source content (e.g., [1], [2], [3])
- When expanding content, ADD MORE citations using the same numbered format
- Use citations to support claims: "Studies show that this approach works[1][2]"
- Reference multiple sources for important claims: "This is supported by research[1][3][5]"
- Maintain academic credibility with proper citation placement

**KEYWORD STRATEGY:**
- Use focus keyword naturally throughout
- Include LSI keywords and synonyms
- Use long-tail variations
- Maintain keyword density 0.5-2.5%

OUTPUT FORMAT (JSON):
{
  "focusKeyword": "primary keyword phrase",
  "title": "SEO title with focus keyword (50-60 chars)",
  "metaDescription": "Meta description with focus keyword (150-160 chars)",
  "urlSlug": "focus-keyword-url-slug",
  "content": "<p>This comprehensive introduction paragraph spans 250-300 words and contains the focus keyword multiple times while providing extensive context about the topic[1]. It explains the importance of the subject matter, provides background information, includes relevant statistics[2], and sets up the reader for the detailed guide that follows. The introduction covers the scope of the article, previews the main sections, and establishes the value proposition for readers[3]. It addresses the target audience's pain points and promises specific solutions that will be covered in detail throughout the article.</p><h2>Expanded Main Section Title with Focus Keywords</h2><p>This extensively detailed section contains 300-400 words that thoroughly explores the main topic with multiple subsections[1][4]. It provides comprehensive insights, detailed explanations, step-by-step processes, real-world examples, industry statistics[2][5], expert opinions, and actionable strategies that readers can immediately implement. The section includes specific case studies, comparative analysis[3], and practical frameworks that add significant value beyond the original content.</p><h3>Comprehensive Subsection with Detailed Analysis</h3><p>This detailed subsection spans 200-300 words and provides specific, actionable information including expert tips[1], best practices, detailed methodologies[4], real-world applications, and comprehensive examples. Research shows that this approach is effective[2][3], and multiple studies support these findings[5][6].</p><table><tr><th>Feature</th><th>Benefit</th><th>Implementation</th></tr><tr><td>Detailed Feature 1</td><td>Specific Benefit Explanation</td><td>Step-by-step Implementation Guide</td></tr></table><ul><li><strong>Detailed Point 1:</strong> Comprehensive explanation with examples and implementation tips[1][2]</li><li><strong>Detailed Point 2:</strong> Extended explanation with case studies and best practices[3][4]</li></ul>",
  "yoastAnalysis": {
    "titleLength": 58,
    "metaLength": 156,
    "keywordInTitle": true,
    "keywordInMeta": true,
    "keywordInFirstParagraph": true,
    "keywordDensity": "1.2%",
    "readabilityScore": 65,
    "sentenceLength": "Good",
    "paragraphLength": "Good",
    "subheadingDistribution": "Good",
    "passiveVoice": "8%",
    "transitionWords": "35%"
  },
  "keywords": {
    "focus": "main keyword",
    "related": ["synonym1", "synonym2", "synonym3"],
    "longTail": ["long tail variation 1", "long tail variation 2"],
    "lsi": ["semantic keyword 1", "semantic keyword 2"]
  },
  "contentStructure": {
    "wordCount": 850,
    "headings": {
      "h1": 1,
      "h2": 4,
      "h3": 6
    },
    "paragraphs": 12,
    "sentences": 45
  },

  "internalLinks": [
    {
      "anchorText": "keyword-rich anchor text",
      "suggestedUrl": "/related-page",
      "placement": "After paragraph X"
    }
  ],
  "externalLinks": [
    {
      "anchorText": "authoritative source",
      "domain": "example.com",
      "context": "Where to place for credibility"
    }
  ],
  "imageRequirements": [
    {
      "altText": "Focus keyword description",
      "placement": "After introduction",
      "purpose": "Feature image"
    }
  ],
  "seoRecommendations": [
    "Add more transition words",
    "Include focus keyword in more H2 headings"
  ]
}

**IMPORTANT: Analyze the content below for existing citations [1], [2], [3] etc. and PRESERVE them in your expanded version. Add more citations as needed for new claims.**

CONTENT TO OPTIMIZE:
{USER_QUESTION}Content: `;

// Function to extract citations and create references
const extractCitationsAndReferences = (content: string, sources?: Array<{ metadata: { title: string; url: string } }>) => {
  if (!sources || sources.length === 0) {
    return {
      references: [],
      authorityLinks: []
    };
  }

  // Extract all citation numbers from content (e.g., [1], [2], [3])
  const citationMatches = content.match(/\[(\d+)\]/g) || [];
  const citedNumbers = [...new Set(citationMatches.map(match => parseInt(match.replace(/\[|\]/g, ''))))];
  
  // Create references for cited sources
  const references = citedNumbers
    .filter(num => num > 0 && num <= sources.length)
    .map(num => {
      const source = sources[num - 1];
      return {
        id: num,
        title: source.metadata.title || 'Untitled Source',
        url: source.metadata.url,
        domain: new URL(source.metadata.url).hostname
      };
    });

  // Filter for high-authority domains for external links section
  const authorityDomains = [
    'gov', 'edu', 'org', 'wikipedia.org', 'reuters.com', 'bbc.com', 'cnn.com', 
    'nytimes.com', 'washingtonpost.com', 'nature.com', 'science.org', 'pubmed.ncbi.nlm.nih.gov',
    'who.int', 'cdc.gov', 'fda.gov', 'sec.gov', 'harvard.edu', 'mit.edu', 'stanford.edu'
  ];
  
  const authorityLinks = references.filter(ref => 
    authorityDomains.some(domain => ref.domain.includes(domain))
  ).map(ref => ({
    anchorText: `${ref.title.substring(0, 60)}${ref.title.length > 60 ? '...' : ''}`,
    domain: ref.domain,
    context: `Referenced as supporting evidence`
  }));

  return { references, authorityLinks };
};

export async function POST(req: NextRequest) {
  try {
    const { content, userQuestion, chatModel, sources }: BlogExportRequest = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Extract citations and create references
    const { references, authorityLinks } = extractCitationsAndReferences(content, sources);

    // Get available chat models
    const chatModels = await getAvailableChatModelProviders();
    
    // Priority order for best content generation models
    const modelPriority = [
      // OpenAI GPT-4 models (best for content generation)
      { provider: 'openai', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-4-turbo-preview'] },
      // Anthropic Claude models (excellent for long-form content)
      { provider: 'anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'] },
      // Google Gemini models (good for content generation)
      { provider: 'gemini', models: ['gemini-1.5-pro', 'gemini-pro'] },
      // Groq models (fast but may be less detailed)
      { provider: 'groq', models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768'] },
      // Deepseek models
      { provider: 'deepseek', models: ['deepseek-chat'] },
      // Ollama models (local, quality varies)
      { provider: 'ollama', models: ['llama3.1:70b', 'llama3.1:8b', 'mistral:7b'] },
    ];
    
    // Select the best available model for content generation
    let selectedModel;
    let selectedModelInfo = null;
    
    for (const providerConfig of modelPriority) {
      const { provider, models } = providerConfig;
      if (chatModels[provider]) {
        for (const modelName of models) {
          if (chatModels[provider][modelName]) {
            selectedModel = chatModels[provider][modelName].model;
            selectedModelInfo = { provider, name: modelName };
            console.log(`Selected model for blog generation: ${provider}/${modelName}`);
            break;
          }
        }
        if (selectedModel) break;
      }
    }
    
    // Fallback to user's preferred model if specified and no priority model found
    if (!selectedModel && chatModel && chatModels[chatModel.provider] && chatModels[chatModel.provider][chatModel.name]) {
      selectedModel = chatModels[chatModel.provider][chatModel.name].model;
      selectedModelInfo = chatModel;
      console.log(`Using user's preferred model: ${chatModel.provider}/${chatModel.name}`);
    }
    
    // Final fallback to any available model
    if (!selectedModel) {
      const firstProvider = Object.keys(chatModels)[0];
      if (firstProvider && Object.keys(chatModels[firstProvider]).length > 0) {
        const firstModel = Object.keys(chatModels[firstProvider])[0];
        selectedModel = chatModels[firstProvider][firstModel].model;
        selectedModelInfo = { provider: firstProvider, name: firstModel };
        console.log(`Fallback to first available model: ${firstProvider}/${firstModel}`);
      } else {
        return NextResponse.json(
          { error: 'No chat models available' },
          { status: 500 }
        );
      }
    }

    // Create optimized prompt based on the selected model
    let optimizedPrompt = SEO_BLOG_PROMPT;
    
    // Add model-specific instructions for better content generation
    if (selectedModelInfo?.provider === 'openai') {
      optimizedPrompt += `\n\nNOTE: You are GPT-4, use your advanced reasoning capabilities to create exceptionally detailed, comprehensive content with nuanced explanations and expert-level insights. CRITICAL: Preserve all existing citations [1][2][3] and add more as needed.`;
    } else if (selectedModelInfo?.provider === 'anthropic') {
      optimizedPrompt += `\n\nNOTE: You are Claude, leverage your strength in long-form content creation to write detailed, well-structured, and thoughtful articles with comprehensive analysis. CRITICAL: Preserve all existing citations [1][2][3] and add more as needed.`;
    } else if (selectedModelInfo?.provider === 'gemini') {
      optimizedPrompt += `\n\nNOTE: You are Gemini, use your multimodal understanding to create rich, detailed content with comprehensive explanations and practical insights. CRITICAL: Preserve all existing citations [1][2][3] and add more as needed.`;
    }
    
    const fullPrompt = optimizedPrompt.replace(
      '{USER_QUESTION}',
      userQuestion ? `Original Question: ${userQuestion}\n\n` : ''
    ) + content;
    
    const messages = [
      new HumanMessage(fullPrompt)
    ];

    // Generate blog post using the selected model
    const response = await selectedModel.invoke(messages);
    console.log(`Blog generation completed using ${selectedModelInfo?.provider}/${selectedModelInfo?.name}`);
    
    // Add model information to track what was used
    const modelUsed = selectedModelInfo ? `${selectedModelInfo.provider}/${selectedModelInfo.name}` : 'Unknown';
    
    let blogData;
    try {
      // Extract JSON from the response
      const responseText = response.content.toString();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        blogData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if no JSON found - create structured response
        blogData = {
          focusKeyword: "AI guide",
          title: "SEO-Optimized Blog Post",
          metaDescription: "Comprehensive guide based on AI analysis and research",
          urlSlug: "ai-guide-blog-post",
          content: responseText,
          yoastAnalysis: {
            titleLength: 25,
            metaLength: 60,
            keywordInTitle: true,
            keywordInMeta: true,
            keywordInFirstParagraph: false,
            keywordDensity: "1.0%",
            readabilityScore: 60,
            sentenceLength: "Needs improvement",
            paragraphLength: "Good",
            subheadingDistribution: "Needs improvement",
            passiveVoice: "15%",
            transitionWords: "20%"
          },
          keywords: {
            focus: "AI guide",
            related: ["artificial intelligence", "tutorial"],
            longTail: ["AI guide for beginners"],
            lsi: ["machine learning", "technology"]
          },
          contentStructure: {
            wordCount: 2500,
            headings: { h1: 1, h2: 8, h3: 12, h4: 6 },
            paragraphs: 20,
            sentences: 120
          },

          internalLinks: [],
          externalLinks: authorityLinks,
          imageRequirements: [],
          references: references,
          seoRecommendations: [
            "Add more internal links",
            "Include relevant images with alt text",
            "Optimize for mobile users"
          ]
        };
      }
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse blog post data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...blogData,
        modelUsed: modelUsed,
        references: references,
        // Merge authority links with any existing external links
        externalLinks: [
          ...(blogData.externalLinks || []),
          ...authorityLinks
        ]
      }
    });

  } catch (error) {
    console.error('Blog export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate blog post' },
      { status: 500 }
    );
  }
} 