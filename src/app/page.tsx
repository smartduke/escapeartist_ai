import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
      title: 'Chat - EscapeArtist AI',
    description: 'Chat with the internet using EscapeArtist AI\'s advanced AI-powered search.',
};

const Home = () => {
  return (
    <div>
      <Suspense>
        <ChatWindow />
      </Suspense>
    </div>
  );
};

export default Home;
