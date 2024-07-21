import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export const Responding = () => {
  return (
    <div className="self-start flex items-end gap-3">
      <Avatar className="w-5 h-5">
        <AvatarImage
          src="https://media.licdn.com/dms/image/C560BAQG2uZESDccJ-Q/company-logo_200_200/0/1630657161690/hogares_union_hu_logo?e=2147483647&v=beta&t=3wpvZFwRqYi06LWNPiyJvH0oOD-WNdn4swQpYLYTQyg"
          alt="@shadcn"
        />
        <AvatarFallback>HU</AvatarFallback>
      </Avatar>
      <div className="chat-bubble">
        <div className="typing">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};
