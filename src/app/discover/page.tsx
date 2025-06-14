'use client';

import { Search, Newspaper, Building2, Laptop, Film, Trophy, Beaker, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Discover {
  title: string;
  content: string;
  url: string;
  thumbnail: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
}

const categories: Category[] = [
  { id: 'general', label: 'General', icon: Newspaper },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'technology', label: 'Technology', icon: Laptop },
  { id: 'entertainment', label: 'Entertainment', icon: Film },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'science', label: 'Science', icon: Beaker },
  { id: 'health', label: 'Health', icon: Heart },
];

const Page = () => {
  const [discover, setDiscover] = useState<Discover[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('general');

  const fetchData = async (category: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discover?category=${category}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      const filteredBlogs = data.blogs.filter((blog: Discover) => blog.thumbnail);
      setDiscover(filteredBlogs);
    } catch (err: any) {
      console.error('Error fetching data:', err.message);
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeCategory);
  }, [activeCategory]);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex flex-col pt-4 px-4">
        <div className="flex items-center mb-6">
          <Search />
          <h1 className="text-3xl font-medium p-2">Discover</h1>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  activeCategory === category.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-light-secondary dark:bg-dark-secondary text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10"
                )}
              >
                <Icon size={16} />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        <hr className="border-t border-light-200 dark:border-dark-200 mb-6" />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 overflow-y-auto">
        {loading ? (
          <div className="flex flex-row items-center justify-center min-h-[400px]">
            <svg
              aria-hidden="true"
              className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          </div>
        ) : discover && discover.length > 0 ? (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 pb-28 lg:pb-8">
                         {discover.map((item, i) => (
               <Link
                 href={`/?q=Tell me about: ${item.title}`}
                 key={i}
                 className="max-w-sm rounded-lg overflow-hidden bg-light-secondary dark:bg-dark-secondary hover:-translate-y-[2px] hover:shadow-lg transition-all duration-200"
                 target="_blank"
               >
                <img
                  className="object-cover w-full aspect-video"
                  src={
                    item.thumbnail.includes('?')
                      ? new URL(item.thumbnail).origin +
                        new URL(item.thumbnail).pathname +
                        `?id=${new URL(item.thumbnail).searchParams.get('id')}`
                      : item.thumbnail
                  }
                  alt={item.title}
                  onError={(e) => {
                    e.currentTarget.src = '/api/placeholder/400/225';
                  }}
                />
                <div className="px-6 py-4">
                  <div className="font-semibold text-lg mb-2 text-black dark:text-white line-clamp-2">
                    {item.title.length > 80 ? `${item.title.slice(0, 80)}...` : item.title}
                  </div>
                  <p className="text-black/70 dark:text-white/70 text-sm line-clamp-3">
                    {item.content.length > 120 ? `${item.content.slice(0, 120)}...` : item.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-xl font-medium text-black dark:text-white mb-2">
              No articles found
            </h3>
            <p className="text-black/70 dark:text-white/70 max-w-md">
              No articles were found for the {categories.find(c => c.id === activeCategory)?.label} category. 
              Try switching to a different category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
