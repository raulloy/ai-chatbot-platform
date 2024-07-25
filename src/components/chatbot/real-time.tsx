import React from 'react';
import { Card } from '../ui/card';
import { useRealTime } from '@/hooks/chatbot/use-chatbot';

type Props = {
  chatRoomId: string;
  setChats: React.Dispatch<
    React.SetStateAction<
      {
        role: 'user' | 'assistant';
        content: string;
        link?: string | undefined;
      }[]
    >
  >;
};

const RealTimeMode = ({ chatRoomId, setChats }: Props) => {
  useRealTime(chatRoomId, setChats);

  return (
    <Card className="px-3 rounded-full py-1 bg-blue-600 font-bold text-white text-sm">
      Live
    </Card>
  );
};

export default RealTimeMode;
