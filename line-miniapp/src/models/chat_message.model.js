import { db } from "../utils/firebaseClient.js";
import { collection, Timestamp } from "firebase/firestore";
import { doc } from "firebase/firestore";

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

 const getRoomDoc = (roomId)=> {
  return doc(db, "rooms", roomId);
}

export { getMessagesCollection, ChatRoomSchemas, ChatMessageSchemas, getRoomDoc};
export default getMessagesCollection;
