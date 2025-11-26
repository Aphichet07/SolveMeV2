import { db } from "../utils/firebaseClient.js";
import { collection, Timestamp } from "firebase/firestore";

const ChatRoomSchemas = {
  match_id: String,
  create_at: Timestamp,
};

const ChatMessageSchemas = {
  chat_message_id: String,
  chat_room_id: String,
  sender_id: String,
  message: String,
  create_at: Timestamp,
};

const getMessagesCollection = (chatRoomId) => {
  return collection(db, "chat_rooms", chatRoomId, "messages");
};

export { getMessagesCollection, ChatRoomSchemas, ChatMessageSchemas };

export default getMessagesCollection;
