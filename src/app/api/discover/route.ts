import { searchSearxng } from '@/lib/searxng';

interface SearchResult {
  title: string;
  content?: string;
  url: string;
  thumbnail?: string;
}

const articleWebsites = [
  'yahoo.com',
  'www.exchangewire.com',
  'businessinsider.com',
  'wired.com',
  'mashable.com',
  'theverge.com',
  'gizmodo.com',
  'cnet.com',
  'venturebeat.com',
];

const categoryTopics: Record<string, string[]> = {
  general: ['latest news', 'breaking news', 'top stories'],
  business: ['business', 'finance', 'economy', 'markets', 'stocks'],
  technology: ['technology', 'AI', 'tech', 'software', 'innovation'],
  entertainment: ['entertainment', 'movies', 'celebrities', 'music', 'hollywood'],
  sports: ['sports', 'football', 'basketball', 'soccer', 'baseball'],
  science: ['science', 'research', 'discovery', 'space', 'physics'],
  health: ['health', 'medical', 'wellness', 'medicine', 'healthcare'],
};

export const GET = async (req: Request) => {
  try {
    const params = new URL(req.url).searchParams;
    const category = params.get('category') || 'general';
    const mode: 'normal' | 'preview' =
      (params.get('mode') as 'normal' | 'preview') || 'normal';

    const topics = categoryTopics[category] || categoryTopics.general;
    let data: SearchResult[] = [];

    if (mode === 'normal') {
      data = (
        await Promise.all([
          ...new Array(Math.min(articleWebsites.length * topics.length, 15))
            .fill(0)
            .map(async (_, i) => {
              const website = articleWebsites[i % articleWebsites.length];
              const topic = topics[i % topics.length];
              
              try {
              return (
                await searchSearxng(
                    `site:${website} ${topic}`,
                  {
                    engines: ['bing news'],
                    pageno: 1,
                  },
                )
              ).results;
              } catch (error) {
                console.error(`Error searching ${website} for ${topic}:`, error);
                return [];
              }
            }),
        ])
      )
        .map((result) => result)
        .flat()
        .filter((article: any) => article && article.title && article.content)
        .sort(() => Math.random() - 0.5)
        .slice(0, 12); // Limit to 12 articles per category
    } else {
      try {
      data = (
        await searchSearxng(
          `site:${articleWebsites[Math.floor(Math.random() * articleWebsites.length)]} ${topics[Math.floor(Math.random() * topics.length)]}`,
          { engines: ['bing news'], pageno: 1 },
        )
      ).results;
      } catch (error) {
        console.error('Error in preview mode:', error);
        data = [];
      }
    }

    return Response.json(
      {
        blogs: data,
        category: category,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error(`An error occurred in discover route: ${err}`);
    return Response.json(
      {
        message: 'An error has occurred',
      },
      {
        status: 500,
      },
    );
  }
};
