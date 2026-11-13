import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AppNavbar from './components/AppNavbar';
import { RequireAuth } from './auth';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import EventForm from './pages/EventForm';
import OrganiserProfile from './pages/OrganiserProfile';
import Following from './pages/Following';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';

function NotFound() {
  return (
    <div className="text-center mt-5">
      <h2>Page not found</h2>
      <Link to="/">Back to events</Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AppNavbar />
      <main className="container my-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events/new" element={<RequireAuth><EventForm /></RequireAuth>} />
          <Route path="/events/:id/edit" element={<RequireAuth><EventForm editMode /></RequireAuth>} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/organisers/:id" element={<OrganiserProfile />} />
          <Route path="/following" element={<RequireAuth><Following /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth admin><AdminPanel /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
