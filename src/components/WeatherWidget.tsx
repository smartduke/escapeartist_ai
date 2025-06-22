import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const WeatherWidget = () => {
  const [data, setData] = useState({
    temperature: 0,
    condition: '',
    location: '',
    humidity: 0,
    windSpeed: 0,
    icon: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getApproxLocation = async () => {
      const res = await fetch('https://ipwhois.app/json/');
      const data = await res.json();

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
      };
    };

    const getLocation = async (
      callback: (location: {
        latitude: number;
        longitude: number;
        city: string;
      }) => void,
    ) => {
      /* 
          // Geolocation doesn't give city so we'll country using ipapi for now
            if (navigator.geolocation) {
            const result = await navigator.permissions.query({
              name: 'geolocation',
            })
    
            if (result.state === 'granted') {
              navigator.geolocation.getCurrentPosition(position => {
                callback({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                })
              })
            } else if (result.state === 'prompt') {
              callback(await getApproxLocation())
              navigator.geolocation.getCurrentPosition(position => {})
            } else if (result.state === 'denied') {
              callback(await getApproxLocation())
            }
          } else {
            callback(await getApproxLocation())
          } */
      callback(await getApproxLocation());
    };

    getLocation(async (location) => {
      const res = await fetch(`/api/weather`, {
        method: 'POST',
        body: JSON.stringify({
          lat: location.latitude,
          lng: location.longitude,
        }),
      });

      const data = await res.json();

      if (res.status !== 200) {
        console.error('Error fetching weather data');
        setLoading(false);
        return;
      }

      setData({
        temperature: data.temperature,
        condition: data.condition,
        location: location.city,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        icon: data.icon,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className={cn(
      "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
      "border border-gray-200/40 dark:border-gray-700/40",
      "rounded-xl shadow-md hover:shadow-lg transition-all duration-300",
      "flex items-center justify-between lg:justify-start gap-3 px-4 py-2.5 h-auto w-full",
      "group hover:bg-white dark:hover:bg-gray-900/98"
    )}>
      {loading ? (
        <div className="flex items-center gap-3 w-full animate-pulse">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
          <div className="space-y-2 flex-1">
            <div className="h-2.5 w-20 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
            <div className="h-2 w-16 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={`/weather-ico/${data.icon}.svg`}
                alt={data.condition}
                className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {data.temperature}°
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {data.condition}
              </span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-3">
            <div className="h-6 w-[1px] bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600" />
            
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Wind className="w-3.5 h-3.5" />
                <span className="font-medium">{data.windSpeed}km/h</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Droplets className="w-3.5 h-3.5" />
                <span className="font-medium">{data.humidity}%</span>
              </div>
            </div>
            
            <div className="h-6 w-[1px] bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600" />
            
            <div className="text-sm">
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.location}
              </span>
            </div>
          </div>
          
          {/* Mobile layout */}
          <div className="lg:hidden flex items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Wind className="w-3 h-3" />
              <span>{data.windSpeed}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Droplets className="w-3 h-3" />
              <span>{data.humidity}%</span>
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {data.location}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherWidget;
