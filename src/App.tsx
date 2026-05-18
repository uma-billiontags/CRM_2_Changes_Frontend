import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Onboarding from "./components/pages/Onboarding";
import User_Dashboard from "./components/user_dashboard/User_Dashboard";
import Campaign_Create from "./components/user_dashboard/Campaign_Create";
import Creative__Image_Upload from "./components/user_dashboard/Creative_Image_Upload";
import Creative_Video_Upload from "./components/user_dashboard/Creative_Video_Upload";
import User_Campaigns from "./components/user_dashboard/User_Campaigns";
import View_Campaign from "./components/user_dashboard/View_Campaign";
import Edit_Campaign from "./components/user_dashboard/Edit_Campaign";
import User_Drafts from "./components/user_dashboard/User_Drafts";
import Creative_Dashboard from "./components/creatives_team_dashboard/Creative_Dashboard";
import Image_Creatives from "./components/creatives_team_dashboard/Image_Creatives";
import Video_Creatives from "./components/creatives_team_dashboard/Video_Creatives";
import View_Creative from "./components/creatives_team_dashboard/View_Creative";
import Third_Party_Creative from "./components/creatives_team_dashboard/Third_Party_Creative";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/user_dashboard" element={<User_Dashboard />} />
        <Route path="/campaign_create" element={<Campaign_Create />} />
        <Route path="/creative_image_upload" element={<Creative__Image_Upload />} />
        <Route path="/creative_video_upload" element={<Creative_Video_Upload />} />
        <Route path="/user_campaigns" element={<User_Campaigns />} />
        <Route path="/campaign/:campaign_id" element={<View_Campaign />} />
        <Route path="/update_campaign/:campaign_id" element={<Edit_Campaign />} />
        <Route path="/user_drafts" element={<User_Drafts />} />
        <Route path="/creative_dashboard" element={<Creative_Dashboard />} />
        <Route path="/image_creatives" element={<Image_Creatives />} />
        <Route path="/video_creatives" element={<Video_Creatives />} />
        <Route path="/creative/:campaign_id" element={<View_Creative />} />
        <Route path="/third_party_creatives" element={<Third_Party_Creative />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
