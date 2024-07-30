import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import PusherClient from 'pusher-js';
import PusherServer from 'pusher';
import { Client } from '@hubspot/api-client';
import axios from 'axios';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const extractUUIDFromString = (url: string) => {
  return url.match(
    /^[0-9a-f]{8}-?[0-9a-f]{4}-?[1-5][0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i
  );
};

export const pusherServer = new PusherServer({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID as string,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY as string,
  secret: process.env.NEXT_PUBLIC_PUSHER_APP_SECRET as string,
  cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTOR as string,
  useTLS: true,
});

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY as string,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTOR as string,
  }
);

export const postToParent = (message: string) => {
  window.parent.postMessage(message, '*');
};

export const extractURLfromString = (url: string) => {
  return url.match(/https?:\/\/[^\s"<>]+/);
};

export const extractEmailsFromString = (text: string) => {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
};

export const createHubSpotContact = async (
  firstname: string,
  lastname: string,
  phone: string,
  email: string
) => {
  const hubspotClient = new Client({
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
  });

  const properties = {
    firstname,
    lastname,
    phone,
    email,
  };

  try {
    const response = await axios({
      url: `https://api.hubapi.com/crm/v3/objects/contacts/search`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      data: {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email,
              },
            ],
          },
        ],
        properties: [
          'createdate',
          'firstname',
          'lastname',
          'email',
          'canal_de_captacion',
          'sub_canal_de_captacion',
          'desarrollo',
          'lifecyclestage',
        ],
      },
    });

    const emailValidation = response.data.results[0]?.properties.email;

    if (email !== emailValidation) {
      const apiResponse = await hubspotClient.crm.contacts.basicApi.create({
        properties,
        associations: [],
      });
      console.log('Contact created successfully.');
      return apiResponse;
    } else {
      console.log('Contact is already created');
    }
  } catch (error: any) {
    console.error(
      `Failed to create contact: ${error.message}`,
      error.response ? JSON.stringify(error.response.status, null, 2) : ''
    );
    throw error;
  }
};

export const getMonthName = (month: number) => {
  return month == 1
    ? 'Jan'
    : month == 2
    ? 'Feb'
    : month == 3
    ? 'Mar'
    : month == 4
    ? 'Apr'
    : month == 5
    ? 'May'
    : month == 6
    ? 'Jun'
    : month == 7
    ? 'Jul'
    : month == 8
    ? 'Aug'
    : month == 9
    ? 'Sep'
    : month == 10
    ? 'Oct'
    : month == 11
    ? 'Nov'
    : month == 12 && 'Dec';
};
