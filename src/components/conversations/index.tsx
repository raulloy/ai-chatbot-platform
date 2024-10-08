'use client';
import { useConversation } from '@/hooks/conversation/use-conversation';
import React from 'react';
import TabsMenu from '../tabs/index';
import { TABS_MENU } from '@/constants/menu';
import { TabsContent } from '../ui/tabs';
import ConversationSearch from './search';
import { Loader } from '../loader';
import ChatCard from './chat-card';
import { CardDescription } from '../ui/card';
import { Separator } from '../ui/separator';

type Props = {
  domains?:
    | {
        name: string;
        id: string;
        icon: string;
      }[]
    | undefined;
};

const ConversationMenu = ({ domains }: Props) => {
  const { register, chatRooms, loading, onGetActiveChatMessages } =
    useConversation();

  const filteredChatRooms = chatRooms.filter(
    (room) => room.chatRoom[0]?.message[0]?.message
  );

  return (
    <div className="py-3 px-0">
      <TabsMenu triggers={TABS_MENU}>
        <TabsContent value="conversations">
          <ConversationSearch domains={domains} register={register} />
          <div
            className="flex flex-col overflow-y-auto"
            style={{ height: 'calc(100vh - 8rem)' }}
          >
            <Loader loading={loading}>
              {filteredChatRooms.length ? (
                filteredChatRooms.map((room) => (
                  <ChatCard
                    seen={room.chatRoom[0]?.message[0]?.seen}
                    id={room.chatRoom[0].id}
                    onChat={() => onGetActiveChatMessages(room.chatRoom[0].id)}
                    createdAt={room.chatRoom[0].message[0]?.createdAt}
                    key={room.chatRoom[0].id}
                    title={room.email!}
                    description={room.chatRoom[0].message[0]?.message}
                  />
                ))
              ) : (
                <CardDescription>No chats for your domain</CardDescription>
              )}
            </Loader>
          </div>
          {/* All */}
        </TabsContent>
        <TabsContent value="all">
          <Separator orientation="horizontal" className="mt-5" />
          <ConversationSearch domains={domains} register={register} />
          <div
            className="flex flex-col overflow-y-auto"
            style={{ height: 'calc(100vh - 8rem)' }}
          >
            <Loader loading={loading}>
              {chatRooms.length ? (
                chatRooms.map((room) => (
                  <ChatCard
                    seen={room.chatRoom[0]?.message[0]?.seen}
                    id={room.chatRoom[0].id}
                    onChat={() => onGetActiveChatMessages(room.chatRoom[0].id)}
                    createdAt={room.chatRoom[0].message[0]?.createdAt}
                    key={room.chatRoom[0].id}
                    title={room.email!}
                    description={room.chatRoom[0].message[0]?.message}
                  />
                ))
              ) : (
                <CardDescription>No chats for you domain</CardDescription>
              )}
            </Loader>
          </div>
        </TabsContent>
        <TabsContent value="pending">
          <Separator orientation="horizontal" className="mt-5" />
          pending
        </TabsContent>
        <TabsContent value="lead gen">
          <Separator orientation="horizontal" className="mt-5" />
          lead gen
        </TabsContent>
      </TabsMenu>
    </div>
  );
};

export default ConversationMenu;
