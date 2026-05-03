import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Onboarding from "./components/forms/Onboarding";
import User_Dashboard from "./components/pages/User_Dashboard";
import Campaign_Create from "./components/forms/Campaign_Create";
import SampleForm from "./components/forms/sample";

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
      </Routes>
    </BrowserRouter>
  )
}

export default App
