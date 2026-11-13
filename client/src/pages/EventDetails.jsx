import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { GeoAlt, Clock } from 'react-bootstrap-icons';
import api, { errorMessage } from '../api';
import { useAuth } from '../auth';
import FollowButton from '../components/FollowButton';
import { formatDateTime, isPast } from '../utils/format';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/events/${id}`)
      .then((res) => setEvent(res.data.event))
      .catch((err) => setError(errorMessage(err, 'Could not load event.')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await api.delete(`/events/${id}`);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err, 'Could not delete event.'));
    }
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (!event) return <Alert variant="warning">{error || 'Event not found.'} <Link to="/">Back to events</Link></Alert>;

  const isOrganiser = user && event.organiser && user._id === event.organiser._id;

  return (
    <Card className="mx-auto" style={{ maxWidth: 760 }}>
      <Card.Body className="p-4">
        {error && <Alert variant="danger">{error}</Alert>}
        <h1 className="h3">
          {event.title}
          {isPast(event.startsAt) && <Badge bg="secondary" className="ms-2 align-middle fs-6">Past</Badge>}
        </h1>
        <div className="text-muted mb-3 d-flex flex-column gap-1">
          <span><Clock className="me-2" />{formatDateTime(event.startsAt)}</span>
          <span><GeoAlt className="me-2" />{event.location}</span>
        </div>

        <div className="d-flex align-items-center gap-3 mb-4">
          <span>
            Organised by{' '}
            {event.organiser ? (
              <Link to={`/organisers/${event.organiser._id}`}>{event.organiser.username}</Link>
            ) : 'a deleted user'}
          </span>
          <FollowButton organiserId={event.organiser?._id} size="sm" />
        </div>

        <p className="description">{event.description}</p>

        {event.tags?.length > 0 && (
          <div className="mb-3">
            {event.tags.map((t) => (
              <Link key={t} to={`/?search=${encodeURIComponent(t)}`} className="me-1">
                <Badge bg="light" text="dark" className="border">{t}</Badge>
              </Link>
            ))}
          </div>
        )}

        {isOrganiser && (
          <div className="d-flex gap-2 border-top pt-3">
            <Button as={Link} to={`/events/${id}/edit`}>Edit</Button>
            <Button variant="outline-danger" onClick={handleDelete}>Delete</Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
