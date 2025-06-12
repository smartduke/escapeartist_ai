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
      "bg-light-primary/50 dark:bg-dark-primary/50 backdrop-blur-lg rounded-xl",
      "border border-black/5 dark:border-white/5",
      "shadow-sm hover:shadow-md transition-shadow duration-300",
      "flex items-center justify-between lg:justify-start gap-3 px-3 py-2 h-[52px] w-full"
    )}>
      {loading ? (
        <div className="flex items-center gap-3 w-full animate-pulse">
          <div className="h-8 w-8 rounded-full bg-black/5 dark:bg-white/5" />
          <div className="space-y-2 flex-1">
            <div className="h-2 w-20 rounded bg-black/5 dark:bg-white/5" />
            <div className="h-2 w-16 rounded bg-black/5 dark:bg-white/5" />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1">
            <img
              src={`/weather-ico/${data.icon}.svg`}
              alt={data.condition}
              className="h-7 w-7"
            />
            <span className="text-base font-medium text-black dark:text-white">
              {data.temperature}°
            </span>
          </div>
          <div className="h-6 w-[1px] bg-black/5 dark:bg-white/5" />
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-black/60 dark:text-white/60">
              <Wind className="w-3 h-3" />
              <span>{data.windSpeed}km/h</span>
            </div>
            <div className="flex items-center gap-1 text-black/60 dark:text-white/60">
              <Droplets className="w-3 h-3" />
              <span>{data.humidity}%</span>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-black/5 dark:bg-white/5" />
          <div className="text-xs">
            <span className="font-medium text-black dark:text-white">
              {data.location}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherWidget;
