'use server';

import { client } from '@/lib/prisma';
import { extractEmailsFromString, extractURLfromString } from '@/lib/utils';
import { onRealTimeChat } from '../conversation';
import { clerkClient } from '@clerk/nextjs';
import { onMailer } from '../mailer';
import OpenAi from 'openai';

const openai = new OpenAi({
  apiKey: process.env.OPEN_AI_KEY,
});

export const onStoreConversations = async (
  id: string,
  message: string,
  role: 'assistant' | 'user'
) => {
  const chatRoomData = await client.chatRoom.update({
    where: {
      id,
    },
    data: {
      message: {
        create: {
          message,
          role,
        },
      },
    },
  });

  return chatRoomData;
};

export const onGetCurrentChatBot = async (id: string) => {
  try {
    const chatbot = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        helpdesk: true,
        name: true,
        chatBot: {
          select: {
            id: true,
            welcomeMessage: true,
            icon: true,
            textColor: true,
            background: true,
            helpdesk: true,
          },
        },
      },
    });

    if (chatbot) {
      return chatbot;
    }
  } catch (error) {
    console.log(error);
  }
};

let customerEmail: string | undefined;

export const findChatRoom = async (id: string, customerid: string) => {
  try {
    const chatBotDomain = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        filterQuestions: {
          where: {
            answered: null,
          },
          select: {
            question: true,
          },
        },
      },
    });
    if (chatBotDomain && customerid) {
      const checkCustomer = await client.customer.findUnique({
        where: {
          id: customerid,
        },
        select: {
          id: true,
          email: true,
          questions: true,
          chatRoom: {
            select: {
              id: true,
              live: true,
              mailed: true,
            },
          },
        },
      });

      if (checkCustomer) {
        // console.log('Customer already exist -------> ', checkCustomer.id);

        return checkCustomer.id;
      }
    } else {
      const newCustomer = await client.domain.update({
        where: {
          id,
        },
        data: {
          customer: {
            create: {
              email: '',
              questions: {
                create: chatBotDomain?.filterQuestions,
              },
              chatRoom: {
                create: {},
              },
            },
          },
        },
        select: {
          customer: {
            select: {
              id: true,
            },
          },
        },
      });

      const customer = newCustomer.customer[newCustomer.customer.length - 1];
      const customerId = customer.id;
      console.log('New customer created: ', customerId);

      return customerId;
    }
  } catch (error) {
    console.log(error);
  }
};

// export const testing = async (id: string) => {
//   console.log('start testing');
//   const chatBotDomain = await client.domain.findUnique({
//     where: {
//       id,
//     },
//     select: {
//       name: true,
//       filterQuestions: {
//         where: {
//           answered: null,
//         },
//         select: {
//           question: true,
//         },
//       },
//     },
//   });

//   if (chatBotDomain) {
//     const newCustomer = await client.domain.update({
//       where: {
//         id,
//       },
//       data: {
//         customer: {
//           create: {
//             email: '',
//             questions: {
//               create: chatBotDomain.filterQuestions,
//             },
//             chatRoom: {
//               create: {},
//             },
//           },
//         },
//       },
//       select: {
//         customer: {
//           select: {
//             id: true,
//           },
//         },
//       },
//     });

//     const customer = newCustomer.customer[newCustomer.customer.length - 1];
//     const customerId = customer.id;
//     console.log('New customer created: ', customerId);

//     return customerId;
//   }
// };

// testing('66820e6d58b78dafdfccbdc5');

export const onAiChatBotAssistant = async (
  id: string,
  customerId: string,
  chat: { role: 'assistant' | 'user'; content: string }[],
  author: 'user',
  message: string
) => {
  try {
    const chatBotDomain = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        filterQuestions: {
          where: {
            answered: null,
          },
          select: {
            question: true,
          },
        },
      },
    });
    if (chatBotDomain) {
      const checkCustomerID = await client.customer.findMany({
        where: {
          id: customerId,
        },
      });
      const userID = checkCustomerID[0].id;

      // Retrieve the chat room to check if it already has a threadId
      const chatRoom = await client.chatRoom.findFirst({
        where: {
          customerId: customerId,
        },
        select: {
          id: true,
          threadId: true,
        },
      });

      if (chatRoom && chatRoom.id) {
        const checkCustomer = await client.domain.findUnique({
          where: {
            id,
          },
          select: {
            User: {
              select: {
                clerkId: true,
              },
            },
            name: true,
            customer: {
              where: {
                email: {
                  startsWith: customerEmail,
                },
              },
              select: {
                id: true,
                email: true,
                questions: true,
                chatRoom: {
                  select: {
                    id: true,
                    live: true,
                    mailed: true,
                  },
                },
              },
            },
          },
        });
        // console.log('checkCustomer ---->', checkCustomer?.customer);

        // if (checkCustomer && !checkCustomer.customer.length) {
        //   const newCustomer = await client.domain.update({
        //     where: {
        //       id,
        //     },
        //     data: {
        //       customer: {
        //         create: {
        //           email: userID,
        //           questions: {
        //             create: chatBotDomain.filterQuestions,
        //           },
        //           chatRoom: {
        //             create: {},
        //           },
        //         },
        //       },
        //     },
        //   });
        //   if (newCustomer) {
        //     console.log('new customer made');
        //     const response = {
        //       role: 'assistant',
        //       content: `Welcome aboard ${userID}! I'm glad to connect with you. Is there anything you need help with?`,
        //     };
        //     return { response };
        //   }
        // }
        // if (checkCustomer && checkCustomer.customer[0].chatRoom[0].live) {
        //   await onStoreConversations(chatRoom.id, message, author);

        //   console.log('realtime mode start');

        //   onRealTimeChat(
        //     checkCustomer.customer[0].chatRoom[0].id,
        //     message,
        //     'user',
        //     author
        //   );
        //   console.log('realtime mode end');

        //   if (!checkCustomer.customer[0].chatRoom[0].mailed) {
        //     const user = await clerkClient.users.getUser(
        //       checkCustomer.User?.clerkId!
        //     );

        //     onMailer(user.emailAddresses[0].emailAddress);

        //     //update mail status to prevent spamming
        //     const mailed = await client.chatRoom.update({
        //       where: {
        //         id: checkCustomer.customer[0].chatRoom[0].id,
        //       },
        //       data: {
        //         mailed: true,
        //       },
        //     });

        //     if (mailed) {
        //       return {
        //         live: true,
        //         chatRoom: checkCustomer.customer[0].chatRoom[0].id,
        //       };
        //     }
        //   }
        //   return {
        //     live: true,
        //     chatRoom: checkCustomer.customer[0].chatRoom[0].id,
        //   };
        // }

        await onStoreConversations(chatRoom.id, message, author);

        // OpenAI Assistant API implementation
        // const assistantId = 'asst_uhKITAfduM7SQEZ0pKuM3yqY';
        const assistantId = 'asst_8v7HVQNHduFzJd8MCsjVWuoc';
        let threadId: any;

        // console.log('chatRoom ---------->', chatRoom);

        if (chatRoom?.threadId) {
          threadId = chatRoom.threadId;
        } else {
          threadId = await openai.beta.threads.create();
          console.log('New thread created ------------->', threadId.id);

          // Add initial instructions as the first message
          await openai.beta.threads.messages.create(threadId.id, {
            role: 'assistant',
            content: `
              Recibirás una serie de preguntas que debes hacerle al cliente.
          
              Progresa la conversación utilizando esas preguntas.
          
              Serie de preguntas: [${chatBotDomain.filterQuestions
                .map((questions) => questions.question)
                .join(', ')}]
          
              Si el cliente dice algo fuera de contexto, inapropiado o quiere hablar con un humano, simplemente di que esto está fuera de tu alcance y conseguirás un usuario real para continuar la conversación. Y añade esta palabra clave "(realtime)" al final, no lo olvides.
              `,
          });
        }

        await client.chatRoom.updateMany({
          where: {
            customerId: customerId,
          },
          data: {
            threadId: threadId.id,
          },
        });

        threadId = threadId.id ? threadId.id : threadId;

        console.log(
          `Received message: ${message} for thread ID: ${
            threadId.id ? threadId.id : threadId
          }`
        );

        // Create a new message in the thread
        await openai.beta.threads.messages.create(threadId, {
          role: 'user',
          content: message,
        });

        // Run the Assistant
        const run = await openai.beta.threads.runs.create(threadId, {
          assistant_id: assistantId,
        });

        let runStatus;
        do {
          runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        } while (runStatus.status !== 'completed');

        const messages = await openai.beta.threads.messages.list(threadId);
        const assistantResponse = messages.data[0].content[0].text.value;

        console.log(`Assistant response: ${assistantResponse}`);

        // Store the assistant's response
        await onStoreConversations(chatRoom.id, assistantResponse, 'assistant');

        const response = {
          role: 'assistant',
          content: assistantResponse.replace('(realtime)', ''),
          customerId,
        };

        if (assistantResponse.includes('(realtime)')) {
          await client.chatRoom.update({
            where: {
              id: chatRoom.id,
            },
            data: {
              live: true,
            },
          });

          console.log('realtime mode start');

          // onRealTimeChat(customerId, message, 'user', author);

          return {
            live: true,
            chatRoom: chatRoom.id,
            response,
          };
        }

        return { response };

        // const chatCompletion = await openai.chat.completions.create({
        //   messages: [
        //     {
        //       role: 'assistant',
        //       content: `
        //       You will get an array of questions that you must ask the customer.

        //       Progress the conversation using those questions.

        //       Whenever you ask a question from the array i need you to add a keyword at the end of the question (complete) this keyword is extremely important.

        //       Do not forget it.

        //       only add this keyword when your asking a question from the array of questions. No other question satisfies this condition

        //       Always maintain character and stay respectfull.

        //       The array of questions : [${chatBotDomain.filterQuestions
        //         .map((questions) => questions.question)
        //         .join(', ')}]

        //       if the customer says something out of context or inapporpriate. Simply say this is beyond you and you will get a real user to continue the conversation. And add a keyword (realtime) at the end.

        //       if the customer agrees to book an appointment send them this link http://localhost:3000/portal/${id}/appointment/${
        //         checkCustomer?.customer[0].id
        //       }

        //       if the customer wants to buy a product redirect them to the payment page http://localhost:3000/portal/${id}/payment/${
        //         checkCustomer?.customer[0].id
        //       }
        //   `,
        //     },
        //     ...chat,
        //     {
        //       role: 'user',
        //       content: message,
        //     },
        //   ],
        //   model: 'gpt-3.5-turbo',
        // });

        // if (chatCompletion.choices[0].message.content?.includes('(realtime)')) {
        //   const realtime = await client.chatRoom.update({
        //     where: {
        //       id: checkCustomer?.customer[0].chatRoom[0].id,
        //     },
        //     data: {
        //       live: true,
        //     },
        //   });

        //   if (realtime) {
        //     const response = {
        //       role: 'assistant',
        //       content: chatCompletion.choices[0].message.content.replace(
        //         '(realtime)',
        //         ''
        //       ),
        //     };

        //     await onStoreConversations(
        //       checkCustomer?.customer[0].chatRoom[0].id!,
        //       response.content,
        //       'assistant'
        //     );

        //     return { response };
        //   }
        // }
        // if (chat[chat.length - 1].content.includes('(complete)')) {
        //   const firstUnansweredQuestion =
        //     await client.customerResponses.findFirst({
        //       where: {
        //         customerId: checkCustomer?.customer[0].id,
        //         answered: null,
        //       },
        //       select: {
        //         id: true,
        //       },
        //       orderBy: {
        //         question: 'asc',
        //       },
        //     });
        //   if (firstUnansweredQuestion) {
        //     await client.customerResponses.update({
        //       where: {
        //         id: firstUnansweredQuestion.id,
        //       },
        //       data: {
        //         answered: message,
        //       },
        //     });
        //   }
        // }

        // if (chatCompletion) {
        //   const generatedLink = extractURLfromString(
        //     chatCompletion.choices[0].message.content as string
        //   );

        //   if (generatedLink) {
        //     const link = generatedLink[0];
        //     const response = {
        //       role: 'assistant',
        //       content: `Great! you can follow the link to proceed`,
        //       link: link.slice(0, -1),
        //     };

        //     await onStoreConversations(
        //       checkCustomer?.customer[0].chatRoom[0].id!,
        //       `${response.content} ${response.link}`,
        //       'assistant'
        //     );

        //     return { response };
        //   }

        //   const response = {
        //     role: 'assistant',
        //     content: chatCompletion.choices[0].message.content,
        //   };

        //   await onStoreConversations(
        //     checkCustomer?.customer[0].chatRoom[0].id!,
        //     `${response.content}`,
        //     'assistant'
        //   );

        //   return { response };
        // }
      }
      // console.log('No customer');
      // const chatCompletion = await openai.chat.completions.create({
      //   messages: [
      //     {
      //       role: 'assistant',
      //       content: `
      //       You are a highly knowledgeable and experienced sales representative for a ${chatBotDomain.name}, real state company that offers houses in Mexico. Your goal is to have a natural, human-like conversation with the customer in order to understand their needs, provide relevant information, and ultimately guide them towards making a purchase or redirect them to a link if they havent provided all relevant information.
      //       Right now you are talking to a customer for the first time. Start by giving them a warm welcome on behalf of ${chatBotDomain.name} and make them feel welcomed.

      //       Your next task is lead the conversation naturally to get the customers email address. Be respectful and never break character

      //     `,
      //     },
      //     ...chat,
      //     {
      //       role: 'user',
      //       content: message,
      //     },
      //   ],
      //   model: 'gpt-3.5-turbo',
      // });

      // if (chatCompletion) {
      //   const response = {
      //     role: 'assistant',
      //     content: chatCompletion.choices[0].message.content,
      //   };

      //   return { response };
      // }
    }
  } catch (error) {
    console.log(error);
  }
};
