import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../auth';
import { toLocalInput } from '../utils/format';

const empty = { title: '', description: '', startsAt: '', location: '', tags: '' };

export default function EventForm({ editMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(editMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // When editing, load the existing event (only its organiser may edit it)
  useEffect(() => {
    if (!editMode) return;
    api.get(`/events/${id}`)
      .then(({ data: { event } }) => {
        if (event.organiser?._id !== user?._id) {
          setError('Only the organiser can edit this event.');
          return;
        }
        setForm({
          title: event.title,
          description: event.description,
          startsAt: toLocalInput(event.startsAt),
          location: event.location,
          tags: event.tags.join(', '),
        });
      })
      .catch((err) => setError(errorMessage(err, 'Could not load event.')))
      .finally(() => setLoading(false));
  }, [editMode, id, user]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    // datetime-local has no time zone: interpret it in the browser's zone and send UTC
    const payload = { ...form, startsAt: new Date(form.startsAt).toISOString() };
    try {
      const res = editMode
        ? await api.put(`/events/${id}`, payload)
        : await api.post('/events', payload);
      navigate(`/events/${res.data.event._id}`);
    } catch (err) {
      setError(errorMessage(err, 'Could not save event.'));
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  // Editing an event that couldn't be loaded or isn't yours: show the reason only
  if (editMode && error && !form.title) return <Alert variant="danger">{error}</Alert>;

  return (
    <Card className="mx-auto" style={{ maxWidth: 760 }}>
      <Card.Body className="p-4">
        <h1 className="h4 mb-4">{editMode ? 'Edit event' : 'Post a new event'}</h1>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="title">
            <Form.Label>Title</Form.Label>
            <Form.Control required maxLength={120} value={form.title} onChange={set('title')} placeholder="e.g. Intro to SQL Workshop" />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="startsAt">
                <Form.Label>Date and time</Form.Label>
                <Form.Control required type="datetime-local" value={form.startsAt} onChange={set('startsAt')} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="location">
                <Form.Label>Location</Form.Label>
                <Form.Control required maxLength={200} value={form.location} onChange={set('location')} placeholder="Venue, suburb or Online" />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Description</Form.Label>
            <Form.Control required as="textarea" rows={6} maxLength={5000} value={form.description} onChange={set('description')} placeholder="What's happening, who it's for, what to bring…" />
          </Form.Group>
          <Form.Group className="mb-4" controlId="tags">
            <Form.Label>Tags</Form.Label>
            <Form.Control value={form.tags} onChange={set('tags')} placeholder="e.g. data, workshop, beginners" />
            <Form.Text muted>Separate tags with commas.</Form.Text>
          </Form.Group>
          {!editMode && (
            <Alert variant="info" className="small py-2">Your followers will be notified as soon as you post.</Alert>
          )}
          <div className="d-flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editMode ? 'Save changes' : 'Post event'}
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
