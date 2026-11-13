import React, { useEffect, useRef, useState } from 'react';
import { Navbar, Nav, Container, Button, Badge, NavDropdown, Toast, ToastContainer } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, CalendarEvent } from 'react-bootstrap-icons';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../auth';
import { formatDateTime, timeSince } from '../utils/format';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState(null); // latest live notification
  const socketRef = useRef(null);

  const unseen = notifications.filter((n) => !n.seen).length;

  // While logged in: load saved notifications and open a live connection
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return undefined;
    }

    api.get('/notifications')
      .then((res) => setNotifications(res.data.notifications))
      .catch((err) => console.error('Could not load notifications', err));

    const socket = io({ withCredentials: true });
    socketRef.current = socket;
    socket.on('new_event', (notif) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n._id !== notif._id)]);
      setToast(notif);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Opening the bell menu marks everything as seen
  const handleToggle = (next) => {
    setShowMenu(next);
    if (next && unseen > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
      api.patch('/notifications/seen').catch((err) => console.error('Could not mark seen', err));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="md" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
            <CalendarEvent /> EventBoard
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/" end>Events</Nav.Link>
              {user && <Nav.Link as={NavLink} to="/following">Following</Nav.Link>}
              {user?.isAdmin && <Nav.Link as={NavLink} to="/admin">Admin</Nav.Link>}
            </Nav>
            <Nav className="align-items-md-center gap-md-2">
              {user ? (
                <>
                  <Button as={Link} to="/events/new" size="sm" variant="primary" className="my-2 my-md-0">
                    + New event
                  </Button>
                  <NavDropdown
                    align="end"
                    show={showMenu}
                    onToggle={handleToggle}
                    menuVariant="light"
                    aria-label={`Notifications${unseen ? `, ${unseen} unread` : ''}`}
                    title={
                      <span className="position-relative">
                        <Bell size={20} />
                        {unseen > 0 && (
                          <Badge bg="danger" pill className="ms-1" data-testid="unseen-count">{unseen}</Badge>
                        )}
                      </span>
                    }
                  >
                    <div className="notif-menu">
                      {notifications.length === 0 ? (
                        <NavDropdown.ItemText className="text-muted">
                          No notifications yet. Follow organisers to hear about their new events.
                        </NavDropdown.ItemText>
                      ) : (
                        notifications.map((n) => (
                          <NavDropdown.Item
                            key={n._id}
                            as={Link}
                            to={`/events/${n.event._id}`}
                            className={n.seen ? '' : 'fw-semibold'}
                          >
                            <div>
                              <strong>{n.event.organiser?.username}</strong> posted{' '}
                              &ldquo;{n.event.title}&rdquo;
                            </div>
                            <small className="text-muted">
                              {formatDateTime(n.event.startsAt)} · {timeSince(n.createdAt)}
                            </small>
                          </NavDropdown.Item>
                        ))
                      )}
                    </div>
                  </NavDropdown>
                  <Navbar.Text className="d-none d-lg-inline">{user.username}</Navbar.Text>
                  <Button variant="outline-light" size="sm" onClick={handleLogout}>Log out</Button>
                </>
              ) : (
                <>
                  <Nav.Link as={NavLink} to="/login">Log in</Nav.Link>
                  <Button as={Link} to="/register" size="sm" variant="outline-light">Sign up</Button>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Pop-up shown when a live notification arrives */}
      <ToastContainer position="bottom-end" containerPosition="fixed" className="p-3" style={{ zIndex: 1080 }}>
        <Toast show={Boolean(toast)} onClose={() => setToast(null)} delay={8000} autohide>
          <Toast.Header>
            <Bell className="me-2" />
            <strong className="me-auto">New event</strong>
            <small>just now</small>
          </Toast.Header>
          {toast && (
            <Toast.Body>
              <strong>{toast.event.organiser?.username}</strong> posted{' '}
              <Link to={`/events/${toast.event._id}`} onClick={() => setToast(null)}>
                {toast.event.title}
              </Link>
              <div className="text-muted small">{formatDateTime(toast.event.startsAt)}</div>
            </Toast.Body>
          )}
        </Toast>
      </ToastContainer>
    </>
  );
}
