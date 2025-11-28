import { db } from "../utils/firebaseClient.js";
import { collection, Timestamp } from "firebase/firestore";

const ChatRoomSchemas = {
  match_id: String,
  created_at: Timestamp,
};

const ChatMessageSchemas = {
  chat_message_id: String,
  chat_room_id: String,
  sender_id: String,
  message: String,
  created_at: Timestamp,
};

const getMessagesCollection = (chatRoomId) => {
  if (!chatRoomId) {
    console.warn("[getMessagesCollection] chatRoomId is empty");
  }
  return collection(db, "rooms", chatRoomId, "messages");

};

export { getMessagesCollection, ChatRoomSchemas, ChatMessageSchemas };
export default getMessagesCollection;
