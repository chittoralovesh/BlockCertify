import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Issue from "./pages/Issue";
import Verify from "./pages/verify";
import Certificates from "./pages/Certificates";
import CertificateDetail from "./pages/CertificateDetail";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/issue" element={<Issue />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/certificates/:id" element={<CertificateDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
