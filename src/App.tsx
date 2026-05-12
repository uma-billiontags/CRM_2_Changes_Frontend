import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Onboarding from "./components/forms/Onboarding";
import User_Dashboard from "./components/pages/User_Dashboard";
import Campaign_Create from "./components/forms/Campaign_Create";
import SampleForm from "./components/forms/sample";
import Creative_Upload from "./components/pages/Creative_Upload";
import Creative_Video_Upload from "./components/pages/Creative_Video_Upload";
import User_Campaigns from "./components/pages/User_Campaigns";
import View_Campaign from "./components/pages/View_Campaign";
import Edit_Campaign from "./components/pages/Edit_Campaign";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/user_dashboard" element={<User_Dashboard />} />
        <Route path="/campaign_create" element={<Campaign_Create />} />
        <Route path="/sample" element={<SampleForm />} />
        <Route path="/creative_upload" element={<Creative_Upload />} />
        <Route path="/creative_video_upload" element={<Creative_Video_Upload />} />
        <Route path="/user_campaigns" element={<User_Campaigns />} />
        <Route path="/campaign/:campaign_id" element={<View_Campaign />} />
        <Route path="/update_campaign/:campaign_id" element={<Edit_Campaign/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
