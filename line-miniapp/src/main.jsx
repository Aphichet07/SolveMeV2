import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Header from './components/header.jsx'
import Footer from './components/footer.jsx'
import HomePage from './pages/Home.jsx'
import LoadingPage from './pages/loading.jsx'
import SearchBar from './components/searchbar.jsx'
import SplashPage from "./pages/splash.jsx"
import FooterNav from "./components/footer.jsx"
import Bubble from './components/bubble.jsx'
import ChatPage from './pages/chat.jsx'
import TipAfterChatPage from "./pages/tipPage.jsx"
import BubbleDetailModal from "./components/BubbleDetailModel.jsx"
import DailyQuestAccordion from "./components/dairy.jsx"
import CarryProfilePage from "./pages/CarryProfilePage.jsx"
import TipModal from "./components/TipModal.jsx"
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
// const mockProfile = {
//   displayName: "Jimmy (Requester)",
//   userId: "U1234567890",
//   pictureUrl: "https://picsum.photos/100", 
// };

// const mockSolver = {
//   id: "solver-001",
//   name: "Solver P",
//   avatarUrl: "https://picsum.photos/101",
// };

// const mockBubble = {
//   id: "HXuquaMscppJ4nPkbmSb",
//   title: "อยากหาคนช่วยย้ายของขึ้นหอพัก",
//   description: "มีของหนักนิดหน่อย แต่อยู่ไม่ไกลจากลิฟต์ ขอคนช่วยยกประมาณ 30 นาที",
// };

// const mockMatchId = "ZdTi2U8T4NVDqYTJNY7A";

// const handleBack = () => {
//   console.log("Back pressed from ChatPage (dev mode)");
// };

// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//     <ChatPage
//       profile={mockProfile}
//       matchId={mockMatchId}
//       bubble={mockBubble}      
//       otherUser={mockSolver} 
//       onBack={handleBack}
//     />
//   </StrictMode>
// );


// ----------------------------------


// -----------------------------------
// const mockProfile = {
//   displayName: "Jimmy (Requester)",
//   userId: "U1234567890",
//   pictureUrl: "https://picsum.photos/100",
// };

// const mockSolver = {
//   id: "solver-001",
//   name: "Solver P",
//   avatarUrl: "https://picsum.photos/101",
// };

// const mockBubble = {
//   id: "HXuquaMscppJ4nPkbmSb",
//   title: "อยากหาคนช่วยย้ายของขึ้นหอพัก",
//   description:
//     "มีของหนักนิดหน่อย แต่อยู่ไม่ไกลจากลิฟต์ ขอคนช่วยยกประมาณ 30 นาที",
// };

// const mockMatchId = "ZdTi2U8T4NVDqYTJNY7A";

// const handleSkip = () => {
//   console.log("Skip tip (dev mode)");
// };

// const handlePaidStart = () => {
//   console.log("Start LINE Pay (dev mode)");
// };

// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//     <TipAfterChatPage
//       profile={mockProfile}
//       solver={mockSolver}
//       matchId={mockMatchId}
//       bubble={mockBubble}
//       onSkip={handleSkip}
//       onPaidStart={handlePaidStart}
//     />
//   </StrictMode>
// );