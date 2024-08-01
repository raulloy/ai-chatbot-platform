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

  const formattedContent = message.content.split('\n').map((line, index) => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const boldRegex = /\*\*([^\*]+)\*\*/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      parts.push(
        <a
          key={index + match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    const finalParts: (string | JSX.Element)[] = [];
    lastIndex = 0;

    parts.forEach((part, partIndex) => {
      if (typeof part === 'string') {
        while ((match = boldRegex.exec(part)) !== null) {
          if (match.index > lastIndex) {
            finalParts.push(part.substring(lastIndex, match.index));
          }
          finalParts.push(
            <strong key={index + partIndex + match.index}>{match[1]}</strong>
          );
          lastIndex = boldRegex.lastIndex;
        }

        if (lastIndex < part.length) {
          finalParts.push(part.substring(lastIndex));
        }

        lastIndex = 0;
      } else {
        finalParts.push(part);
      }
    });

    return (
      <span key={index}>
        {finalParts}
        <br />
      </span>
    );
  });

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
            src="https://cdn-icons-png.flaticon.com/128/16402/16402229.png"
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
          <p className="text-sm">{formattedContent}</p>
        )}
      </div>
    </div>
  );
};

export default Bubble;
