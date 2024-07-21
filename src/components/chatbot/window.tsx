import React, { useEffect, useState, forwardRef } from 'react';
import { ChatBotMessageProps } from '@/schemas/conversation.schema';
import { UseFormRegister } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import RealTimeMode from './real-time';
import Image from 'next/image';
import TabsMenu from '../tabs/index';
import { BOT_TABS_MENU } from '@/constants/menu';
import ChatIcon from '@/icons/chat-icon';
import { TabsContent } from '../ui/tabs';
import { Separator } from '../ui/separator';
import Bubble from './bubble';
import { Responding } from './responding';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Paperclip, Send } from 'lucide-react';
import { Label } from '../ui/label';
import { CardDescription, CardTitle } from '../ui/card';
import Accordion from '../accordian';
import UploadButton from '../upload-button';

type Props = {
  errors: any;
  register: UseFormRegister<ChatBotMessageProps>;
  chats: { role: 'assistant' | 'user'; content: string; link?: string }[];
  onChat(): void;
  onResponding: boolean;
  domainName: string;
  theme?: string | null;
  textColor?: string | null;
  help?: boolean;
  realtimeMode:
    | {
        chatroom: string;
        mode: boolean;
      }
    | undefined;
  helpdesk: {
    id: string;
    question: string;
    answer: string;
    domainId: string | null;
  }[];
  setChat: React.Dispatch<
    React.SetStateAction<
      {
        role: 'user' | 'assistant';
        content: string;
        link?: string | undefined;
      }[]
    >
  >;
};

export const BotWindow = forwardRef<HTMLDivElement, Props>(
  (
    {
      errors,
      register,
      chats,
      onChat,
      onResponding,
      domainName,
      helpdesk,
      realtimeMode,
      setChat,
      textColor,
      theme,
      help,
    },
    ref
  ) => {
    console.log(errors);

    const [deviceType, setDeviceType] = useState('');

    useEffect(() => {
      window.addEventListener('message', (e) => {
        if (e.origin !== 'https://loytech-aichatbot.vercel.app') return;
        const deviceType = e.data.deviceType;
        setDeviceType(deviceType);
      });
    }, []);

    // const containerClass = `flex flex-col bg-white rounded-xl border-[1px] overflow-hidden mr-[40px] ${
    //   deviceType === 'mobile' ? 'h-[600px] w-[320px]' : 'h-[670px] w-[450px]'
    // }`;

    return (
      // <div className={containerClass}>
      <div
        className={`flex flex-col bg-white rounded-xl border-[1px] overflow-hidden mr-[40px] ${
          deviceType === 'mobile'
            ? 'h-[600px] w-[320px]'
            : 'h-[670px] w-[450px]'
        }`}
      >
        <div className="flex justify-between px-4 pt-4">
          <div className="flex gap-2">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src="https://media.licdn.com/dms/image/C560BAQG2uZESDccJ-Q/company-logo_200_200/0/1630657161690/hogares_union_hu_logo?e=2147483647&v=beta&t=3wpvZFwRqYi06LWNPiyJvH0oOD-WNdn4swQpYLYTQyg"
                alt="@shadcn"
              />
              <AvatarFallback>HU</AvatarFallback>
            </Avatar>
            <div className="flex items-start flex-col">
              <h3 className="text-lg font-bold leading-none">
                Asistente Virtual
              </h3>
              <p className="text-sm">{domainName.split('.com')[0]}</p>
              {realtimeMode?.mode && (
                <RealTimeMode
                  setChats={setChat}
                  chatRoomId={realtimeMode.chatroom}
                />
              )}
            </div>
          </div>
          {/* <div className="relative w-16 h-16">
            <Image
              src="https://ucarecdn.com/019dd17d-b69b-4dea-a16b-60e0f25de1e9/propuser.png"
              fill
              alt="users"
              objectFit="contain"
            />
          </div> */}
        </div>
        <TabsMenu
          triggers={BOT_TABS_MENU}
          className=" bg-transparent border-[1px] border-border m-2"
        >
          <TabsContent value="chat">
            <Separator orientation="horizontal" />
            <div className="flex flex-col h-full">
              <div
                style={{
                  background: theme || '',
                  color: textColor || '',
                }}
                className={`px-3 flex sm:h-[330px] flex-col py-5 gap-3 chat-window overflow-y-auto ${
                  deviceType === 'mobile' ? 'h-[330px]' : 'h-[400px]'
                }`}
                ref={ref}
              >
                {chats.map((chat, key) => (
                  <Bubble key={key} message={chat} />
                ))}
                {onResponding && <Responding />}
              </div>
              <form
                onSubmit={onChat}
                className="flex px-3 py-1 flex-col flex-1 bg-porcelain"
              >
                <div className="flex justify-between">
                  <Input
                    {...register('content')}
                    placeholder="Type your message..."
                    className="focus-visible:ring-0 flex-1 p-0 focus-visible:ring-offset-0 bg-porcelain rounded-none outline-none border-none"
                  />
                  <Button type="submit" className="mt-3">
                    <Send />
                  </Button>
                </div>
                <Label htmlFor="bot-image">
                  {/* <Paperclip /> */}
                  <Input
                    {...register('image')}
                    type="file"
                    id="bot-image"
                    className="hidden"
                  />
                </Label>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="Preguntas Frecuentes">
            <div className="h-[465px] overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-4">
              <div>
                <CardTitle>Preguntas Frecuentes</CardTitle>
                <CardDescription>
                  Preguntas que las personas nos hacen frecuentemente.
                </CardDescription>
              </div>
              <Separator orientation="horizontal" />

              {helpdesk.map((desk) => (
                <Accordion
                  key={desk.id}
                  trigger={desk.question}
                  content={desk.answer}
                />
              ))}
            </div>
          </TabsContent>
        </TabsMenu>
        <div className="flex justify-center ">
          <p className="text-gray-400 text-xs p-4">Powered By LoyTech</p>
        </div>
      </div>
    );
  }
);

BotWindow.displayName = 'BotWindow';
