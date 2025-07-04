/* eslint-disable @next/next/no-img-element */
import { ImagesIcon, PlusIcon, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import { Message } from './ChatWindow';

type Image = {
  url: string;
  img_src: string;
  title: string;
};

const SearchImages = ({
  query,
  chatHistory,
  messageId,
  autoLoad = false,
  focusMode = 'escapeArtistSearch',
}: {
  query: string;
  chatHistory: Message[];
  messageId: string;
  autoLoad?: boolean;
  focusMode?: string;
}) => {
  const [images, setImages] = useState<Image[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const loadImages = async () => {
    if (loading) return;
    
    setLoading(true);

    try {
      const chatModelProvider = localStorage.getItem('chatModelProvider');
      const chatModel = localStorage.getItem('chatModel');

      const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
      const customOpenAIKey = localStorage.getItem('openAIApiKey');

      console.log(`Loading images for query: "${query}" with focus mode: ${focusMode}`);

      const res = await fetch(`/api/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          chatHistory: chatHistory,
          focusMode: focusMode,
          chatModel: {
            provider: chatModelProvider,
            model: chatModel,
            ...(chatModelProvider === 'custom_openai' && {
              customOpenAIBaseURL: customOpenAIBaseURL,
              customOpenAIKey: customOpenAIKey,
            }),
          },
        }),
      });

      if (!res.ok) {
        console.error(`Image search API error: ${res.status} ${res.statusText}`);
        const errorData = await res.text();
        console.error('Error details:', errorData);
        setImages([]);
        return;
      }

      const data = await res.json();
      console.log(`Received ${data.images?.length || 0} images from API`);

      const images = data.images ?? [];
      setImages(images);
      
      if (images.length > 0) {
        setSlides(
          images.map((image: Image, index: number) => {
            try {
              return {
                src: image.img_src,
                title: image.title,
                description: `${image.title} - Source: ${new URL(image.url).hostname}`,
                url: image.url,
                index: index,
              };
            } catch (urlError) {
              console.warn('Invalid URL for image:', image.url);
              return {
                src: image.img_src,
                title: image.title,
                description: `${image.title} - Source: ${image.url}`,
                url: image.url,
                index: index,
              };
            }
          }),
        );
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && images === null && !loading) {
      loadImages();
    }
  }, [autoLoad]);

  return (
    <>
      {!loading && images === null && !autoLoad && (
        <button
          id={`search-images-${messageId}`}
          onClick={loadImages}
          className="border border-dashed border-light-200 dark:border-dark-200 hover:bg-light-200 dark:hover:bg-dark-200 active:scale-95 duration-200 transition px-4 py-2 flex flex-row items-center justify-between rounded-lg dark:text-white text-sm w-full"
        >
          <div className="flex flex-row items-center space-x-2">
            <ImagesIcon size={17} />
            <p>Search images</p>
          </div>
          <PlusIcon className="text-[#24A0ED]" size={17} />
        </button>
      )}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-light-secondary dark:bg-dark-secondary h-32 w-full rounded-lg animate-pulse aspect-video object-cover"
            />
          ))}
        </div>
      )}
      {images !== null && images.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map((image, i) => (
              <img
                onClick={() => {
                  setOpen(true);
                  setSlides([
                    slides[i],
                    ...slides.slice(0, i),
                    ...slides.slice(i + 1),
                  ]);
                }}
                key={i}
                src={image.img_src}
                alt={image.title}
                className="h-full w-full aspect-video object-cover rounded-lg transition duration-200 active:scale-95 hover:scale-[1.02] cursor-zoom-in"
                onError={(e) => {
                  console.warn('Failed to load image:', image.img_src);
                  // Hide broken images
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ))}
          </div>
          <Lightbox 
            open={open} 
            close={() => setOpen(false)} 
            slides={slides}
            plugins={[Captions]}
            captions={{
              showToggle: true,
              descriptionTextAlign: 'start',
            }}
            on={{
              view: ({ index }) => setCurrentSlideIndex(index),
            }}
            toolbar={{
              buttons: [
                <button
                  key="source"
                  type="button"
                  className="yarl__button"
                  title="View Source"
                  onClick={() => {
                    if (slides[currentSlideIndex]?.url) {
                      window.open(slides[currentSlideIndex].url, '_blank');
                    }
                  }}
                >
                  <ExternalLink size={18} />
                </button>,
                "close"
              ],
            }}
          />
        </>
      )}
      {images !== null && images.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ImagesIcon size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            No images found for your query
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs">
            Try refining your search terms or using different keywords
          </p>
          <button
            onClick={loadImages}
            className="mt-4 px-4 py-2 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </>
  );
};

export default SearchImages;
