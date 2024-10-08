'use server';

import { client } from '@/lib/prisma';
import {
  createHubSpotContact,
  extractEmailsFromString,
  extractURLfromString,
} from '@/lib/utils';
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

let customerEmail: string | undefined;

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
        assistant: true,
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
      const extractedEmail = extractEmailsFromString(message);
      if (extractedEmail) {
        customerEmail = extractedEmail[0];
      }

      if (customerEmail) {
        // add customer email
        await client.customer.updateMany({
          where: {
            id: customerId,
          },
          data: {
            email: customerEmail,
          },
        });
      }

      const checkClerkUser = await client.domain.findUnique({
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
        },
      });

      // Retrieve the chat room to check if it already has a threadId
      const chatRoom = await client.chatRoom.findFirst({
        where: {
          customerId: customerId,
        },
        select: {
          id: true,
          live: true,
          mailed: true,
          threadId: true,
        },
      });

      if (chatRoom && chatRoom.id) {
        if (chatRoom.live) {
          console.log('Realtime mode active, skipping assistant response.');
          await onStoreConversations(chatRoom.id, message, author);
          await onRealTimeChat(chatRoom.id, message, '', 'user');

          // if (!chatRoom.mailed) {
          //   const user = await clerkClient.users.getUser(
          //     checkClerkUser?.User?.clerkId!
          //   );

          //   onMailer(user.emailAddresses[0].emailAddress);

          //   await client.chatRoom.updateMany({
          //     where: {
          //       id: chatRoom.id,
          //     },
          //     data: {
          //       mailed: true,
          //     },
          //   });

          //   //update mail status to prevent spamming
          //   const mailed = chatRoom.mailed;

          //   if (mailed) {
          //     return { live: true, chatRoom: chatRoom.id };
          //   }
          // }
          return { live: true, chatRoom: chatRoom.id };
        }

        await onStoreConversations(chatRoom.id, message, author);

        // OpenAI Assistant API implementation
        const assistantId = chatBotDomain.assistant;
        let threadId: any;

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
          assistant_id: assistantId || '',
        });

        let runStatus;
        do {
          runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);

          if (
            runStatus.status === 'requires_action' &&
            runStatus.required_action
          ) {
            const requiredAction =
              runStatus.required_action.submit_tool_outputs;
            if (requiredAction && requiredAction.tool_calls.length > 0) {
              const args = JSON.parse(
                requiredAction.tool_calls[0].function.arguments
              );
              const toolCallId = requiredAction.tool_calls[0].id;
              const output = await createHubSpotContact(
                args.firstname,
                args.lastname,
                args.phone,
                args.email,
                args.desarrollo
              );

              // Check if 'output' is defined and handle accordingly
              if (!output) {
                await openai.beta.threads.runs.submitToolOutputs(
                  threadId,
                  run.id,
                  {
                    tool_outputs: [
                      {
                        tool_call_id: toolCallId,
                        output: JSON.stringify({
                          message: 'An error occurred, please try again.',
                        }),
                      },
                    ],
                  }
                );
              } else {
                // Proceed to submit the output as before
                await openai.beta.threads.runs.submitToolOutputs(
                  threadId,
                  run.id,
                  {
                    tool_outputs: [
                      {
                        tool_call_id: toolCallId,
                        output: JSON.stringify(output),
                      },
                    ],
                  }
                );
              }
            }
          }
        } while (runStatus.status !== 'completed');

        const messages = await openai.beta.threads.messages.list(threadId);
        if (messages.data[0].content[0].type == 'text') {
          const assistantResponse = messages.data[0].content[0].text.value;

          console.log(`Assistant response: ${assistantResponse}`);

          // Extract URL if present
          const urlMatch = extractURLfromString(assistantResponse);
          const link = urlMatch ? urlMatch[0] : null;

          // Store the assistant's response
          await onStoreConversations(
            chatRoom.id,
            assistantResponse,
            'assistant'
          );

          const response = {
            role: 'assistant',
            content: assistantResponse.replace('(realtime)', ''),
            link,
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

            if (!chatRoom.mailed) {
              const user = await clerkClient.users.getUser(
                checkClerkUser?.User?.clerkId!
              );

              onMailer(user.emailAddresses[0].emailAddress);

              await client.chatRoom.updateMany({
                where: {
                  id: chatRoom.id,
                },
                data: {
                  mailed: true,
                },
              });

              //update mail status to prevent spamming
              const mailed = chatRoom.mailed;

              if (mailed) {
                return { live: true, chatRoom: chatRoom.id };
              }
            }

            return {
              live: true,
              chatRoom: chatRoom.id,
              response,
            };
          }

          return { response };
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};
