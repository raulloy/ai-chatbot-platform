import React from 'react';
import { cn, extractUUIDFromString, getMonthName } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  message: {
    role: 'assistant' | 'user';
    content: string;
    link?: string;
  };
  createdAt?: Date;
};

const Bubble = ({ message, createdAt }: Props) => {
  let d = new Date();

  if (!message) {
    return null;
  }

  const image = extractUUIDFromString(message.content);

  const formattedContent = message.content.split('\n').map((line, index) => (
    <span key={index}>
      {line}
      <br />
    </span>
  ));

  return (
    <div
      className={cn(
        'flex gap-2 items-end',
        message.role == 'assistant' ? 'self-start' : 'self-end flex-row-reverse'
      )}
    >
      {message.role == 'assistant' ? (
        <Avatar className="w-5 h-5">
          <AvatarImage
            src="https://media.licdn.com/dms/image/C560BAQG2uZESDccJ-Q/company-logo_200_200/0/1630657161690/hogares_union_hu_logo?e=2147483647&v=beta&t=3wpvZFwRqYi06LWNPiyJvH0oOD-WNdn4swQpYLYTQyg"
            alt="@shadcn"
          />
          <AvatarFallback>HU</AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="w-5 h-5">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'flex flex-col gap-3 min-w-[200px] max-w-[300px] p-4 rounded-t-md',
          message.role == 'assistant'
            ? 'bg-muted rounded-r-md'
            : 'bg-sky-200 rounded-l-md'
          // bg-blue-200
        )}
      >
        {createdAt ? (
          <div className="flex gap-2 text-xs text-gray-600">
            <p>
              {createdAt.getDate()} {getMonthName(createdAt.getMonth())}
            </p>
            <p>
              {createdAt.getHours()}:{createdAt.getMinutes()}
              {createdAt.getHours() > 12 ? 'PM' : 'AM'}
            </p>
          </div>
        ) : (
          <p className="text-xs">
            {`${d.getHours()}:${d.getMinutes()} ${
              d.getHours() > 12 ? 'pm' : 'am'
            }`}
          </p>
        )}
        {image ? (
          <div className="relative aspect-square">
            <Image src={`https://ucarecdn.com/${image[0]}/`} fill alt="image" />
          </div>
        ) : (
          <p className="text-sm">
            {formattedContent}
            {message.link && (
              <Link
                className="underline font-bold pl-2"
                href={message.link}
                target="_blank"
              >
                {message.link.replace(')', '')}
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default Bubble;
