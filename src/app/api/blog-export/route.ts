import { NextRequest, NextResponse } from 'next/server';
import {
  getAvailableChatModelProviders,
} from '@/lib/providers';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import db from '@/lib/db';
import { blogExports } from '@/lib/db/schema';

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
  chatId?: string;
  messageId?: string;
  userId?: string;
  guestId?: string;
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

// Function to convert markdown to HTML (simplified version)
const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  
  // Paragraphs
  html = html.split('\n\n').map(para => para.trim() ? `<p>${para}</p>` : '').join('\n');
  
  return html;
};

// Function to generate complete HTML for blog export
const generateBlogHTML = (blogData: any, title: string): string => {
  const keywords = [
    blogData.keywords?.focus || '', 
    ...(blogData.keywords?.related || []), 
    ...(blogData.keywords?.longTail || []), 
    ...(blogData.keywords?.lsi || [])
  ].filter(k => k).join(', ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blogData.title}</title>
  <meta name="description" content="${blogData.metaDescription}">
  <meta name="keywords" content="${keywords}">
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${blogData.title}">
  <meta property="og:description" content="${blogData.metaDescription}">
  <meta property="og:type" content="article">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${blogData.title}">
  <meta name="twitter:description" content="${blogData.metaDescription}">
  
  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${blogData.title}",
    "description": "${blogData.metaDescription}",
    "author": {
      "@type": "Organization",
      "name": "Perplexica AI"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Perplexica AI"
    },
    "datePublished": "${new Date().toISOString()}",
    "dateModified": "${new Date().toISOString()}"
  }
  </script>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #2c3e50;
      margin-top: 2em;
      margin-bottom: 0.5em;
    }
    h1 { font-size: 2.5em; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { font-size: 2em; color: #34495e; }
    h3 { font-size: 1.5em; }
    
    .references-section {
      background: #f0f9ff;
      padding: 30px;
      border-radius: 12px;
      margin: 40px 0;
      border-left: 4px solid #0ea5e9;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .references-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-top: 20px;
    }
    .reference-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e0f2fe;
    }
    .reference-number {
      background: #0ea5e9;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.85em;
      flex-shrink: 0;
    }
    .reference-title {
      color: #0c4a6e;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95em;
      line-height: 1.4;
      display: block;
      margin-bottom: 4px;
    }
    .reference-title:hover {
      color: #0ea5e9;
      text-decoration: underline;
    }
    .reference-domain {
      font-size: 0.8em;
      color: #64748b;
      font-style: italic;
    }
    
    .generated-by {
      text-align: center;
      margin-top: 50px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <article>
    <h1>${blogData.title}</h1>
    
    <div class="content">
      ${blogData.content && blogData.content.includes('<') ? blogData.content : convertMarkdownToHtml(blogData.content)}
    </div>

    ${blogData.references && blogData.references.length > 0 ? `
    <div class="references-section">
      <h2>📚 References</h2>
      <div class="references-list">
        ${blogData.references.map((ref: any) => `
          <div class="reference-item">
            <span class="reference-number">[${ref.id}]</span>
            <div class="reference-details">
              <a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="reference-title">${ref.title}</a>
              <div class="reference-domain">${ref.domain}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </article>

  <div class="generated-by">
    <p>Generated by <strong>Perplexica AI</strong> - Advanced AI Search Engine</p>
    <p>Model Used: <strong>${blogData.modelUsed || 'Unknown'}</strong></p>
    <p>Exported on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
};

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
    const { content, userQuestion, chatModel, sources, chatId, messageId, userId, guestId }: BlogExportRequest = await req.json();

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

    // Prepare the final blog data
    const finalBlogData = {
      ...blogData,
      modelUsed: modelUsed,
      references: references,
      // Merge authority links with any existing external links
      externalLinks: [
        ...(blogData.externalLinks || []),
        ...authorityLinks
      ]
    };

    // Save to database if chatId and messageId are provided
    let savedExport = null;
    if (chatId && messageId) {
      try {
        // Generate title and filename
        const title = userQuestion || blogData.title || 'Blog Export';
        const shortTitle = title.substring(0, 40).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'blog-post';
        const fileName = `${shortTitle}-seo-optimized.html`;
        
        // Create HTML content (same as frontend would generate)
        const htmlContent = generateBlogHTML(finalBlogData, title);
        
        // Calculate word count from content
        const wordCount = finalBlogData.content ? 
          finalBlogData.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;

        savedExport = await db.insert(blogExports).values({
          chatId,
          messageId,
          userId: userId || null,
          guestId: guestId || null,
          title,
          fileName,
          htmlContent,
          blogData: finalBlogData,
          modelUsed,
          wordCount,
        }).returning();
      } catch (dbError) {
        console.error('Failed to save blog export to database:', dbError);
        // Continue anyway - don't fail the whole request
      }
    }

    return NextResponse.json({
      success: true,
      data: finalBlogData,
      saved: !!savedExport,
      exportId: savedExport?.[0]?.id
    });

  } catch (error) {
    console.error('Blog export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate blog post' },
      { status: 500 }
    );
  }
} 