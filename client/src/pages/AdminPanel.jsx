import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { formatDateTime } from '../utils/format';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin')
      .then((res) => {
        setUsers(res.data.users);
        setEvents(res.data.events);
      })
      .catch((err) => setError(errorMessage(err, 'Could not load admin data.')))
      .finally(() => setLoading(false));
  }, []);

  const removeEvent = async (id) => {
    if (!window.confirm('Delete this event for everyone?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      setError(errorMessage(err, 'Could not delete event.'));
    }
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;

  return (
    <>
      <h1 className="h3 mb-3">Admin</h1>
      {error && <Alert variant="danger">{error}</Alert>}

      <h2 className="h5">Events ({events.length})</h2>
      <Table hover responsive className="bg-white mb-4">
        <thead>
          <tr><th>Title</th><th>Organiser</th><th>Starts</th><th aria-label="Actions" /></tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e._id}>
              <td><Link to={`/events/${e._id}`}>{e.title}</Link></td>
              <td>{e.organiser?.username ?? '—'}</td>
              <td>{formatDateTime(e.startsAt)}</td>
              <td className="text-end">
                <Button size="sm" variant="outline-danger" onClick={() => removeEvent(e._id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h2 className="h5">Users ({users.length})</h2>
      <Table hover responsive className="bg-white">
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>
                <Link to={`/organisers/${u._id}`}>{u.username}</Link>
                {u.isAdmin && <Badge bg="dark" className="ms-2">admin</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
