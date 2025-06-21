/* eslint-disable @next/next/no-img-element */
import { PlayCircle, PlayIcon, PlusIcon, VideoIcon, ExternalLink } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import Lightbox, { GenericSlide, VideoSlide } from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import { Message } from './ChatWindow';

type Video = {
  url: string;
  img_src: string;
  title: string;
  iframe_src: string;
};

declare module 'yet-another-react-lightbox' {
  export interface VideoSlide extends GenericSlide {
    type: 'video-slide';
    src: string;
    iframe_src: string;
    url?: string;
    index?: number;
  }

  interface SlideTypes {
    'video-slide': VideoSlide;
  }
}

const Searchvideos = ({
  query,
  chatHistory,
  messageId,
  autoLoad = false,
}: {
  query: string;
  chatHistory: Message[];
  messageId: string;
  autoLoad?: boolean;
}) => {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<VideoSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const videoRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  const loadVideos = async () => {
    if (loading) return;
    
    setLoading(true);

    const chatModelProvider = localStorage.getItem('chatModelProvider');
    const chatModel = localStorage.getItem('chatModel');

    const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
    const customOpenAIKey = localStorage.getItem('openAIApiKey');

    const res = await fetch(`/api/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        chatHistory: chatHistory,
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

    const data = await res.json();

    const videos = data.videos ?? [];
    setVideos(videos);
    setSlides(
      videos.map((video: Video, index: number) => {
        return {
          type: 'video-slide',
          iframe_src: video.iframe_src,
          src: video.img_src,
          title: video.title,
          description: `${video.title} - Source: ${new URL(video.url).hostname}`,
          url: video.url,
          index: index,
        };
      }),
    );
    setLoading(false);
  };

  useEffect(() => {
    if (autoLoad && videos === null && !loading) {
      loadVideos();
    }
  }, [autoLoad]);

  return (
    <>
      {!loading && videos === null && !autoLoad && (
        <button
          id={`search-videos-${messageId}`}
          onClick={loadVideos}
          className="border border-dashed border-light-200 dark:border-dark-200 hover:bg-light-200 dark:hover:bg-dark-200 active:scale-95 duration-200 transition px-4 py-2 flex flex-row items-center justify-between rounded-lg dark:text-white text-sm w-full"
        >
          <div className="flex flex-row items-center space-x-2">
            <VideoIcon size={17} />
            <p>Search videos</p>
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
      {videos !== null && videos.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {videos.map((video, i) => (
              <div
                onClick={() => {
                  setOpen(true);
                  setSlides([
                    slides[i],
                    ...slides.slice(0, i),
                    ...slides.slice(i + 1),
                  ]);
                }}
                className="relative transition duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer"
                key={i}
              >
                <img
                  src={video.img_src}
                  alt={video.title}
                  className="relative h-full w-full aspect-video object-cover rounded-lg"
                />
                <div className="absolute bg-white/70 dark:bg-black/70 text-black/70 dark:text-white/70 px-2 py-1 flex flex-row items-center space-x-1 bottom-1 right-1 rounded-md">
                  <PlayCircle size={15} />
                  <p className="text-xs">Video</p>
                </div>
              </div>
            ))}
          </div>
          <Lightbox
            open={open}
            close={() => setOpen(false)}
            slides={slides}
            index={currentIndex}
            plugins={[Captions]}
            captions={{
              showToggle: true,
              descriptionTextAlign: 'start',
            }}
            on={{
              view: ({ index }) => {
                const previousIframe = videoRefs.current[currentIndex];
                if (previousIframe?.contentWindow) {
                  previousIframe.contentWindow.postMessage(
                    '{"event":"command","func":"pauseVideo","args":""}',
                    '*',
                  );
                }

                setCurrentIndex(index);
                setCurrentSlideIndex(index);
              },
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
            render={{
              slide: ({ slide }) => {
                const index = slides.findIndex((s) => s === slide);
                return slide.type === 'video-slide' ? (
                  <div className="h-full w-full flex flex-row items-center justify-center">
                    <iframe
                      src={`${slide.iframe_src}${slide.iframe_src.includes('?') ? '&' : '?'}enablejsapi=1`}
                      ref={(el) => {
                        if (el) {
                          videoRefs.current[index] = el;
                        }
                      }}
                      className="aspect-video max-h-[95vh] w-[95vw] rounded-2xl md:w-[80vw]"
                      allowFullScreen
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : null;
              },
            }}
          />
        </>
      )}
    </>
  );
};

export default Searchvideos;
